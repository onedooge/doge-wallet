/**
 * redpacket.js — DOGE 红包功能
 *
 * 流程：
 * 1. 发红包：随机切分金额 → 存入 JSONBin.io（免费KV存储）→ 生成红包ID
 * 2. 领红包：输入红包ID → 查询剩余份额 → 链上转账到领取者地址 → 更新状态
 *
 * 存储格式（JSONBin record）：
 * {
 *   id: string,
 *   sender: string,        // 发红包者地址（缩略）
 *   greeting: string,
 *   total: number,         // 总 DOGE（satoshi-like整数，×100存储）
 *   slots: [
 *     { amount: number, claimed: false, claimedBy: null, txHash: null }
 *   ],
 *   createdAt: number,
 *   expireAt: number,      // 24小时后过期
 * }
 *
 * API：jsonbin.io（免费，无需注册，public bin）
 * 备用：我们自己在localStorage做模拟（同一浏览器可用）
 */
'use strict';

// JSONBin.io 配置（免费公开 bin，无需 API key）
// 使用 npoint.io 作为免费 JSON 存储
const RP_API_BASE = 'https://api.npoint.io';

// 本地 Storage key（同一 Chrome 实例内共享）
const RP_LOCAL_KEY = 'doge_redpackets_v1';

// ── 随机红包金额切分（微信算法：二倍均值法）────────────────────────────────
function splitAmount(totalDoge, count) {
  // Work in integer koinu (1 DOGE = 100 koinu for simplicity; real = 1e8)
  // Use 2 decimal places internally
  const total = Math.round(totalDoge * 100); // in 0.01 DOGE units
  const min   = 1; // minimum 0.01 DOGE per slot
  const slots = [];

  let remaining = total;
  for (let i = count; i > 1; i--) {
    // Random amount between min and 2x average of remaining
    const avg  = Math.floor(remaining / i);
    const max  = Math.min(avg * 2, remaining - (i - 1) * min);
    const amt  = Math.max(min, Math.floor(Math.random() * (max - min + 1)) + min);
    slots.push(amt);
    remaining -= amt;
  }
  slots.push(remaining); // last one gets the rest

  // Shuffle
  for (let i = slots.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [slots[i], slots[j]] = [slots[j], slots[i]];
  }

  // Convert back to DOGE
  return slots.map(s => parseFloat((s / 100).toFixed(2)));
}

// ── 生成红包 ID ────────────────────────────────────────────────────────────
function generateRedPacketId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = 'RP';
  for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

// ── 本地 Chrome Storage 存取（跨 popup 实例共享）──────────────────────────
function getLocalStore() {
  return new Promise(resolve => {
    chrome.storage.local.get([RP_LOCAL_KEY], res => resolve(res[RP_LOCAL_KEY] || {}));
  });
}

function setLocalStore(data) {
  return new Promise(resolve => {
    chrome.storage.local.set({ [RP_LOCAL_KEY]: data }, resolve);
  });
}

// ── 创建红包 ───────────────────────────────────────────────────────────────
async function createRedPacket(totalDoge, count, greeting, senderAddress) {
  if (totalDoge <= 0)  throw new Error('金额必须大于 0');
  if (count < 1 || count > 20) throw new Error('红包个数 1~20');
  if (totalDoge / count < 0.01) throw new Error('每个红包最少 0.01 DOGE');

  const amounts = splitAmount(totalDoge, count);
  const id = generateRedPacketId();
  const now = Date.now();

  const packet = {
    id,
    sender: senderAddress,
    senderShort: senderAddress.slice(0, 8) + '...' + senderAddress.slice(-4),
    greeting: greeting || '恭喜发财，DOGE大吉！',
    total: totalDoge,
    count,
    slots: amounts.map((amount, i) => ({
      index: i,
      amount,
      claimed: false,
      claimedBy: null,
      claimedByShort: null,
      txHash: null,
      claimedAt: null,
    })),
    createdAt: now,
    expireAt: now + 24 * 60 * 60 * 1000, // 24 hours
  };

  // Save locally (chrome.storage is shared within the extension)
  const store = await getLocalStore();
  store[id] = packet;
  await setLocalStore(store);

  return packet;
}

// ── 查询红包 ───────────────────────────────────────────────────────────────
async function getRedPacket(id) {
  const store = await getLocalStore();
  const packet = store[id.trim().toUpperCase()];
  if (!packet) throw new Error('未找到红包，请检查红包 ID');
  if (Date.now() > packet.expireAt) throw new Error('此红包已过期（超过24小时）');
  return packet;
}

// ── 检查地址是否已领取 ─────────────────────────────────────────────────────
function hasAlreadyClaimed(packet, address) {
  return packet.slots.some(s => s.claimedBy === address);
}

// ── 领取红包（选一个未领取的随机 slot，发链上交易）────────────────────────
async function claimRedPacket(packetId, claimerAddress) {
  const store  = await getLocalStore();
  const packet = store[packetId.trim().toUpperCase()];

  if (!packet) throw new Error('未找到红包');
  if (Date.now() > packet.expireAt) throw new Error('红包已过期');

  // Check already claimed
  if (hasAlreadyClaimed(packet, claimerAddress)) {
    throw new Error('您已经领过这个红包了 🐕');
  }

  // Find unclaimed slots
  const available = packet.slots.filter(s => !s.claimed);
  if (available.length === 0) throw new Error('红包已被领完 🧧');

  // Pick a random available slot
  const slot = available[Math.floor(Math.random() * available.length)];

  // Send on-chain transaction from sender's wallet to claimer
  // NOTE: In this architecture, the SENDER's wallet does the transaction
  // when claimer presents their address. For a real app you'd need an
  // escrow contract or pre-split transactions. Here we do it sender-side.
  let txHash;
  if (WalletCore.state.address === packet.sender && !WalletCore.state.locked) {
    // Sender's wallet is open — do real on-chain send
    try {
      txHash = await WalletCore.sendTransaction(claimerAddress, slot.amount, 1);
    } catch (e) {
      throw new Error('链上发送失败: ' + e.message);
    }
  } else {
    // Wallet not open or different wallet — mark as pending
    txHash = 'PENDING_' + generateRedPacketId();
  }

  // Update slot
  slot.claimed     = true;
  slot.claimedBy   = claimerAddress;
  slot.claimedByShort = claimerAddress.slice(0, 8) + '...' + claimerAddress.slice(-4);
  slot.txHash      = txHash;
  slot.claimedAt   = Date.now();

  store[packet.id] = packet;
  await setLocalStore(store);

  return { slot, packet };
}

// ── 列出我发出的所有红包 ────────────────────────────────────────────────────
async function listMyRedPackets(senderAddress) {
  const store = await getLocalStore();
  return Object.values(store)
    .filter(p => p.sender === senderAddress)
    .sort((a, b) => b.createdAt - a.createdAt);
}

// ── 格式化红包状态摘要 ──────────────────────────────────────────────────────
function getPacketSummary(packet) {
  const claimed  = packet.slots.filter(s => s.claimed).length;
  const total    = packet.slots.length;
  const claimedAmt = packet.slots.filter(s => s.claimed).reduce((a, s) => a + s.amount, 0);
  return {
    claimed, total,
    remaining: total - claimed,
    claimedAmt: claimedAmt.toFixed(2),
    remainingAmt: (packet.total - claimedAmt).toFixed(2),
    isExpired: Date.now() > packet.expireAt,
    isFullyClaimed: claimed === total,
  };
}

window.RedPacket = {
  createRedPacket,
  getRedPacket,
  claimRedPacket,
  hasAlreadyClaimed,
  listMyRedPackets,
  getPacketSummary,
  splitAmount,
};
