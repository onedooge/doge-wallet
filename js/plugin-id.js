/**
 * plugin-id.js — Doge ID 插件（自包含 · 即插即用）
 *
 * © 2026 onedooge — 随 DOGE Wallet 一起开源（MIT）。
 *
 * 你的 12 位 Doge 号(类 QQ 号),从钱包地址确定性推导,显示成「684 419 585 614」三位一空格。
 * 全网一致、无需服务器。本地 Demo。
 */
(function () {
  'use strict';
  const STR = {
    zh: { action: 'Doge ID', title: '🆔 Doge ID', sub: '你的 Doge 号 · 类 QQ 号',
      label: 'DOGE 号', nameLabel: '.doge 名字', addrLabel: '钱包地址', unset: '未设置(去 .doge 应用取名)',
      copyId: '复制号码', copyAddr: '复制地址', back: '← 返回钱包', noWallet: '请先解锁钱包', copied: '已复制 🐕', appsTitle: '应用' },
    en: { action: 'Doge ID', title: '🆔 Doge ID', sub: 'Your Doge number · like QQ',
      label: 'DOGE ID', nameLabel: '.doge name', addrLabel: 'Wallet address', unset: 'unset (set it in the .doge app)',
      copyId: 'Copy ID', copyAddr: 'Copy address', back: '← Back', noWallet: 'Unlock wallet first', copied: 'Copied 🐕', appsTitle: 'Apps' },
  };
  const $ = id => document.getElementById(id);
  function lang() { try { return (window.I18n && I18n.getLang && I18n.getLang() === 'en') ? 'en' : 'zh'; } catch (e) { return 'zh'; } }
  function L() { return STR[lang()]; }
  function getLS(k, d) { return new Promise(r => chrome.storage.local.get([k], v => r(v[k] === undefined ? d : v[k]))); }
  function myAddr() { try { return (window.WalletCore && WalletCore.state && WalletCore.state.address) || ''; } catch (e) { return ''; } }
  function deriveId(a) { if (!a) return ''; let h = 0; for (let i = 0; i < a.length; i++) h = (h * 131 + a.charCodeAt(i)) % 1000000000000; return String(h).padStart(12, '0'); }
  function fmtId(id) { return id ? id.replace(/(\d{3})(?=\d)/g, '$1 ') : '—'; }
  function toast(m, e) { if (window.showToast) showToast(m, !!e); }

  const CSS = `
  .app-section { margin:0 16px 14px; padding:12px 14px 14px; background:var(--bg-card-soft); border:1px solid var(--border); border-radius:var(--r-lg); box-shadow:var(--shadow-sm); }
  .app-section-title { font-size:12px; font-weight:800; color:var(--doge-deep); letter-spacing:.5px; margin-bottom:10px; }
  .app-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }
  .app-grid .action-btn { width:auto; padding:12px 2px 10px; }
  .app-grid .action-btn .label { font-size:10px; white-space:nowrap; }
  .id-header { position:relative; background:linear-gradient(135deg,var(--doge-bright),var(--doge-orange)); padding:9px 20px 7px; text-align:center; border-bottom:2px solid var(--doge-gold); }
  .id-title { font-family:'Impact','Arial Black',sans-serif; font-size:17px; color:#FFFDF3; text-shadow:0 2px 6px rgba(0,0,0,.25); }
  .id-sub { font-size:9px; color:rgba(255,253,243,.85); margin-top:1px; }
  .id-back { position:absolute; left:10px; top:50%; transform:translateY(-50%); min-width:26px; height:26px; padding:0 8px; border:none; border-radius:8px; background:rgba(255,255,255,.28); color:#FFFDF3; font-size:13px; font-weight:800; cursor:pointer; }
  .id-back:hover { background:rgba(255,255,255,.5); }
  .id-card { margin:16px; padding:20px 18px; text-align:center; background:linear-gradient(150deg,#3D2800,#5C3E00 60%,#8B6914); border-radius:var(--r-xl); box-shadow:var(--shadow-md); border:2px solid var(--doge-gold); }
  .id-avatar { width:54px; height:54px; margin:0 auto 8px; border-radius:50%; background:linear-gradient(135deg,#FFFAEA,#FCE8A8); display:flex; align-items:center; justify-content:center; font-size:30px; }
  .id-num-label { font-size:10px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:var(--doge-gold); }
  .id-num { font-family:'Consolas','Courier New',monospace; font-size:28px; font-weight:800; letter-spacing:2px; color:#FFFDF3; margin:4px 0 2px; }
  .id-name { font-size:13px; font-weight:700; color:var(--doge-bright); margin-top:6px; }
  .id-name.unset { color:rgba(255,253,243,.45); font-weight:600; font-size:11px; }
  .id-rows { margin:0 16px; }
  .id-row { display:flex; justify-content:space-between; align-items:center; gap:10px; padding:9px 2px; border-bottom:1px solid var(--border); font-size:11px; }
  .id-row .k { color:var(--text-muted); flex:0 0 auto; }
  .id-row .v { color:var(--doge-brown); font-family:monospace; font-size:10px; word-break:break-all; text-align:right; }
  .id-actions { display:flex; gap:8px; padding:14px 16px; }
  .id-btn { flex:1; padding:11px; border:none; border-radius:var(--r-md); background:linear-gradient(135deg,var(--doge-bright),var(--doge-orange)); color:#FFFDF3; font-size:12px; font-weight:800; cursor:pointer; box-shadow:0 4px 12px rgba(232,152,35,.3); }
  .id-btn.sec { background:var(--bg-card); color:var(--doge-deep); border:1px solid var(--border-strong); box-shadow:var(--shadow-sm); }
  .id-btn:hover { transform:translateY(-1px); }
  `;
  function injectCSS() { if ($('doge-id-css')) return; const s = document.createElement('style'); s.id = 'doge-id-css'; s.textContent = CSS; document.head.appendChild(s); }
  function ensureApps() { let g = $('appGrid'); if (g) return g; const ag = document.querySelector('#page-wallet .action-grid') || document.querySelector('.action-grid'); if (!ag) return null; const sec = document.createElement('div'); sec.className = 'app-section'; sec.innerHTML = `<div class="app-section-title" id="slotAppsTitle">${L().appsTitle}</div><div class="app-grid" id="appGrid"></div>`; ag.insertAdjacentElement('afterend', sec); return $('appGrid'); }
  function injectButton() { const g = ensureApps(); if (!g || $('btnGoId')) return; const b = document.createElement('div'); b.className = 'action-btn'; b.id = 'btnGoId'; b.innerHTML = `<div class="icon">🆔</div><div class="label" id="idNavLabel">${L().action}</div>`; b.addEventListener('click', open); g.appendChild(b); }
  function injectPage() {
    const c = document.querySelector('.container'); if (!c || $('page-id')) return;
    const l = L(); const p = document.createElement('div'); p.className = 'page'; p.id = 'page-id';
    p.innerHTML = `<div style="padding:0 0 12px">
      <div class="id-header"><button class="id-back" id="idBack" title="${l.back}">←</button><div class="id-title">${l.title}</div><div class="id-sub">${l.sub}</div></div>
      <div class="id-card">
        <div class="id-avatar" id="idAvatar">🐕</div>
        <div class="id-num-label">${l.label}</div>
        <div class="id-num" id="idNum">— — —</div>
        <div class="id-name unset" id="idName">${l.unset}</div>
      </div>
      <div class="id-rows">
        <div class="id-row"><span class="k">${l.addrLabel}</span><span class="v" id="idAddr">—</span></div>
      </div>
      <div class="id-actions">
        <button class="id-btn" id="idCopyNum">📋 ${l.copyId}</button>
        <button class="id-btn sec" id="idCopyAddr">📋 ${l.copyAddr}</button>
      </div>
    </div>`;
    c.appendChild(p);
    $('idBack').addEventListener('click', back);
    $('idCopyNum').addEventListener('click', async () => { const a = myAddr(); if (!a) return toast(L().noWallet, true); await copy(deriveId(a)); });
    $('idCopyAddr').addEventListener('click', async () => { const a = myAddr(); if (!a) return toast(L().noWallet, true); await copy(a); });
  }
  async function copy(t) { try { await navigator.clipboard.writeText(t); toast(L().copied); } catch (e) { toast(t); } }
  function open() { if (window.showPage) showPage('page-id'); const h = $('mainHeader'); if (h) h.style.display = 'none'; render(); }
  function back() { if (window.showPage) showPage('page-wallet'); const h = $('mainHeader'); if (h) h.style.display = 'flex'; }
  async function render() {
    const l = L(); const a = myAddr();
    const num = $('idNum'), nm = $('idName'), ad = $('idAddr'), av = $('idAvatar');
    if (!a) { num.textContent = '—'; nm.textContent = l.noWallet; nm.className = 'id-name unset'; ad.textContent = '—'; return; }
    const id = deriveId(a);
    num.textContent = fmtId(id);
    ad.textContent = a;
    let s = 0; for (const ch of id) s += ch.charCodeAt(0); av.textContent = ['🐕', '🐶', '🦴', '🚀', '🌙', '💎', '🍒', '⭐'][s % 8];
    const self = await getLS('doge_ns_self', null);
    const myName = self ? (typeof self === 'string' ? self : (self.address === a ? self.name : '')) : '';
    if (myName) { nm.textContent = myName + '.doge'; nm.className = 'id-name'; }
    else { nm.textContent = l.unset; nm.className = 'id-name unset'; }
  }
  function applyLang() { const e = $('idNavLabel'); if (e) e.textContent = L().action; const t = $('slotAppsTitle'); if (t) t.textContent = L().appsTitle; if (document.querySelector('#page-id.active')) open(); }
  function init() { injectCSS(); injectPage(); injectButton(); const lb = $('langBtn'); if (lb) lb.addEventListener('click', () => setTimeout(applyLang, 0)); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
