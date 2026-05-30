/**
 * plugin-slot.js — DOGE 老虎机 插件（自包含 · 即插即用）
 *
 * © 2026 onedooge — 随 DOGE Wallet 一起开源（MIT）。
 *
 * 设计：钱包核心一行不动。挂载方式 = popup.html 末尾加一行
 *   <script src="js/plugin-slot.js"></script>
 * 本文件自己注入：按钮、页面、样式、双语文案、逻辑。删掉这行/这文件即彻底移除。
 *
 * ⚠ 当前状态：仅用于单机测试 —— 用游戏币，不使用真实 DOGE、不发任何链上交易。
 *   （后期若接真币/兑换需另行评估赌博合规，目前纯本地娱乐 demo。）
 */
(function () {
  'use strict';
  const PLUGIN_VERSION = '1.0.0';

  /* ===================== 双语文案（跟随钱包语言） ===================== */
  const STR = {
    zh: {
      action: '老虎机', title: '🎰 DOGE 老虎机', sub: 'Much Luck · Very Spin · Wow',
      credits: '游戏币', note: '游戏币 · 非真实 DOGE', betLabel: '本次押注',
      spin: '🎰 开转 SPIN', spinning: '转动中...', reset: '重置游戏币',
      paytable: '赔付表（三连倍率）', pair: '任意两连', back: '← 返回钱包', appsTitle: '应用',
      msgDefault: '选好押注，点 SPIN！', miss: '没中，再来一把！🐕',
      insufficient: '游戏币不足，请重置', resetConfirm: '把游戏币重置回 1000？',
      win3: (x, w) => `三连 ×${x}！赢 ${w} 🎉`, win2: (x, w) => `两连 ×${x} · 赢 ${w}`,
      stSpins: '转', stBet: '累计押', stWon: '累计赢', stBest: '最高',
    },
    en: {
      action: 'Slots', title: '🎰 DOGE Slots', sub: 'Much Luck · Very Spin · Wow',
      credits: 'Game Credits', note: 'Game credits · not real DOGE', betLabel: 'Your bet',
      spin: '🎰 SPIN', spinning: 'Spinning...', reset: 'Reset credits',
      paytable: 'Paytable (3-match)', pair: 'Any pair', back: '← Back', appsTitle: 'Apps',
      msgDefault: 'Pick a bet, hit SPIN!', miss: 'No match — spin again! 🐕',
      insufficient: 'Not enough credits — reset to refill', resetConfirm: 'Reset game credits to 1000?',
      win3: (x, w) => `3-match ×${x}! Won ${w} 🎉`, win2: (x, w) => `Pair ×${x} · Won ${w}`,
      stSpins: 'Spins', stBet: 'Bet', stWon: 'Won', stBest: 'Best',
    },
  };
  function lang() { try { return (window.I18n && I18n.getLang && I18n.getLang() === 'en') ? 'en' : 'zh'; } catch (e) { return 'zh'; } }
  function L() { return STR[lang()]; }

  /* ===================== 游戏逻辑（游戏币，chrome.storage.local: doge_slot） ===================== */
  const KEY = 'doge_slot', START = 1000, PAIR_X = 2;
  const SYMBOLS = [
    { key: 'doge', emoji: '🐕', weight: 3, x3: 10 }, { key: 'rocket', emoji: '🚀', weight: 5, x3: 8 },
    { key: 'moon', emoji: '🌙', weight: 6, x3: 7 }, { key: 'diamond', emoji: '💎', weight: 8, x3: 6 },
    { key: 'seven', emoji: '7️⃣', weight: 10, x3: 5 }, { key: 'bone', emoji: '🦴', weight: 14, x3: 4 },
    { key: 'cherry', emoji: '🍒', weight: 20, x3: 3 },
  ];
  const EMOJIS = SYMBOLS.map(s => s.emoji);
  const sym = k => SYMBOLS.find(s => s.key === k);
  const def = () => ({ credits: START, spins: 0, totalBet: 0, totalWon: 0, bestWin: 0 });
  const getState = () => new Promise(r => chrome.storage.local.get([KEY], d => r(Object.assign(def(), d[KEY] || {}))));
  const setState = s => new Promise(r => chrome.storage.local.set({ [KEY]: s }, r));
  function spin3() {
    const w = SYMBOLS.map(s => s.weight), tot = w.reduce((a, b) => a + b, 0), k = SYMBOLS.map(s => s.key);
    const pick = () => { let x = Math.random() * tot; for (let i = 0; i < k.length; i++) { x -= w[i]; if (x < 0) return k[i]; } return k[k.length - 1]; };
    return [pick(), pick(), pick()];
  }
  function judge(r, bet) {
    const [a, b, c] = r;
    if (a === b && b === c) return { win: bet * sym(a).x3, x: sym(a).x3, m: 'three' };
    if (a === b || b === c || a === c) return { win: bet * PAIR_X, x: PAIR_X, m: 'two' };
    return { win: 0, x: 0, m: 'none' };
  }
  const r2 = n => Math.round(n * 100) / 100; // 防浮点误差,保留 2 位小数
  async function doSpin(bet) {
    bet = r2(parseFloat(bet));
    const s = await getState();
    if (!bet || bet <= 0 || bet > s.credits) throw new Error('bad_bet');
    const reels = spin3(); let { win, x, m } = judge(reels, bet); win = r2(win);
    s.credits = r2(s.credits + win - bet); s.spins++; s.totalBet = r2(s.totalBet + bet); s.totalWon = r2(s.totalWon + win); s.bestWin = Math.max(s.bestWin, win);
    await setState(s);
    return { reels, emojis: reels.map(k => sym(k).emoji), win, x, m, state: s };
  }

  /* ===================== 样式（自注入） ===================== */
  const CSS = `
  /* 紧凑布局:整页一屏装下,不滚动 */
  .slot-wrap { padding: 0 0 8px; }
  .slot-header { position:relative; background: linear-gradient(135deg, var(--doge-bright), var(--doge-orange)); padding: 9px 20px 7px; text-align: center; border-bottom: 2px solid var(--doge-gold); }
  .slot-title { font-family:'Impact','Arial Black',sans-serif; font-size:17px; color:#FFFDF3; text-shadow:0 2px 6px rgba(0,0,0,.25); }
  .slot-sub { font-size:9px; color:rgba(255,253,243,.85); margin-top:1px; }
  .slot-back { position:absolute; left:10px; top:50%; transform:translateY(-50%); width:26px; height:26px; border:none; border-radius:8px; background:rgba(255,255,255,.28); color:#FFFDF3; font-size:15px; font-weight:800; line-height:1; cursor:pointer; }
  .slot-back:hover { background:rgba(255,255,255,.5); }
  .slot-credit-card { display:flex; align-items:center; gap:12px; margin:9px 16px; padding:9px 14px; background:linear-gradient(155deg,#FFFFFF,#FFF6D6 70%,#FCE7A2); border:1px solid var(--border); border-radius:var(--r-lg); box-shadow:var(--shadow-sm); }
  .slot-credit-main { flex:1; text-align:center; min-width:0; }
  .slot-credit-label { font-size:9px; font-weight:700; letter-spacing:1.4px; text-transform:uppercase; color:var(--doge-deep); margin-bottom:3px; }
  .slot-credit-amt { font-family:'Impact','Arial Black',sans-serif; font-size:30px; color:var(--doge-brown); line-height:1; letter-spacing:.5px; }
  .slot-credit-note { font-size:9px; color:var(--text-muted); margin-top:3px; }
  .slot-stats { flex:0 0 auto; min-width:104px; padding-left:12px; border-left:1px solid var(--border); }
  .slot-stat-row { display:flex; justify-content:space-between; gap:8px; font-size:10px; color:var(--text-secondary); padding:1.5px 0; }
  .slot-stat-row b { color:var(--doge-brown); font-weight:800; }
  .slot-reels { display:flex; gap:10px; justify-content:center; padding:10px 12px; margin:2px 16px 0; background:#3D2800; border-radius:var(--r-lg); border:3px solid var(--doge-gold); box-shadow:inset 0 2px 12px rgba(0,0,0,.45); }
  .slot-reel { flex:1; max-width:88px; aspect-ratio:1/1; display:flex; align-items:center; justify-content:center; font-size:46px; background:#FFFDF3; border-radius:12px; box-shadow:inset 0 0 8px rgba(0,0,0,.15); overflow:hidden; }
  .slot-reel.spinning { animation:slot-shake .3s linear infinite; }
  @keyframes slot-shake { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
  .slot-reels.win .slot-reel { animation:slot-pop .5s ease; box-shadow:0 0 16px var(--doge-bright), inset 0 0 8px rgba(0,0,0,.15); }
  @keyframes slot-pop { 0%{transform:scale(1)} 50%{transform:scale(1.1)} 100%{transform:scale(1)} }
  .slot-msg { text-align:center; min-height:16px; font-size:13px; font-weight:700; color:var(--doge-deep); margin:5px 16px 2px; }
  .slot-msg.win { color:var(--success); } .slot-msg.lose { color:var(--danger); }
  .slot-bet-row { display:flex; gap:6px; padding:0 16px; }
  .slot-bet-btn { flex:1; padding:7px 2px; border:1px solid var(--border); border-radius:var(--r-sm); background:var(--bg-card); color:var(--doge-deep); font-size:12px; font-weight:800; cursor:pointer; font-family:inherit; transition:all .18s; box-shadow:var(--shadow-sm); }
  .slot-bet-btn:hover { background:var(--bg-card-soft); border-color:var(--doge-orange); }
  .slot-bet-btn.active { background:linear-gradient(135deg,var(--doge-bright),var(--doge-orange)); border-color:var(--doge-orange); color:#FFFDF3; }
  .slot-curbet { text-align:center; font-size:11px; color:var(--text-secondary); margin:4px 0; }
  .slot-curbet b { color:var(--doge-brown); font-size:13px; }
  .slot-spin-btn { display:block; width:calc(100% - 32px); margin:3px 16px 8px; padding:11px; border:none; border-radius:var(--r-md); background:linear-gradient(135deg,#E45757,#C9352C); color:#FFFDF3; font-family:'Impact','Arial Black',sans-serif; font-size:19px; letter-spacing:1px; cursor:pointer; box-shadow:0 5px 16px rgba(201,53,44,.42); transition:all .18s; }
  .slot-spin-btn:hover { transform:translateY(-2px); box-shadow:0 7px 18px rgba(201,53,44,.55); }
  .slot-spin-btn:disabled { filter:grayscale(.5); cursor:not-allowed; transform:none; }
  .slot-tools { display:flex; justify-content:center; padding:0 16px 6px; }
  .slot-tools button { background:transparent; border:1px solid var(--border-strong); border-radius:var(--r-sm); color:var(--text-muted); font-size:10px; font-weight:700; padding:5px 18px; cursor:pointer; }
  .slot-tools button:hover { background:var(--bg-card-soft); border-color:var(--doge-orange); color:var(--doge-deep); }
  .slot-pay-card { margin:4px 16px; padding:7px 12px 5px; background:var(--bg-card-soft); border:1px solid var(--border); border-radius:var(--r-lg); box-shadow:var(--shadow-sm); }
  .slot-paytable-title { text-align:center; font-size:10px; font-weight:800; letter-spacing:.3px; color:var(--doge-deep); margin:0 0 5px; }
  .slot-paytable { display:grid; grid-template-columns:1fr 1fr; column-gap:16px; row-gap:1px; }
  .slot-pay-row { display:flex; justify-content:space-between; align-items:center; font-size:11px; padding:2px 2px; border-bottom:1px solid rgba(160,127,50,.10); }
  .slot-pay-row span { letter-spacing:2px; } .slot-pay-row b { color:var(--success); }
  /* 应用区(插件按需创建) */
  .app-section { margin:0 16px 14px; padding:12px 14px 14px; background:var(--bg-card-soft); border:1px solid var(--border); border-radius:var(--r-lg); box-shadow:var(--shadow-sm); }
  .app-section-title { font-size:12px; font-weight:800; color:var(--doge-deep); letter-spacing:.5px; margin-bottom:10px; }
  .app-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }
  .app-grid .action-btn { width:auto; padding:12px 2px 10px; }
  .app-grid .action-btn .label { font-size:10px; white-space:nowrap; }
  `;

  /* ===================== 状态/交互 ===================== */
  let bet = 0.42, spinning = false;
  const $ = id => document.getElementById(id);
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  function toast(m, err) { if (window.showToast) showToast(m, !!err); }
  function fmt(n) { if (window.formatDoge) return formatDoge(n); n = parseFloat(n) || 0; return n >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(2) + 'K' : n.toFixed(2); }
  function msg(text, cls) { const m = $('slotMsg'); if (m) { m.textContent = text; m.className = 'slot-msg ' + (cls || ''); } }
  function pickBet(b, btn) { bet = b; const e = $('slotCurBet'); if (e) e.textContent = b; document.querySelectorAll('.slot-bet-btn').forEach(x => x.classList.remove('active')); if (btn) btn.classList.add('active'); }
  function render(s) {
    const c = $('slotCredits'); if (c) c.textContent = Number(s.credits).toFixed(2);
    const st = $('slotStats'); if (!st) return;
    const l = L();
    st.innerHTML =
      `<div class="slot-stat-row"><span>${l.stSpins}</span><b>${s.spins}</b></div>`
    + `<div class="slot-stat-row"><span>${l.stBet}</span><b>${fmt(s.totalBet)}</b></div>`
    + `<div class="slot-stat-row"><span>${l.stWon}</span><b>${fmt(s.totalWon)}</b></div>`
    + `<div class="slot-stat-row"><span>${l.stBest}</span><b>${fmt(s.bestWin)}</b></div>`;
  }
  function buildPaytable() {
    const el = $('slotPaytable'); if (!el) return;
    el.innerHTML = SYMBOLS.map(s => `<div class="slot-pay-row"><span>${s.emoji}${s.emoji}${s.emoji}</span><b>×${s.x3}</b></div>`).join('')
      + `<div class="slot-pay-row"><span>${L().pair}</span><b>×${PAIR_X}</b></div>`;
  }
  async function refresh() {
    const s = await getState(); render(s);
    if (bet > s.credits) bet = Math.min(0.42, s.credits);
    const e = $('slotCurBet'); if (e) e.textContent = bet;
    buildPaytable(); msg(L().msgDefault, '');
  }
  function openSlot() { if (window.showPage) showPage('page-slot'); const h = $('mainHeader'); if (h) h.style.display = 'none'; refresh(); }
  async function handleSpin(e) {
    if (e && e.isTrusted === false) return; // 防脚本刷单:只认真人点击,合成/脚本触发的点击一律忽略
    if (spinning) return;
    const s = await getState();
    if (bet <= 0 || bet > s.credits) { msg(L().insufficient, 'lose'); toast(L().insufficient, true); return; }
    spinning = true; const btn = $('slotSpinBtn'); btn.disabled = true; $('slotReels').classList.remove('win'); msg(L().spinning, '');
    const els = ['slotR0', 'slotR1', 'slotR2'].map($);
    const timers = els.map(el => { el.classList.add('spinning'); return setInterval(() => { el.textContent = EMOJIS[Math.floor(Math.random() * EMOJIS.length)]; }, 75); });
    let res; try { res = await doSpin(bet); } catch (e) { res = { error: true }; }
    for (let i = 0; i < 3; i++) { await sleep(420); clearInterval(timers[i]); els[i].classList.remove('spinning'); if (res && res.emojis) els[i].textContent = res.emojis[i]; }
    if (!res || res.error) { msg(L().insufficient, 'lose'); }
    else {
      render(res.state);
      if (res.win > 0) { msg(res.m === 'three' ? L().win3(res.x, res.win) : L().win2(res.x, res.win), 'win'); $('slotReels').classList.add('win'); }
      else msg(L().miss, 'lose');
      if (bet > res.state.credits) { bet = res.state.credits; const e = $('slotCurBet'); if (e) e.textContent = bet; }
    }
    spinning = false; btn.disabled = false;
  }

  /* ===================== 注入 DOM ===================== */
  function injectCSS() { if ($('slot-plugin-css')) return; const el = document.createElement('style'); el.id = 'slot-plugin-css'; el.textContent = CSS; document.head.appendChild(el); }
  function pageHTML() {
    const l = L();
    return `
    <div class="slot-wrap">
      <div class="slot-header">
        <button class="slot-back" id="slotBack" title="${l.back}">←</button>
        <div class="slot-title">${l.title}</div><div class="slot-sub">${l.sub}</div>
      </div>
      <div class="slot-credit-card">
        <div class="slot-credit-main">
          <div class="slot-credit-label">${l.credits}</div>
          <div class="slot-credit-amt"><span id="slotCredits">0</span></div>
          <div class="slot-credit-note">${l.note}</div>
        </div>
        <div class="slot-stats" id="slotStats"></div>
      </div>
      <div class="slot-reels" id="slotReels"><div class="slot-reel" id="slotR0">🐕</div><div class="slot-reel" id="slotR1">🚀</div><div class="slot-reel" id="slotR2">🌙</div></div>
      <div class="slot-msg" id="slotMsg">${l.msgDefault}</div>
      <div class="slot-bet-row">
        <button class="slot-bet-btn" data-bet="0.42">0.42</button>
        <button class="slot-bet-btn" data-bet="0.69">0.69</button>
      </div>
      <div class="slot-curbet"><span>${l.betLabel}</span>: <b id="slotCurBet">0.42</b></div>
      <button class="slot-spin-btn" id="slotSpinBtn">${l.spin}</button>
      <div class="slot-tools"><button id="slotReset">${l.reset}</button></div>
      <div class="slot-pay-card">
        <div class="slot-paytable-title">${l.paytable}</div>
        <div class="slot-paytable" id="slotPaytable"></div>
      </div>
    </div>`;
  }
  // 应用区由插件按需创建(钱包核心不内置),插在 .action-grid 之后
  function ensureAppsSection() {
    let grid = document.getElementById('appGrid');
    if (grid) return grid;
    const actionGrid = document.querySelector('#page-wallet .action-grid') || document.querySelector('.action-grid');
    if (!actionGrid) return null;
    const sec = document.createElement('div');
    sec.className = 'app-section';
    sec.innerHTML = `<div class="app-section-title" id="slotAppsTitle">${L().appsTitle}</div><div class="app-grid" id="appGrid"></div>`;
    actionGrid.insertAdjacentElement('afterend', sec);
    return document.getElementById('appGrid');
  }
  function injectButton() {
    const grid = ensureAppsSection();
    if (!grid || $('btnGoSlot')) return;
    const btn = document.createElement('div');
    btn.className = 'action-btn'; btn.id = 'btnGoSlot';
    btn.innerHTML = `<div class="icon">🎰</div><div class="label" id="slotNavLabel">${L().action}</div>`;
    btn.addEventListener('click', openSlot);
    grid.appendChild(btn);
  }
  function injectPage() {
    const c = document.querySelector('.container'); if (!c || $('page-slot')) return;
    const p = document.createElement('div'); p.className = 'page'; p.id = 'page-slot'; p.innerHTML = pageHTML();
    c.appendChild(p);
    $('slotBack').addEventListener('click', () => { if (window.showPage) showPage('page-wallet'); });
    p.querySelectorAll('.slot-bet-btn[data-bet]').forEach(b => b.addEventListener('click', () => pickBet(parseFloat(b.dataset.bet), b)));
    $('slotSpinBtn').addEventListener('click', handleSpin);
    $('slotReset').addEventListener('click', async () => { if (confirm(L().resetConfirm)) { const s = def(); await setState(s); render(s); msg(L().msgDefault, ''); } });
  }

  /* ===================== 语言切换时刷新插件文案 ===================== */
  function applyLang() {
    const l = L();
    const set = (sel, txt) => { const e = document.querySelector(sel); if (e) e.textContent = txt; };
    set('#slotNavLabel', l.action);
    set('#slotAppsTitle', l.appsTitle);
    if ($('page-slot')) {
      set('.slot-title', l.title); set('.slot-sub', l.sub);
      set('.slot-credit-label', l.credits); set('.slot-credit-note', l.note);
      set('#slotSpinBtn', l.spin);
      set('#slotReset', l.reset);
      set('.slot-paytable-title', l.paytable); set('.slot-curbet span', l.betLabel);
      buildPaytable(); getState().then(render);
    }
  }

  /* ===================== 初始化 ===================== */
  function init() {
    injectCSS(); injectPage(); injectButton();
    pickBet(0.42, document.querySelector('.slot-bet-btn[data-bet="0.42"]'));
    const lb = $('langBtn'); if (lb) lb.addEventListener('click', () => setTimeout(applyLang, 0));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
