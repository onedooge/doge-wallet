/**
 * plugin-dns.js — .doge Doge Name Service 插件（自包含 · 即插即用）
 *
 * © 2026 onedooge — 随 DOGE Wallet 一起开源（MIT）。
 *
 * Doge 域名服务:给自己取个 name.doge,并维护一份「name.doge → 地址」名册,
 * 解析后可一键复制/转账,不用记长地址。
 * ⚠ 本地 Demo:名字/名册只存本浏览器;全网唯一名字解析需后台(下一步)。
 */
(function () {
  'use strict';
  const STR = {
    zh: { action: '.doge', title: '🌐 .doge 域名', sub: 'Doge Name Service · 别记长地址',
      myTitle: '我的 .doge', claimPh: '取个名字', claim: '认领 / 修改', mine: '我的域名',
      bookTitle: '域名名册（name.doge → 地址）', addName: '名字', addAddr: 'DOGE 地址', addBtn: '+ 登记域名',
      empty: '还没有登记域名,在上面添加', resolve: '转账', copy: '复制地址',
      back: '← 返回钱包', noWallet: '请先解锁钱包', copied: '已复制 🐕', appsTitle: '应用',
      claimed: '已认领 ', saved: '已登记 ', nameBad: '名字不合法:小写字母+数字,3~15位', needAddr: '请填地址', dup: '该名字已被登记' },
    en: { action: '.doge', title: '🌐 .doge Names', sub: 'Doge Name Service · skip long addresses',
      myTitle: 'My .doge', claimPh: 'pick a name', claim: 'Claim / Change', mine: 'My name',
      bookTitle: 'Name book (name.doge → address)', addName: 'name', addAddr: 'DOGE address', addBtn: '+ Register name',
      empty: 'No names yet — add one above', resolve: 'Send', copy: 'Copy',
      back: '← Back', noWallet: 'Unlock wallet first', copied: 'Copied 🐕', appsTitle: 'Apps',
      claimed: 'Claimed ', saved: 'Registered ', nameBad: 'Invalid: lowercase letters+digits, 3-15', needAddr: 'Enter address', dup: 'Name already registered' },
  };
  const $ = id => document.getElementById(id);
  function lang() { try { return (window.I18n && I18n.getLang && I18n.getLang() === 'en') ? 'en' : 'zh'; } catch (e) { return 'zh'; } }
  function L() { return STR[lang()]; }
  function getLS(k, d) { return new Promise(r => chrome.storage.local.get([k], v => r(v[k] === undefined ? d : v[k]))); }
  function setLS(k, v) { return new Promise(r => chrome.storage.local.set({ [k]: v }, r)); }
  function myAddr() { try { return (window.WalletCore && WalletCore.state && WalletCore.state.address) || ''; } catch (e) { return ''; } }
  function toast(m, e) { if (window.showToast) showToast(m, !!e); }
  function esc(s) { return String(s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m])); }
  const validName = n => /^[a-z0-9]{3,15}$/.test(n);

  const CSS = `
  .app-section { margin:0 16px 14px; padding:12px 14px 14px; background:var(--bg-card-soft); border:1px solid var(--border); border-radius:var(--r-lg); box-shadow:var(--shadow-sm); }
  .app-section-title { font-size:12px; font-weight:800; color:var(--doge-deep); letter-spacing:.5px; margin-bottom:10px; }
  .app-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }
  .app-grid .action-btn { width:auto; padding:12px 2px 10px; }
  .app-grid .action-btn .label { font-size:10px; white-space:nowrap; }
  .ns-header { position:relative; background:linear-gradient(135deg,var(--doge-bright),var(--doge-orange)); padding:9px 20px 7px; text-align:center; border-bottom:2px solid var(--doge-gold); }
  .ns-title { font-family:'Impact','Arial Black',sans-serif; font-size:17px; color:#FFFDF3; text-shadow:0 2px 6px rgba(0,0,0,.25); }
  .ns-sub { font-size:9px; color:rgba(255,253,243,.85); margin-top:1px; }
  .ns-back { position:absolute; left:10px; top:50%; transform:translateY(-50%); min-width:26px; height:26px; padding:0 8px; border:none; border-radius:8px; background:rgba(255,255,255,.28); color:#FFFDF3; font-size:13px; font-weight:800; cursor:pointer; }
  .ns-back:hover { background:rgba(255,255,255,.5); }
  .ns-mine { margin:12px 16px; padding:12px 14px; background:linear-gradient(155deg,#FFFFFF,#FFF6D6 70%,#FCE7A2); border:1px solid var(--border); border-radius:var(--r-lg); box-shadow:var(--shadow-sm); }
  .ns-mine-label { font-size:10px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:var(--doge-deep); margin-bottom:6px; }
  .ns-mine-val { font-family:'Impact','Arial Black',sans-serif; font-size:22px; color:var(--doge-brown); margin-bottom:8px; }
  .ns-mine-val.unset { font-family:inherit; font-size:12px; font-weight:600; color:var(--text-muted); }
  .ns-row { display:flex; gap:8px; }
  .ns-suffix-wrap { flex:1; display:flex; align-items:center; background:#FFFFFF; border:1px solid var(--border); border-radius:10px; overflow:hidden; }
  .ns-input { flex:1; padding:9px 10px; border:none; outline:none; font-size:13px; color:var(--text-primary); background:transparent; }
  .ns-suffix { padding:0 10px; font-size:12px; font-weight:700; color:var(--doge-orange); }
  .ns-claim { padding:0 14px; border:none; border-radius:10px; background:linear-gradient(135deg,var(--doge-bright),var(--doge-orange)); color:#FFFDF3; font-size:12px; font-weight:800; cursor:pointer; }
  .ns-sec { font-size:11px; font-weight:800; color:var(--doge-deep); margin:6px 18px; }
  .ns-add { margin:0 16px 8px; padding:10px 12px; background:var(--bg-card-soft); border:1px solid var(--border); border-radius:var(--r-md); }
  .ns-add .ns-input { border:1px solid var(--border); border-radius:8px; margin-bottom:6px; width:100%; background:#fff; }
  .ns-add-btn { width:100%; padding:8px; border:none; border-radius:8px; background:var(--doge-bright); color:#FFFDF3; font-size:12px; font-weight:800; cursor:pointer; }
  .ns-list { padding:0 16px; max-height:200px; overflow-y:auto; }
  .ns-item { display:flex; align-items:center; gap:8px; padding:9px 10px; border:1px solid var(--border); border-radius:10px; margin-bottom:6px; background:var(--bg-card); }
  .ns-item .mid { flex:1; min-width:0; }
  .ns-item .nm { font-size:13px; font-weight:800; color:var(--doge-brown); }
  .ns-item .ad { font-size:9px; font-family:monospace; color:var(--text-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .ns-mini { flex:0 0 auto; border:1px solid var(--border-strong); background:var(--bg-card-soft); border-radius:7px; font-size:10px; font-weight:700; color:var(--doge-deep); padding:5px 8px; cursor:pointer; }
  .ns-mini:hover { border-color:var(--doge-orange); }
  .ns-empty { text-align:center; color:var(--text-muted); font-size:11px; padding:18px; }
  `;
  function injectCSS() { if ($('doge-ns-css')) return; const s = document.createElement('style'); s.id = 'doge-ns-css'; s.textContent = CSS; document.head.appendChild(s); }
  function ensureApps() { let g = $('appGrid'); if (g) return g; const ag = document.querySelector('#page-wallet .action-grid') || document.querySelector('.action-grid'); if (!ag) return null; const sec = document.createElement('div'); sec.className = 'app-section'; sec.innerHTML = `<div class="app-section-title" id="slotAppsTitle">${L().appsTitle}</div><div class="app-grid" id="appGrid"></div>`; ag.insertAdjacentElement('afterend', sec); return $('appGrid'); }
  function injectButton() { const g = ensureApps(); if (!g || $('btnGoNs')) return; const b = document.createElement('div'); b.className = 'action-btn'; b.id = 'btnGoNs'; b.innerHTML = `<div class="icon">🌐</div><div class="label" id="nsNavLabel">${L().action}</div>`; b.addEventListener('click', open); g.appendChild(b); }
  function injectPage() {
    const c = document.querySelector('.container'); if (!c || $('page-ns')) return;
    const l = L(); const p = document.createElement('div'); p.className = 'page'; p.id = 'page-ns';
    p.innerHTML = `<div style="padding:0 0 14px">
      <div class="ns-header"><button class="ns-back" id="nsBack" title="${l.back}">←</button><div class="ns-title">${l.title}</div><div class="ns-sub">${l.sub}</div></div>
      <div class="ns-mine">
        <div class="ns-mine-label">${l.myTitle}</div>
        <div class="ns-mine-val unset" id="nsMine">—</div>
        <div class="ns-row">
          <div class="ns-suffix-wrap"><input class="ns-input" id="nsClaimInput" placeholder="${l.claimPh}" maxlength="15"/><span class="ns-suffix">.doge</span></div>
          <button class="ns-claim" id="nsClaimBtn">${l.claim}</button>
        </div>
      </div>
      <div class="ns-sec">${l.bookTitle}</div>
      <div class="ns-add">
        <input class="ns-input" id="nsAddName" placeholder="${l.addName} (name.doge)" maxlength="20"/>
        <input class="ns-input" id="nsAddAddr" placeholder="${l.addAddr} (D...)"/>
        <button class="ns-add-btn" id="nsAddBtn">${l.addBtn}</button>
      </div>
      <div class="ns-list" id="nsList"></div>
    </div>`;
    c.appendChild(p);
    $('nsBack').addEventListener('click', back);
    $('nsClaimBtn').addEventListener('click', claim);
    $('nsAddBtn').addEventListener('click', addName);
  }
  function open() { if (window.showPage) showPage('page-ns'); const h = $('mainHeader'); if (h) h.style.display = 'none'; render(); }
  function back() { if (window.showPage) showPage('page-wallet'); const h = $('mainHeader'); if (h) h.style.display = 'flex'; }

  async function claim() {
    const l = L(); if (!myAddr()) return toast(l.noWallet, true);
    const v = ($('nsClaimInput').value || '').trim().toLowerCase().replace(/\.doge$/, '');
    if (!validName(v)) return toast(l.nameBad, true);
    await setLS('doge_ns_self', v);
    // 自己的名字也登记进名册(指向自己地址)
    const book = await getLS('doge_ns_book', {});
    book[v] = myAddr(); await setLS('doge_ns_book', book);
    $('nsClaimInput').value = '';
    toast(l.claimed + v + '.doge ✓');
    render();
  }
  async function addName() {
    const l = L();
    const n = ($('nsAddName').value || '').trim().toLowerCase().replace(/\.doge$/, '');
    const a = ($('nsAddAddr').value || '').trim();
    if (!validName(n)) return toast(l.nameBad, true);
    if (!a) return toast(l.needAddr, true);
    const book = await getLS('doge_ns_book', {});
    if (book[n] && book[n] !== a) return toast(l.dup, true);
    book[n] = a; await setLS('doge_ns_book', book);
    $('nsAddName').value = ''; $('nsAddAddr').value = '';
    toast(l.saved + n + '.doge ✓');
    render();
  }
  async function render() {
    const l = L(); const self = await getLS('doge_ns_self', ''); const book = await getLS('doge_ns_book', {});
    const mine = $('nsMine');
    if (self) { mine.textContent = self + '.doge'; mine.className = 'ns-mine-val'; }
    else { mine.textContent = l.noWallet === l.noWallet && myAddr() ? '— —' : l.noWallet; mine.className = 'ns-mine-val unset'; }
    const names = Object.keys(book).sort();
    const box = $('nsList');
    if (!names.length) { box.innerHTML = `<div class="ns-empty">${l.empty}</div>`; return; }
    box.innerHTML = names.map(n => `<div class="ns-item">
      <div class="mid"><div class="nm">${esc(n)}.doge</div><div class="ad">${esc(book[n])}</div></div>
      <button class="ns-mini" data-copy="${esc(book[n])}">📋 ${l.copy}</button>
      <button class="ns-mini" data-send="${esc(book[n])}">📤 ${l.resolve}</button>
    </div>`).join('');
    box.querySelectorAll('[data-copy]').forEach(b => b.addEventListener('click', () => copy(b.dataset.copy)));
    box.querySelectorAll('[data-send]').forEach(b => b.addEventListener('click', () => transfer(b.dataset.send)));
  }
  async function copy(t) { try { await navigator.clipboard.writeText(t); toast(L().copied); } catch (e) { toast(t); } }
  function transfer(addr) { if (window.showPage) { showPage('page-send'); const h = $('mainHeader'); if (h) h.style.display = 'flex'; } const to = document.getElementById('sendTo'); if (to) { to.value = addr; to.dispatchEvent(new Event('input')); } }

  window.openDogeNs = open; // 供其他插件(如 Chat)跳转取名
  function applyLang() { const e = $('nsNavLabel'); if (e) e.textContent = L().action; const t = $('slotAppsTitle'); if (t) t.textContent = L().appsTitle; if (document.querySelector('#page-ns.active')) open(); }
  function init() { injectCSS(); injectPage(); injectButton(); const lb = $('langBtn'); if (lb) lb.addEventListener('click', () => setTimeout(applyLang, 0)); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
