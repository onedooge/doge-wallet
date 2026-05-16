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
  const sendFeeHidden = document.getElementById('sendFee');
  const sendFeeCustom = document.getElementById('sendFeeCustom');
  const sendFeeCustomRow = sendFeeCustom.parentElement;

  document.querySelectorAll('.fee-tier-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.fee-tier-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      sendFeeHidden.value = btn.getAttribute('data-fee');
      sendFeeCustom.value = '';
      sendFeeCustomRow.classList.remove('active');
    });
  });

  sendFeeCustom.addEventListener('input', () => {
    const v = parseFloat(sendFeeCustom.value);
    if (!isNaN(v) && v > 0) {
      document.querySelectorAll('.fee-tier-btn').forEach(b => b.classList.remove('active'));
      sendFeeHidden.value = v;
      sendFeeCustomRow.classList.add('active');
    } else {
      sendFeeCustomRow.classList.remove('active');
    }
  });

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

  // Auto-lock tier buttons
  document.querySelectorAll('#autoLockTiers .al-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const min = parseInt(btn.getAttribute('data-min'), 10);
      await WalletCore.setAutoLockMinutes(min);
      document.querySelectorAll('#autoLockTiers .al-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      // If just turned on while unlocked, save session immediately so it takes effect now
      if (min > 0 && !WalletCore.state.locked) WalletCore.saveSession();
      // If turned off, clear any existing session
      if (min === 0) WalletCore.clearSession();
    });
  });

  // ---- Init: check if wallet exists + try session restore ----
  const hasWallet = await WalletCore.hasWallet();
  if (hasWallet) {
    document.getElementById('mainHeader').style.display = 'flex';
    const restored = await WalletCore.tryRestoreSession();
    if (restored) {
      showPage('page-wallet');
    } else {
      showPage('page-unlock');
    }
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
  } else if (pageId === 'page-settings') {
    syncAutoLockUI();
  }
}

async function syncAutoLockUI() {
  const min = await WalletCore.getAutoLockMinutes();
  document.querySelectorAll('#autoLockTiers .al-btn').forEach(b => {
    b.classList.toggle('active', parseInt(b.getAttribute('data-min'), 10) === min);
  });
}


// ===== WALLET CREATION =====

async function createWallet() {
  const pwd = document.getElementById('createPwd').value;
  const confirm = document.getElementById('confirmPwd').value;

  if (pwd.length < 8) {
    showToast(I18n.t('toast_pwd_min8'), true);
    return;
  }
  if (pwd !== confirm) {
    showToast(I18n.t('toast_pwd_mismatch'), true);
    return;
  }

  showToast(I18n.t('toast_creating'), false, 3000);

  try {
    const result = await WalletCore.createNewWallet(pwd);
    pendingMnemonic = result.mnemonic; // array of words
    displaySeedWords(result.mnemonic);
    showPage('page-backup');
    document.getElementById('mainHeader').style.display = 'none';
  } catch (e) {
    console.error('createWallet error:', e);
    showToast(I18n.t('toast_create_fail') + e.message, true);
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
  if (!confirm(I18n.t('confirm_backup_final'))) {
    return;
  }
  // Reset check state for next time
  const chk = document.getElementById('backupConfirmCheck');
  chk.checked = false;
  document.getElementById('btnConfirmBackup').disabled = true;

  pendingMnemonic = null;
  document.getElementById('mainHeader').style.display = 'flex';
  showPage('page-wallet');
  showToast(I18n.t('toast_create_success'));
  loadPriceData();
};

// ===== IMPORT =====

async function importWallet() {
  const seed = document.getElementById('importSeed').value.trim();
  const pwd = document.getElementById('importPwd').value;

  if (!seed) {
    showToast(I18n.t('toast_need_seed'), true);
    return;
  }
  if (pwd.length < 8) {
    showToast(I18n.t('toast_pwd_min8'), true);
    return;
  }

  showToast(I18n.t('toast_importing'), false, 3000);

  try {
    await WalletCore.importWalletFromMnemonic(seed, pwd);
    document.getElementById('mainHeader').style.display = 'flex';
    showPage('page-wallet');
    showToast(I18n.t('toast_import_success'));
    loadPriceData();
  } catch (e) {
    showToast('❌ ' + e.message, true);
  }
};

// ===== UNLOCK =====

async function unlockWallet() {
  const pwd = document.getElementById('unlockPwd').value;
  if (!pwd) {
    showToast(I18n.t('toast_need_pwd'), true);
    return;
  }

  showToast(I18n.t('toast_unlocking'), false, 2000);

  try {
    await WalletCore.unlockWallet(pwd);
    document.getElementById('unlockPwd').value = '';
    showPage('page-wallet');
    showToast(I18n.t('toast_unlocked'));
    loadPriceData();
  } catch (e) {
    showToast('❌ ' + e.message, true);
  }
};

function resetWallet() {
  if (confirm(I18n.t('confirm_reset_unlock'))) {
    WalletCore.resetWallet();
    showPage('page-welcome');
    document.getElementById('mainHeader').style.display = 'none';
    showToast(I18n.t('toast_reset_done'));
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

  const recvLabel = I18n.t('tx_recv_label');
  const sendLabel = I18n.t('tx_send_label');
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
    showToast(I18n.t('toast_need_addr_amt'), true);
    return;
  }

  showToast(I18n.t('toast_sending'), false, 3000);

  try {
    const txHash = await WalletCore.sendTransaction(to, amount, fee);
    document.getElementById('sendTo').value = '';
    document.getElementById('sendAmount').value = '';
    showPage('page-wallet');
    showToast(I18n.t('toast_send_success'));
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
  showToast(I18n.t('toast_refreshing'), false, 2000);
  try {
    await Promise.all([
      WalletCore.fetchBalance(),
      WalletCore.fetchDogePrice(),
      WalletCore.fetchTransactions()
    ]);
    updateWalletUI();
    await loadPriceData();
    showToast(I18n.t('toast_refresh_ok'));
  } catch (e) {
    showToast(I18n.t('toast_network_issue'), true);
  }
};

// ===== COPY =====

async function copyAddress() {
  const address = WalletCore.state.address;
  if (!address) return;
  try {
    await navigator.clipboard.writeText(address);
    const btn = document.getElementById('copyAddrBtn');
    btn.textContent = I18n.t('wallet_copied');
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = I18n.t('wallet_copy');
      btn.classList.remove('copied');
    }, 2000);
  } catch (e) {
    showToast(I18n.t('toast_copy_fail'), true);
  }
};

async function copyReceiveAddress() {
  const address = WalletCore.state.address;
  if (!address) return;
  try {
    await navigator.clipboard.writeText(address);
    showToast(I18n.t('toast_addr_copied'));
  } catch (e) {
    showToast(I18n.t('toast_copy_fail'), true);
  }
};

// ===== SETTINGS =====

async function exportPrivKey() {
  try {
    const wif = WalletCore.getWIF();
    if (confirm(I18n.t('confirm_export_key'))) {
      await navigator.clipboard.writeText(wif);
      showToast(I18n.t('toast_wif_copied'));
    }
  } catch (e) {
    showToast('❌ ' + e.message, true);
  }
};

async function exportEncryptedMnemonic() {
  const mnemonic = WalletCore.state.mnemonic;
  if (!mnemonic) {
    showToast(I18n.t('toast_locked_first'), true);
    return;
  }

  const proceed = confirm(I18n.t('confirm_export_enc'));
  if (!proceed) return;

  const pwd = prompt(I18n.t('prompt_export_pwd'));
  if (pwd === null || pwd === '') return;

  // Verify password by attempting to decrypt stored wallet
  try {
    const enc = await new Promise(r =>
      chrome.storage.local.get(['doge_enc'], d => r(d['doge_enc']))
    );
    if (!enc) throw new Error('no wallet');
    await DogeSecp256k1.decryptData(enc, pwd);
  } catch (e) {
    showToast(I18n.t('toast_pwd_wrong'), true);
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

  showToast(I18n.t('toast_export_done'));
}

function showSeedPhrase() {
  const mnemonic = WalletCore.state.mnemonic;
  if (!mnemonic) {
    showToast(I18n.t('toast_locked_first'), true);
    return;
  }
  if (confirm(I18n.t('confirm_show_seed'))) {
    const words = typeof mnemonic === 'string' ? mnemonic.split(' ') : mnemonic;
    displaySeedWords(words);
    showPage('page-backup');
    document.getElementById('mainHeader').style.display = 'none';
  }
};

function lockWallet() {
  WalletCore.lockWallet();
  showPage('page-unlock');
  showToast(I18n.t('toast_lock_done'));
};

function confirmReset() {
  if (confirm(I18n.t('confirm_reset_strong'))) {
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
