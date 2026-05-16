// ui.js — UI controller, page routing, event handlers

'use strict';

let currentPage = 'page-welcome';
let walletMode = 'create'; // 'create' or 'import'
let pendingMnemonic = null;

// ===== INITIALIZATION =====

document.addEventListener('DOMContentLoaded', async () => {
  // ---- i18n ----
  I18n.initI18n();
  document.getElementById('langBtn').addEventListener('click', () => {
    I18n.toggleLang();
    // Re-render dynamic content that may already be on screen
    if (currentPage === 'page-wallet') updateWalletUI();
  });

  // ---- Welcome page ----
  document.getElementById('btnGoCreate').addEventListener('click', () => showPage('page-create-password', 'create'));
  document.getElementById('btnGoImport').addEventListener('click', () => showPage('page-import'));

  // ---- Create password page ----
  document.getElementById('btnCreateWallet').addEventListener('click', createWallet);
  document.getElementById('btnBackFromCreate').addEventListener('click', () => showPage('page-welcome'));

  // ---- Backup page ----
  document.getElementById('btnConfirmBackup').addEventListener('click', confirmBackup);
  document.getElementById('backupConfirmCheck').addEventListener('change', e => {
    document.getElementById('btnConfirmBackup').disabled = !e.target.checked;
  });

  // ---- Import page ----
  document.getElementById('btnImportWallet').addEventListener('click', importWallet);
  document.getElementById('btnBackFromImport').addEventListener('click', () => showPage('page-welcome'));

  // ---- Unlock page ----
  document.getElementById('btnUnlock').addEventListener('click', unlockWallet);
  document.getElementById('btnResetFromUnlock').addEventListener('click', resetWallet);
  document.getElementById('unlockPwd').addEventListener('keydown', e => { if (e.key === 'Enter') unlockWallet(); });

  // ---- Main wallet page ----
  document.getElementById('copyAddrBtn').addEventListener('click', copyAddress);
  document.getElementById('btnGoSend').addEventListener('click', () => showPage('page-send'));
  document.getElementById('btnGoReceive').addEventListener('click', () => showPage('page-receive'));
  document.getElementById('btnRefresh').addEventListener('click', refreshBalance);
  document.getElementById('btnGoClaimRP').addEventListener('click', () => showPage('page-redpacket-claim'));

  // ---- Send page ----
  document.getElementById('btnBackFromSend').addEventListener('click', () => showPage('page-wallet'));
  document.getElementById('btnSendDoge').addEventListener('click', sendDoge);

  // ---- Receive page ----
  document.getElementById('btnBackFromReceive').addEventListener('click', () => showPage('page-wallet'));
  document.getElementById('btnCopyReceive').addEventListener('click', copyReceiveAddress);

  // ---- Header buttons ----
  document.getElementById('refreshBtn').addEventListener('click', refreshBalance);
  document.getElementById('settingsBtn').addEventListener('click', () => showPage('page-settings'));

  // ---- Settings page ----
  document.getElementById('btnBackFromSettings').addEventListener('click', () => showPage('page-wallet'));
  document.getElementById('btnExportKey').addEventListener('click', exportPrivKey);
  document.getElementById('btnShowSeed').addEventListener('click', showSeedPhrase);
  document.getElementById('btnExportSeedEnc').addEventListener('click', exportEncryptedMnemonic);
  document.getElementById('btnLock').addEventListener('click', lockWallet);
  document.getElementById('btnConfirmReset').addEventListener('click', confirmReset);

  // ---- Init: check if wallet exists ----
  const hasWallet = await WalletCore.hasWallet();
  if (hasWallet) {
    showPage('page-unlock');
    document.getElementById('mainHeader').style.display = 'flex';
  } else {
    showPage('page-welcome');
  }

  // ---- Red packet UI ----
  initRedPacketUI();

  loadPriceData();
});

// ===== PAGE NAVIGATION =====

function showPage(pageId, mode) {
  if (mode) walletMode = mode;

  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

  // Show target page
  const page = document.getElementById(pageId);
  if (page) page.classList.add('active');
  currentPage = pageId;

  // Show/hide header
  const headerPages = ['page-wallet', 'page-send', 'page-receive', 'page-settings',
    'page-redpacket-send', 'page-redpacket-share', 'page-redpacket-claim', 'page-redpacket-status'];
  const header = document.getElementById('mainHeader');
  header.style.display = headerPages.includes(pageId) ? 'flex' : 'none';

  // Page-specific initialization
  if (pageId === 'page-wallet') {
    updateWalletUI();
  } else if (pageId === 'page-receive') {
    updateReceivePage();
  } else if (pageId === 'page-send') {
    document.getElementById('sendMaxBalance').textContent = WalletCore.state.balance.toFixed(2);
  }
}


// ===== WALLET CREATION =====

async function createWallet() {
  const pwd = document.getElementById('createPwd').value;
  const confirm = document.getElementById('confirmPwd').value;

  if (pwd.length < 8) {
    showToast('⚠️ 密码至少需要8位字符', true);
    return;
  }
  if (pwd !== confirm) {
    showToast('❌ 两次密码不一致', true);
    return;
  }

  showToast('🔄 创建钱包中...', false, 3000);

  try {
    const result = await WalletCore.createNewWallet(pwd);
    pendingMnemonic = result.mnemonic; // array of words
    displaySeedWords(result.mnemonic);
    showPage('page-backup');
    document.getElementById('mainHeader').style.display = 'none';
  } catch (e) {
    console.error('createWallet error:', e);
    showToast('❌ 创建失败: ' + e.message, true);
  }
};

function displaySeedWords(words) {
  const container = document.getElementById('seedWordsDisplay');
  container.innerHTML = words.map((word, i) =>
    `<div class="seed-word">
      <div class="num">${i + 1}</div>
      <div class="word">${word}</div>
    </div>`
  ).join('');
}

function confirmBackup() {
  if (!confirm('⚠️ 最后确认\n\n你已经把 12 个助记词手写抄录到纸上并妥善保管了吗？\n\n点击"确定"后将关闭此页，今后只能通过设置 → 查看助记词重新查看。')) {
    return;
  }
  // Reset check state for next time
  const chk = document.getElementById('backupConfirmCheck');
  chk.checked = false;
  document.getElementById('btnConfirmBackup').disabled = true;

  pendingMnemonic = null;
  document.getElementById('mainHeader').style.display = 'flex';
  showPage('page-wallet');
  showToast('🎉 钱包创建成功！Much Wow!');
  loadPriceData();
};

// ===== IMPORT =====

async function importWallet() {
  const seed = document.getElementById('importSeed').value.trim();
  const pwd = document.getElementById('importPwd').value;

  if (!seed) {
    showToast('⚠️ 请输入助记词或私钥', true);
    return;
  }
  if (pwd.length < 8) {
    showToast('⚠️ 密码至少需要8位字符', true);
    return;
  }

  showToast('🔄 导入中...', false, 3000);

  try {
    await WalletCore.importWalletFromMnemonic(seed, pwd);
    document.getElementById('mainHeader').style.display = 'flex';
    showPage('page-wallet');
    showToast('✅ 钱包导入成功！');
    loadPriceData();
  } catch (e) {
    showToast('❌ ' + e.message, true);
  }
};

// ===== UNLOCK =====

async function unlockWallet() {
  const pwd = document.getElementById('unlockPwd').value;
  if (!pwd) {
    showToast('⚠️ 请输入密码', true);
    return;
  }

  showToast('🔄 解锁中...', false, 2000);

  try {
    await WalletCore.unlockWallet(pwd);
    document.getElementById('unlockPwd').value = '';
    showPage('page-wallet');
    showToast('🔓 已解锁！Such Security. Wow.');
    loadPriceData();
  } catch (e) {
    showToast('❌ ' + e.message, true);
  }
};

function resetWallet() {
  if (confirm('⚠️ 确定要重置钱包吗？\n\n所有数据将被删除，请确保已备份助记词！')) {
    WalletCore.resetWallet();
    showPage('page-welcome');
    document.getElementById('mainHeader').style.display = 'none';
    showToast('🔄 钱包已重置');
  }
};

// ===== WALLET UI =====

function updateWalletUI() {
  const state = WalletCore.state;

  // Address
  if (state.address) {
    document.getElementById('walletAddress').textContent = state.address;
  }

  // Balance
  const balance = state.balance || 0;
  document.getElementById('balanceAmount').textContent = formatDoge(balance);

  // USD value
  if (state.dogePrice) {
    const usdVal = (balance * state.dogePrice).toFixed(2);
    document.getElementById('balanceUsd').textContent = usdVal;
  }

  // Transactions
  renderTransactions(state.transactions);
}

function renderTransactions(txs) {
  const list = document.getElementById('txList');
  if (!txs || txs.length === 0) {
    list.innerHTML = `<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:12px;">
      ${I18n.t('wallet_tx_empty_line1')}<br>${I18n.t('wallet_tx_empty_line2')}
    </div>`;
    return;
  }

  const recvLabel = I18n.getLang() === 'zh' ? '收到' : 'Received';
  const sendLabel = I18n.getLang() === 'zh' ? '发送' : 'Sent';
  list.innerHTML = txs.map(tx => `
    <div class="tx-item">
      <div class="tx-icon ${tx.type}">${tx.type === 'recv' ? '⬇️' : '⬆️'}</div>
      <div class="tx-info">
        <div class="tx-type">${tx.type === 'recv' ? recvLabel : sendLabel}</div>
        <div class="tx-addr">${tx.address || tx.hash.slice(0, 20) + '...'}</div>
      </div>
      <div class="tx-amount">
        <div class="tx-doge ${tx.type}">${tx.type === 'recv' ? '+' : '-'}${formatDoge(tx.amount)}</div>
        <div class="tx-time">${tx.time || ''}</div>
      </div>
    </div>
  `).join('');
}

// ===== SEND =====

async function sendDoge() {
  const to = document.getElementById('sendTo').value.trim();
  const amount = document.getElementById('sendAmount').value;
  const fee = document.getElementById('sendFee').value;

  if (!to || !amount) {
    showToast('⚠️ 请填写收款地址和金额', true);
    return;
  }

  showToast('🔄 发送中...', false, 3000);

  try {
    const txHash = await WalletCore.sendTransaction(to, amount, fee);
    document.getElementById('sendTo').value = '';
    document.getElementById('sendAmount').value = '';
    showPage('page-wallet');
    showToast('🚀 发送成功！Much Transaction. Wow!');
    updateWalletUI();
  } catch (e) {
    showToast('❌ ' + e.message, true);
  }
};

// ===== RECEIVE =====

function updateReceivePage() {
  const address = WalletCore.state.address || 'No wallet';
  document.getElementById('receiveAddress').textContent = address;
  renderQRCode(address);
}

function renderQRCode(text) {
  const canvas = document.getElementById('qrCanvas');
  const ctx = canvas.getContext('2d');
  const matrix = DogeSecp256k1.generateQRMatrix(text);
  const cellSize = Math.floor(canvas.width / matrix.length);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#1A1200';
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (matrix[r][c]) {
        ctx.fillRect(c * cellSize, r * cellSize, cellSize - 1, cellSize - 1);
      }
    }
  }
}

// ===== PRICE DATA =====

async function loadPriceData() {
  await WalletCore.fetchDogePrice();
  const state = WalletCore.state;

  if (state.dogePrice) {
    const priceEl = document.getElementById('dogePrice');
    const changeEl = document.getElementById('dogeChange');

    if (priceEl) priceEl.textContent = '$' + state.dogePrice.toFixed(5);
    if (changeEl) {
      const change = state.priceChange || 0;
      changeEl.textContent = (change >= 0 ? '+' : '') + change.toFixed(2) + '%';
      changeEl.className = 'change' + (change < 0 ? ' down' : '');
    }

    // Update USD balance
    const balance = state.balance || 0;
    const usdEl = document.getElementById('balanceUsd');
    if (usdEl) usdEl.textContent = (balance * state.dogePrice).toFixed(2);
  }
}

// ===== REFRESH =====

async function refreshBalance() {
  showToast('🔄 刷新中...', false, 2000);
  try {
    await Promise.all([
      WalletCore.fetchBalance(),
      WalletCore.fetchDogePrice(),
      WalletCore.fetchTransactions()
    ]);
    updateWalletUI();
    await loadPriceData();
    showToast('✅ 刷新成功！');
  } catch (e) {
    showToast('⚠️ 网络连接问题，请稍后重试', true);
  }
};

// ===== COPY =====

async function copyAddress() {
  const address = WalletCore.state.address;
  if (!address) return;
  try {
    await navigator.clipboard.writeText(address);
    const btn = document.getElementById('copyAddrBtn');
    btn.textContent = '✓ 已复制';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = '复制';
      btn.classList.remove('copied');
    }, 2000);
  } catch (e) {
    showToast('❌ 复制失败', true);
  }
};

async function copyReceiveAddress() {
  const address = WalletCore.state.address;
  if (!address) return;
  try {
    await navigator.clipboard.writeText(address);
    showToast('📋 地址已复制！');
  } catch (e) {
    showToast('❌ 复制失败', true);
  }
};

// ===== SETTINGS =====

async function exportPrivKey() {
  try {
    const wif = WalletCore.getWIF();
    if (confirm('⚠️ 私钥非常敏感！确定要查看吗？\n\n切勿分享给任何人！')) {
      await navigator.clipboard.writeText(wif);
      showToast('🔑 WIF私钥已复制到剪贴板（请立即清除）');
    }
  } catch (e) {
    showToast('❌ ' + e.message, true);
  }
};

async function exportEncryptedMnemonic() {
  const mnemonic = WalletCore.state.mnemonic;
  if (!mnemonic) {
    showToast('❌ 钱包已锁定，请先解锁', true);
    return;
  }

  const proceed = confirm(
    '⚠️ 加密导出助记词\n\n' +
    '风险提示：\n' +
    '• 联网设备存在被盗、勒索软件加密、云同步外泄等风险\n' +
    '• 文件即使用密码加密，弱密码仍可能被暴力破解\n' +
    '• 最安全的方式是纸笔抄写后离线保管\n\n' +
    '下一步需要输入钱包密码进行加密。\n确定继续？'
  );
  if (!proceed) return;

  const pwd = prompt('请输入钱包密码（用于加密导出文件）：');
  if (pwd === null || pwd === '') return;

  // Verify password by attempting to decrypt stored wallet
  try {
    const enc = await new Promise(r =>
      chrome.storage.local.get(['doge_enc'], d => r(d['doge_enc']))
    );
    if (!enc) throw new Error('no wallet');
    await DogeSecp256k1.decryptData(enc, pwd);
  } catch (e) {
    showToast('❌ 密码错误', true);
    return;
  }

  // Encrypt mnemonic with same password
  const mnemonicStr = typeof mnemonic === 'string' ? mnemonic : mnemonic.join(' ');
  const encrypted = await DogeSecp256k1.encryptData({ mnemonic: mnemonicStr }, pwd);

  const backup = {
    type: 'doge-wallet-mnemonic-backup',
    version: 1,
    createdAt: new Date().toISOString(),
    note: 'Encrypted with wallet password (AES-GCM + PBKDF2-SHA256, 210k iters). Use the same password to decrypt.',
    encrypted,
  };

  // Trigger download
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const ts = new Date().toISOString().slice(0, 10);
  a.download = `doge-wallet-backup-${ts}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  showToast('✅ 已加密导出，请妥善保管');
}

function showSeedPhrase() {
  const mnemonic = WalletCore.state.mnemonic;
  if (!mnemonic) {
    showToast('❌ 钱包已锁定，请先解锁', true);
    return;
  }
  if (confirm('⚠️ 即将显示助记词！\n\n确保周围没有他人。切勿截图！')) {
    const words = typeof mnemonic === 'string' ? mnemonic.split(' ') : mnemonic;
    displaySeedWords(words);
    showPage('page-backup');
    document.getElementById('mainHeader').style.display = 'none';
  }
};

function lockWallet() {
  WalletCore.lockWallet();
  showPage('page-unlock');
  showToast('🔒 钱包已锁定');
};

function confirmReset() {
  if (confirm('⚠️ 危险操作！\n\n重置将删除所有数据。\n确保已备份助记词！\n\n确定重置？')) {
    window.resetWallet();
  }
};

// ===== HELPERS =====

function formatDoge(amount) {
  if (amount === undefined || amount === null) return '0.00';
  const n = parseFloat(amount);
  if (n >= 1000000) return (n / 1000000).toFixed(2) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(2) + 'K';
  return n.toFixed(2);
}

function showToast(message, isError = false, duration = 2500) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.style.borderColor = isError ? 'var(--danger)' : 'var(--doge-gold)';
  toast.style.color = isError ? 'var(--danger)' : 'var(--doge-bright)';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}
