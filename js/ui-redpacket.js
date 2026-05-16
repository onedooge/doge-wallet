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
    previewEl.textContent = I18n.t('rp_preview_default');
    return;
  }
  if (amount / count < 0.01) {
    previewEl.textContent = I18n.t('rp_min_warn');
    return;
  }
  const slots = RedPacket.splitAmount(amount, count);
  const min = Math.min(...slots).toFixed(2);
  const max = Math.max(...slots).toFixed(2);
  previewEl.textContent = I18n.tt('rp_preview_tmpl', { count, min, max });
}

// ── Create red packet ──────────────────────────────────────────────────────
async function handleCreateRP() {
  const amount   = parseFloat(document.getElementById('rpAmount').value);
  const count    = parseInt(document.getElementById('rpCount').value) || rpCount;
  const greeting = document.getElementById('rpGreeting').value.trim() ||
                   I18n.t('rp_claim_greet');
  const sender   = WalletCore.state.address;

  if (!sender) { showToast(I18n.t('rp_toast_locked'), true); return; }
  if (!amount || amount <= 0) { showToast(I18n.t('rp_toast_need_amount'), true); return; }
  if (amount > WalletCore.state.balance) {
    showToast(I18n.tt('rp_toast_insufficient_tmpl', { bal: WalletCore.state.balance.toFixed(2) }), true);
    return;
  }

  const btn = document.getElementById('btnCreateRP');
  btn.textContent = I18n.t('rp_toast_creating');
  btn.disabled = true;

  try {
    const packet = await RedPacket.createRedPacket(amount, count, greeting, sender);
    currentRPData = packet;
    showRPSharePage(packet);
    showToast(I18n.t('rp_toast_create_success'));
  } catch (e) {
    showToast('❌ ' + e.message, true);
  } finally {
    btn.textContent = I18n.t('rp_create_btn');
    btn.disabled = false;
  }
}

// ── Show share page ────────────────────────────────────────────────────────
function showRPSharePage(packet) {
  const summary = RedPacket.getPacketSummary(packet);

  document.getElementById('rpShareTitle').textContent = `🧧 "${packet.greeting}"`;
  document.getElementById('rpShareSub').textContent =
    I18n.tt('rp_share_sub_tmpl_dyn', { count: packet.count, total: packet.total });
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
  return I18n.tt('rp_share_text_tmpl', { id: packetId });
}

// ── Copy link ──────────────────────────────────────────────────────────────
async function copyRPLink() {
  if (!currentRPData) return;
  const link = buildShareLink(currentRPData.id);
  try {
    await navigator.clipboard.writeText(link);
    showToast(I18n.t('rp_toast_link_copied'));
  } catch(e) {
    showToast(I18n.t('toast_copy_fail'), true);
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
        ${I18n.t('rp_progress_label')} <span style="color:var(--success);font-weight:700">${summary.claimed}/${summary.total}</span> ${I18n.t('rp_claimed_word')} ·
        ${I18n.t('rp_total_label')} <span style="color:var(--doge-bright);font-weight:700">${packet.total} DOGE</span>
      </div>
      ${summary.isFullyClaimed ? `<div style="font-size:11px;color:var(--success);margin-top:4px">${I18n.t('rp_fully_claimed')}</div>` : ''}
      ${summary.isExpired ? `<div style="font-size:11px;color:var(--danger);margin-top:4px">${I18n.t('rp_expired')}</div>` : ''}
    </div>
  `;

  const slotsHTML = packet.slots.map((s, i) => `
    <div class="rp-status-item">
      <div class="rp-status-num ${s.claimed ? 'taken' : 'open'}">${i+1}</div>
      <div style="flex:1">
        <div class="rp-status-amt">${s.amount.toFixed(2)} DOGE</div>
        <div class="rp-status-who">${s.claimed ? s.claimedByShort || I18n.t('rp_claimed_short') : I18n.t('rp_waiting')}</div>
        ${s.txHash && !s.txHash.startsWith('PENDING') ?
          `<div style="font-size:9px;color:var(--text-muted);font-family:monospace">${s.txHash.slice(0,16)}...</div>` : ''}
      </div>
      <div class="rp-status-tag ${s.claimed ? 'taken' : 'open'}">${s.claimed ? I18n.t('rp_claimed_tag') : I18n.t('rp_open_tag')}</div>
    </div>
  `).join('');

  container.innerHTML = headerHTML + slotsHTML;
  showPage('page-redpacket-status');
}

// ── Load red packet for claiming ───────────────────────────────────────────
async function handleLoadRP() {
  const id = document.getElementById('rpClaimId').value.trim();
  if (!id) { showToast(I18n.t('rp_toast_need_id'), true); return; }

  const btn = document.getElementById('btnLoadRP');
  btn.textContent = I18n.t('rp_toast_searching');
  btn.disabled = true;

  try {
    const packet  = await RedPacket.getRedPacket(id);
    const summary = RedPacket.getPacketSummary(packet);
    const myAddr  = WalletCore.state.address;

    // Update claim UI
    document.getElementById('rpClaimFrom').textContent =
      I18n.tt('rp_claim_from_tmpl', { sender: packet.senderShort });
    document.getElementById('rpClaimGreeting').textContent = packet.greeting;
    document.getElementById('rpClaimMeta').textContent =
      I18n.tt('rp_claim_meta_tmpl', { remain: summary.remaining, total: summary.total, amount: packet.total });

    // Render slot grid
    renderClaimSlots(packet);

    // Show/hide claim button
    const claimBtn = document.getElementById('btnClaimRP');
    if (summary.remaining === 0) {
      claimBtn.style.display = 'none';
      showToast(I18n.t('rp_toast_taken_all'), true);
    } else if (summary.isExpired) {
      claimBtn.style.display = 'none';
      showToast(I18n.t('rp_toast_expired'), true);
    } else if (myAddr && RedPacket.hasAlreadyClaimed(packet, myAddr)) {
      claimBtn.style.display = 'none';
      showToast(I18n.t('rp_toast_already_claimed'), true);
    } else {
      claimBtn.style.display = 'block';
      claimBtn.dataset.packetId = id;
    }

    // Reset result
    document.getElementById('rpClaimResult').style.display = 'none';

    showToast(I18n.tt('rp_toast_found_tmpl', { remain: summary.remaining, total: summary.total }));
  } catch (e) {
    showToast('❌ ' + e.message, true);
  } finally {
    btn.textContent = I18n.t('rp_load_btn');
    btn.disabled = false;
  }
}

function renderClaimSlots(packet) {
  const container = document.getElementById('rpClaimSlots');
  container.innerHTML = packet.slots.map((s, i) => `
    <div class="rp-claim-slot ${s.claimed ? 'claimed' : ''}">
      <div class="slot-num">#${i+1}</div>
      <div class="slot-amt">${s.claimed ? s.amount.toFixed(2) : '?'}</div>
      <div class="slot-who">${s.claimed ? (s.claimedByShort || I18n.t('rp_slot_claimed')) : I18n.t('rp_slot_open')}</div>
    </div>
  `).join('');
}

// ── Claim red packet ────────────────────────────────────────────────────────
async function handleClaimRP() {
  const packetId = document.getElementById('btnClaimRP').dataset.packetId;
  const myAddr   = WalletCore.state.address;

  if (!myAddr) {
    showToast(I18n.t('rp_toast_locked'), true);
    return;
  }

  const btn = document.getElementById('btnClaimRP');
  btn.textContent = I18n.t('rp_toast_claiming');
  btn.disabled = true;

  try {
    const { slot, packet } = await RedPacket.claimRedPacket(packetId, myAddr);

    // Show result
    const resultEl = document.getElementById('rpClaimResult');
    document.getElementById('rpResultAmount').textContent = `+${slot.amount.toFixed(2)} DOGE`;

    // Pick a lucky phrase (bilingual mix — visual variety, no need to translate)
    const phrases = I18n.getLang() === 'zh'
      ? ['手气不错！','运气爆棚！','wow. very lucky!','Much DOGE!','so fortune. wow!','手气王！🏆','暗藏好运！','Today is your day!']
      : ['Lucky pull!','On fire!','wow. very lucky!','Much DOGE!','so fortune. wow!','Top grab! 🏆','Hidden treasure!','Today is your day!'];
    resultEl.querySelector('.rp-result-label').textContent =
      phrases[Math.floor(Math.random() * phrases.length)];
    resultEl.style.display = 'block';

    // Refresh slot display
    renderClaimSlots(packet);

    btn.style.display = 'none';

    // Refresh balance
    setTimeout(() => WalletCore.fetchBalance().then(() => updateWalletUI()).catch(() => {}), 3000);

    showToast(I18n.tt('rp_toast_grab_success_tmpl', { amount: slot.amount.toFixed(2) }));
  } catch (e) {
    showToast('❌ ' + e.message, true);
    btn.textContent = I18n.t('rp_claim_btn');
    btn.disabled = false;
  }
}

window.initRedPacketUI = initRedPacketUI;
window.showRPStatus = showRPStatus;
window.showRPSharePage = showRPSharePage;
