/**
 * ui-redpacket.js — Red packet UI logic
 */
'use strict';

let currentRPData = null;       // packet being shared/viewed
let rpCount = 5;                // selected count

// ── Init bindings (called from ui.js DOMContentLoaded) ─────────────────────
function initRedPacketUI() {
  // Nav to red packet
  document.getElementById('btnGoRedPacket').addEventListener('click', () => {
    showPage('page-redpacket-send');
  });

  // Count quick buttons
  document.querySelectorAll('.rp-count-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.rp-count-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      rpCount = parseInt(btn.dataset.n);
      document.getElementById('rpCount').value = rpCount;
      updateRPPreview();
    });
  });

  document.getElementById('rpAmount').addEventListener('input', updateRPPreview);
  document.getElementById('rpCount').addEventListener('input', e => {
    rpCount = parseInt(e.target.value) || 5;
    updateRPPreview();
  });

  // Create red packet
  document.getElementById('btnCreateRP').addEventListener('click', handleCreateRP);

  // Back buttons
  document.getElementById('btnBackFromRP').addEventListener('click', () => showPage('page-wallet'));
  document.getElementById('btnBackFromRPShare').addEventListener('click', () => showPage('page-wallet'));
  document.getElementById('btnBackFromRPClaim').addEventListener('click', () => showPage('page-wallet'));
  document.getElementById('btnBackFromRPStatus').addEventListener('click', () => showPage('page-redpacket-share'));

  // Share page actions
  document.getElementById('btnCopyRPLink').addEventListener('click', copyRPLink);
  document.getElementById('btnViewRPStatus').addEventListener('click', () => {
    if (currentRPData) showRPStatus(currentRPData);
  });

  // Claim page
  document.getElementById('btnLoadRP').addEventListener('click', handleLoadRP);
  document.getElementById('btnClaimRP').addEventListener('click', handleClaimRP);
}

// ── Preview: show random split preview ────────────────────────────────────
function updateRPPreview() {
  const amount = parseFloat(document.getElementById('rpAmount').value) || 0;
  const count  = parseInt(document.getElementById('rpCount').value)  || 5;
  const previewEl = document.getElementById('rpPreviewText');

  if (amount <= 0 || count <= 0) {
    previewEl.textContent = '填写金额预览分配...';
    return;
  }
  if (amount / count < 0.01) {
    previewEl.textContent = '⚠️ 每人最少 0.01 DOGE，请增加金额或减少人数';
    return;
  }
  const slots = RedPacket.splitAmount(amount, count);
  const min = Math.min(...slots).toFixed(2);
  const max = Math.max(...slots).toFixed(2);
  previewEl.textContent =
    `🎲 预览 ${count} 个红包：最少 ${min} DOGE，最多 ${max} DOGE（随机）`;
}

// ── Create red packet ──────────────────────────────────────────────────────
async function handleCreateRP() {
  const amount   = parseFloat(document.getElementById('rpAmount').value);
  const count    = parseInt(document.getElementById('rpCount').value) || rpCount;
  const greeting = document.getElementById('rpGreeting').value.trim() ||
                   '恭喜发财，DOGE大吉！';
  const sender   = WalletCore.state.address;

  if (!sender) { showToast('❌ 请先解锁钱包', true); return; }
  if (!amount || amount <= 0) { showToast('⚠️ 请输入红包金额', true); return; }
  if (amount > WalletCore.state.balance) {
    showToast(`❌ 余额不足 (余额: ${WalletCore.state.balance.toFixed(2)} DOGE)`, true);
    return;
  }

  const btn = document.getElementById('btnCreateRP');
  btn.textContent = '🔄 创建中...';
  btn.disabled = true;

  try {
    const packet = await RedPacket.createRedPacket(amount, count, greeting, sender);
    currentRPData = packet;
    showRPSharePage(packet);
    showToast('🧧 红包创建成功！Much Lucky!');
  } catch (e) {
    showToast('❌ ' + e.message, true);
  } finally {
    btn.textContent = '🧧 创建红包';
    btn.disabled = false;
  }
}

// ── Show share page ────────────────────────────────────────────────────────
function showRPSharePage(packet) {
  const summary = RedPacket.getPacketSummary(packet);

  document.getElementById('rpShareTitle').textContent = `🧧 "${packet.greeting}"`;
  document.getElementById('rpShareSub').textContent =
    `共 ${packet.count} 个，总额 ${packet.total} DOGE`;
  document.getElementById('rpShareId').textContent = packet.id;

  // Slot badges
  const slotsEl = document.getElementById('rpShareSlots');
  slotsEl.innerHTML = packet.slots.map(s =>
    `<span class="rp-slot-badge">${s.amount.toFixed(2)}</span>`
  ).join('');

  // Share link
  const link = buildShareLink(packet.id);
  document.getElementById('rpShareLink').textContent = link;

  showPage('page-redpacket-share');
}

function buildShareLink(packetId) {
  // Use a chrome extension deep link or simple encoded URL
  // In practice, share the ID and let recipient enter it manually
  return `DOGE红包ID: ${packetId}  |  在 DOGE Wallet 插件中输入此ID领取`;
}

// ── Copy link ──────────────────────────────────────────────────────────────
async function copyRPLink() {
  if (!currentRPData) return;
  const link = buildShareLink(currentRPData.id);
  try {
    await navigator.clipboard.writeText(link);
    showToast('📋 红包链接已复制！');
  } catch(e) {
    showToast('❌ 复制失败', true);
  }
}

// ── Status page ────────────────────────────────────────────────────────────
function showRPStatus(packet) {
  const summary = RedPacket.getPacketSummary(packet);
  const container = document.getElementById('rpStatusContent');

  const headerHTML = `
    <div style="background:linear-gradient(135deg,rgba(139,0,0,0.3),rgba(192,57,43,0.2));border:1px solid rgba(192,57,43,0.4);border-radius:12px;padding:14px;margin-bottom:14px">
      <div style="font-size:13px;font-weight:700;color:#FFD700;margin-bottom:6px">🧧 ${packet.greeting}</div>
      <div style="font-size:11px;color:var(--text-muted)">ID: <span style="font-family:monospace;color:var(--doge-bright)">${packet.id}</span></div>
      <div style="font-size:11px;color:var(--text-muted);margin-top:4px">
        进度: <span style="color:var(--success);font-weight:700">${summary.claimed}/${summary.total}</span> 已领取 ·
        总额: <span style="color:var(--doge-bright);font-weight:700">${packet.total} DOGE</span>
      </div>
      ${summary.isFullyClaimed ? '<div style="font-size:11px;color:var(--success);margin-top:4px">✅ 红包已领完</div>' : ''}
      ${summary.isExpired ? '<div style="font-size:11px;color:var(--danger);margin-top:4px">⏰ 红包已过期</div>' : ''}
    </div>
  `;

  const slotsHTML = packet.slots.map((s, i) => `
    <div class="rp-status-item">
      <div class="rp-status-num ${s.claimed ? 'taken' : 'open'}">${i+1}</div>
      <div style="flex:1">
        <div class="rp-status-amt">${s.amount.toFixed(2)} DOGE</div>
        <div class="rp-status-who">${s.claimed ? s.claimedByShort || '已领取' : '等待领取...'}</div>
        ${s.txHash && !s.txHash.startsWith('PENDING') ?
          `<div style="font-size:9px;color:var(--text-muted);font-family:monospace">${s.txHash.slice(0,16)}...</div>` : ''}
      </div>
      <div class="rp-status-tag ${s.claimed ? 'taken' : 'open'}">${s.claimed ? '✓ 已领' : '未领'}</div>
    </div>
  `).join('');

  container.innerHTML = headerHTML + slotsHTML;
  showPage('page-redpacket-status');
}

// ── Load red packet for claiming ───────────────────────────────────────────
async function handleLoadRP() {
  const id = document.getElementById('rpClaimId').value.trim();
  if (!id) { showToast('⚠️ 请输入红包 ID', true); return; }

  const btn = document.getElementById('btnLoadRP');
  btn.textContent = '🔍 查询中...';
  btn.disabled = true;

  try {
    const packet  = await RedPacket.getRedPacket(id);
    const summary = RedPacket.getPacketSummary(packet);
    const myAddr  = WalletCore.state.address;

    // Update claim UI
    document.getElementById('rpClaimFrom').textContent =
      `来自 ${packet.senderShort} 的红包`;
    document.getElementById('rpClaimGreeting').textContent = packet.greeting;
    document.getElementById('rpClaimMeta').textContent =
      `还剩 ${summary.remaining}/${summary.total} 个未领取 · 共 ${packet.total} DOGE`;

    // Render slot grid
    renderClaimSlots(packet);

    // Show/hide claim button
    const claimBtn = document.getElementById('btnClaimRP');
    if (summary.remaining === 0) {
      claimBtn.style.display = 'none';
      showToast('😢 红包已被领完', true);
    } else if (summary.isExpired) {
      claimBtn.style.display = 'none';
      showToast('⏰ 红包已过期', true);
    } else if (myAddr && RedPacket.hasAlreadyClaimed(packet, myAddr)) {
      claimBtn.style.display = 'none';
      showToast('🐕 您已经领过这个红包了', true);
    } else {
      claimBtn.style.display = 'block';
      claimBtn.dataset.packetId = id;
    }

    // Reset result
    document.getElementById('rpClaimResult').style.display = 'none';

    showToast(`✅ 找到红包！${summary.remaining}/${summary.total} 个未领取`);
  } catch (e) {
    showToast('❌ ' + e.message, true);
  } finally {
    btn.textContent = '🔍 查询红包';
    btn.disabled = false;
  }
}

function renderClaimSlots(packet) {
  const container = document.getElementById('rpClaimSlots');
  container.innerHTML = packet.slots.map((s, i) => `
    <div class="rp-claim-slot ${s.claimed ? 'claimed' : ''}">
      <div class="slot-num">#${i+1}</div>
      <div class="slot-amt">${s.claimed ? s.amount.toFixed(2) : '?'}</div>
      <div class="slot-who">${s.claimed ? (s.claimedByShort || '已领') : '未领'}</div>
    </div>
  `).join('');
}

// ── Claim red packet ────────────────────────────────────────────────────────
async function handleClaimRP() {
  const packetId = document.getElementById('btnClaimRP').dataset.packetId;
  const myAddr   = WalletCore.state.address;

  if (!myAddr) {
    showToast('❌ 请先解锁钱包', true);
    return;
  }

  const btn = document.getElementById('btnClaimRP');
  btn.textContent = '🔄 领取中...';
  btn.disabled = true;

  try {
    const { slot, packet } = await RedPacket.claimRedPacket(packetId, myAddr);

    // Show result
    const resultEl = document.getElementById('rpClaimResult');
    document.getElementById('rpResultAmount').textContent = `+${slot.amount.toFixed(2)} DOGE`;

    // Pick a lucky phrase
    const phrases = [
      '手气不错！','运气爆棚！','wow. very lucky!','Much DOGE!',
      'so fortune. wow!','手气王！🏆','暗藏好运！','Today is your day!',
    ];
    resultEl.querySelector('.rp-result-label').textContent =
      phrases[Math.floor(Math.random() * phrases.length)];
    resultEl.style.display = 'block';

    // Refresh slot display
    renderClaimSlots(packet);

    btn.style.display = 'none';

    // Refresh balance
    setTimeout(() => WalletCore.fetchBalance().then(() => updateWalletUI()).catch(() => {}), 3000);

    showToast(`🎉 抢到 ${slot.amount.toFixed(2)} DOGE！Much Lucky!`);
  } catch (e) {
    showToast('❌ ' + e.message, true);
    btn.textContent = '🧧 抢红包！';
    btn.disabled = false;
  }
}

window.initRedPacketUI = initRedPacketUI;
window.showRPStatus = showRPStatus;
window.showRPSharePage = showRPSharePage;
