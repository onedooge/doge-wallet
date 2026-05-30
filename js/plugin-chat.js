/**
 * plugin-chat.js — Doge Chat 插件（自包含 · 即插即用 · 本地 Demo）
 *
 * © 2026 onedooge — 随 DOGE Wallet 一起开源（MIT）。
 *
 * 三合一:① .doge 自定义名 ② 12位 Doge 号(从钱包地址推导,类 QQ 号) ③ 聊天+通讯录
 *
 * ⚠ 当前为【本地 Demo】:名字/通讯录/消息都只存在本浏览器(chrome.storage.local)。
 *   真·跨用户聊天 / 全网名字解析需要后台(Nostr 或服务器),为下一步。
 *   内置「Doge 小助手」会自动回话,用于体验聊天交互。
 *
 * 挂载:popup.html 末尾 <script src="js/plugin-chat.js"></script>,删该行即卸载。
 */
(function () {
  'use strict';

  /* ===================== 双语文案 ===================== */
  const STR = {
    zh: {
      action: 'Doge Chat', title: '💬 Doge Chat', sub: 'Much Talk · Very Doge · Wow',
      back: '← 返回钱包', backChat: '← 聊天', appsTitle: '应用',
      myCard: '我的名片', setName: '点此设置 .doge 名字', nameHint: '只能用小写字母/数字,3~15位',
      idLabel: 'Doge 号', addrLabel: '地址', noWallet: '请先解锁钱包',
      contacts: '好友', addFriend: '+ 添加好友', noContacts: '还没有好友,点上面添加',
      addTitle: '添加好友', fRemark: '备注名', fDoge: '.doge 名字(可选)', fAddr: 'DOGE 地址',
      save: '保存好友', send: '发送', msgPh: '说点什么...', typeHere: '输入消息',
      copyOk: '已复制 🐕', saved: '已保存好友 🐕', needAddr: '请填 DOGE 地址', needRemark: '请填备注名',
      transfer: '转账', copyAddr: '复制地址', localNote: '本地演示:对方暂时收不到,联网功能下一步',
      assistantName: 'Doge 小助手',
      botReplies: ['wow 你好!🐕', 'much chat, very wow', '收到~ 🦴', 'to the moon! 🚀', '这是本地演示,真聊天等联网哦', '汪! 🐶', 'so doge, very talk', '你的 Doge 号很酷!'],
      namePrompt: '取个 .doge 名字(小写字母/数字,3~15位):', nameBad: '名字不合法:只能小写字母+数字,3~15位',
    },
    en: {
      action: 'Doge Chat', title: '💬 Doge Chat', sub: 'Much Talk · Very Doge · Wow',
      back: '← Back', backChat: '← Chats', appsTitle: 'Apps',
      myCard: 'My Card', setName: 'Tap to set your .doge name', nameHint: 'lowercase letters/digits, 3-15 chars',
      idLabel: 'Doge ID', addrLabel: 'Address', noWallet: 'Unlock wallet first',
      contacts: 'Friends', addFriend: '+ Add friend', noContacts: 'No friends yet — add one above',
      addTitle: 'Add Friend', fRemark: 'Nickname', fDoge: '.doge name (optional)', fAddr: 'DOGE address',
      save: 'Save friend', send: 'Send', msgPh: 'Say something...', typeHere: 'Type a message',
      copyOk: 'Copied 🐕', saved: 'Friend saved 🐕', needAddr: 'Enter a DOGE address', needRemark: 'Enter a nickname',
      transfer: 'Send DOGE', copyAddr: 'Copy address', localNote: 'Local demo: not delivered yet — networking is next',
      assistantName: 'Doge Bot',
      botReplies: ['wow hello!🐕', 'much chat, very wow', 'got it~ 🦴', 'to the moon! 🚀', 'local demo — real chat needs network', 'woof! 🐶', 'so doge, very talk', 'cool Doge ID!'],
      namePrompt: 'Pick a .doge name (lowercase letters/digits, 3-15):', nameBad: 'Invalid: lowercase letters + digits, 3-15 chars',
    },
  };
  function lang() { try { return (window.I18n && I18n.getLang && I18n.getLang() === 'en') ? 'en' : 'zh'; } catch (e) { return 'zh'; } }
  function L() { return STR[lang()]; }

  /* ===================== 数据(chrome.storage.local) ===================== */
  const K_PROFILE = 'doge_chat_profile', K_CONTACTS = 'doge_chat_contacts', K_MSGS = 'doge_chat_msgs';
  const BOT_ID = '000000000001';
  const AVATARS = ['🐕', '🐶', '🦴', '🚀', '🌙', '💎', '🍒', '⭐'];
  const $ = id => document.getElementById(id);

  function getLS(key, def) { return new Promise(r => chrome.storage.local.get([key], d => r(d[key] === undefined ? def : d[key]))); }
  function setLS(key, val) { return new Promise(r => chrome.storage.local.set({ [key]: val }, r)); }

  function myAddr() { try { return (window.WalletCore && WalletCore.state && WalletCore.state.address) || ''; } catch (e) { return ''; } }

  // 12位 Doge 号:从地址确定性推导(无地址则空)。类 QQ 号,全网一致、无需服务器。
  function deriveId(addr) {
    if (!addr) return '';
    let h = 0;
    for (let i = 0; i < addr.length; i++) h = (h * 131 + addr.charCodeAt(i)) % 1000000000000;
    return String(h).padStart(12, '0');
  }
  function avatarFor(idStr) { let s = 0; for (const c of String(idStr)) s += c.charCodeAt(0); return AVATARS[s % AVATARS.length]; }

  async function getContacts() {
    let list = await getLS(K_CONTACTS, null);
    if (!list) { list = []; await setLS(K_CONTACTS, list); }
    // 始终保证内置助手在最前
    if (!list.some(c => c.id === BOT_ID)) list = [{ id: BOT_ID, remark: '', dogeName: 'doge', address: 'demo', builtin: true }, ...list];
    return list;
  }
  function contactName(c) { return c.builtin ? L().assistantName : (c.remark || (c.dogeName ? c.dogeName + '.doge' : c.id)); }
  async function getMsgs(cid) { const all = await getLS(K_MSGS, {}); return all[cid] || []; }
  async function pushMsg(cid, m) { const all = await getLS(K_MSGS, {}); (all[cid] = all[cid] || []).push(m); await setLS(K_MSGS, all); }

  function toast(m, err) { if (window.showToast) showToast(m, !!err); }
  function go(id) { if (window.showPage) showPage(id); const h = $('mainHeader'); if (h) h.style.display = 'none'; }

  /* ===================== 样式 ===================== */
  const CSS = `
  /* 应用区(插件按需创建,与老虎机共用) */
  .app-section { margin:0 16px 14px; padding:12px 14px 14px; background:var(--bg-card-soft); border:1px solid var(--border); border-radius:var(--r-lg); box-shadow:var(--shadow-sm); }
  .app-section-title { font-size:12px; font-weight:800; color:var(--doge-deep); letter-spacing:.5px; margin-bottom:10px; }
  .app-grid { display:flex; flex-wrap:wrap; gap:10px; justify-content:center; }
  .app-grid .action-btn { width:92px; }
  /* Chat 通用 */
  .ch-wrap { padding:0 0 10px; }
  .ch-header { position:relative; background:linear-gradient(135deg,var(--doge-bright),var(--doge-orange)); padding:9px 20px 7px; text-align:center; border-bottom:2px solid var(--doge-gold); }
  .ch-title { font-family:'Impact','Arial Black',sans-serif; font-size:17px; color:#FFFDF3; text-shadow:0 2px 6px rgba(0,0,0,.25); }
  .ch-sub { font-size:9px; color:rgba(255,253,243,.85); margin-top:1px; }
  .ch-back { position:absolute; left:10px; top:50%; transform:translateY(-50%); min-width:26px; height:26px; padding:0 8px; border:none; border-radius:8px; background:rgba(255,255,255,.28); color:#FFFDF3; font-size:13px; font-weight:800; cursor:pointer; }
  .ch-back:hover { background:rgba(255,255,255,.5); }
  /* 名片 */
  .ch-card { display:flex; align-items:center; gap:12px; margin:10px 16px; padding:12px 14px; background:linear-gradient(155deg,#FFFFFF,#FFF6D6 70%,#FCE7A2); border:1px solid var(--border); border-radius:var(--r-lg); box-shadow:var(--shadow-sm); }
  .ch-avatar { flex:0 0 auto; width:46px; height:46px; border-radius:50%; background:linear-gradient(135deg,#FFFAEA,#FCE8A8); display:flex; align-items:center; justify-content:center; font-size:26px; border:1px solid var(--border); }
  .ch-card-main { flex:1; min-width:0; text-align:left; }
  .ch-name { font-size:15px; font-weight:800; color:var(--doge-brown); cursor:pointer; display:inline-flex; align-items:center; gap:5px; }
  .ch-name .edit { font-size:10px; color:var(--doge-orange); }
  .ch-name.unset { color:var(--text-muted); font-weight:700; font-size:12px; }
  .ch-meta { font-size:10px; color:var(--text-secondary); margin-top:3px; line-height:1.5; }
  .ch-meta b { color:var(--doge-deep); font-family:monospace; }
  .ch-addr { font-family:monospace; font-size:9px; color:var(--text-muted); word-break:break-all; }
  /* 列表 */
  .ch-sec-title { font-size:11px; font-weight:800; color:var(--doge-deep); margin:6px 18px 6px; display:flex; justify-content:space-between; align-items:center; }
  .ch-add-btn { background:var(--doge-bright); color:#FFFDF3; border:none; border-radius:14px; font-size:10px; font-weight:700; padding:4px 12px; cursor:pointer; }
  .ch-add-btn:hover { background:var(--doge-orange); }
  .ch-list { padding:0 12px; max-height:300px; overflow-y:auto; }
  .ch-item { display:flex; align-items:center; gap:10px; padding:9px 8px; border-radius:10px; cursor:pointer; }
  .ch-item:hover { background:var(--bg-card-soft); }
  .ch-item .av { flex:0 0 auto; width:38px; height:38px; border-radius:50%; background:linear-gradient(135deg,#FFFAEA,#FCE8A8); display:flex; align-items:center; justify-content:center; font-size:20px; }
  .ch-item .mid { flex:1; min-width:0; }
  .ch-item .nm { font-size:13px; font-weight:700; color:var(--doge-brown); }
  .ch-item .pv { font-size:10px; color:var(--text-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .ch-empty { text-align:center; color:var(--text-muted); font-size:11px; padding:24px 16px; }
  /* 会话 */
  .ch-msgs { padding:12px 14px; height:360px; overflow-y:auto; display:flex; flex-direction:column; gap:8px; background:var(--bg-primary); }
  .ch-bubble { max-width:74%; padding:8px 11px; border-radius:14px; font-size:12px; line-height:1.4; word-break:break-word; }
  .ch-bubble.them { align-self:flex-start; background:var(--bg-card); border:1px solid var(--border); color:var(--text-primary); border-bottom-left-radius:4px; }
  .ch-bubble.me { align-self:flex-end; background:linear-gradient(135deg,var(--doge-bright),var(--doge-orange)); color:#FFFDF3; border-bottom-right-radius:4px; }
  .ch-note { text-align:center; font-size:9px; color:var(--text-muted); padding:4px 16px; }
  .ch-input-bar { display:flex; gap:8px; padding:8px 12px; border-top:1px solid var(--border); background:var(--bg-card); }
  .ch-input { flex:1; padding:9px 12px; background:#FFFFFF; border:1px solid var(--border); border-radius:18px; font-size:12px; outline:none; color:var(--text-primary); }
  .ch-input:focus { border-color:var(--doge-orange); }
  .ch-send { flex:0 0 auto; padding:0 16px; border:none; border-radius:18px; background:linear-gradient(135deg,var(--doge-bright),var(--doge-orange)); color:#FFFDF3; font-size:12px; font-weight:800; cursor:pointer; }
  /* 添加好友 */
  .ch-form { padding:14px 18px; }
  .ch-field { margin-bottom:13px; }
  .ch-label { display:block; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.6px; color:var(--text-muted); margin-bottom:5px; }
  .ch-tf { width:100%; padding:10px 12px; background:#FFFFFF; border:1px solid var(--border); border-radius:10px; font-size:13px; outline:none; color:var(--text-primary); }
  .ch-tf:focus { border-color:var(--doge-orange); box-shadow:0 0 0 3px rgba(244,168,32,.16); }
  .ch-tf::placeholder { color:rgba(160,127,50,.5); }
  .ch-primary { width:100%; padding:12px; border:none; border-radius:var(--r-md); background:linear-gradient(135deg,var(--doge-bright),var(--doge-orange)); color:#FFFDF3; font-size:15px; font-weight:800; cursor:pointer; box-shadow:0 4px 14px rgba(232,152,35,.35); }
  .ch-primary:hover { transform:translateY(-1px); }
  .ch-convo-actions { display:flex; gap:8px; padding:8px 14px 0; }
  .ch-mini { flex:1; background:var(--bg-card); border:1px solid var(--border-strong); border-radius:8px; color:var(--doge-deep); font-size:11px; font-weight:700; padding:7px; cursor:pointer; }
  .ch-mini:hover { background:var(--bg-card-soft); border-color:var(--doge-orange); }
  `;

  /* ===================== 注入 ===================== */
  function injectCSS() { if ($('doge-chat-css')) return; const s = document.createElement('style'); s.id = 'doge-chat-css'; s.textContent = CSS; document.head.appendChild(s); }

  function ensureAppsSection() {
    let grid = $('appGrid'); if (grid) return grid;
    const ag = document.querySelector('#page-wallet .action-grid') || document.querySelector('.action-grid');
    if (!ag) return null;
    const sec = document.createElement('div'); sec.className = 'app-section';
    sec.innerHTML = `<div class="app-section-title" id="slotAppsTitle">${L().appsTitle}</div><div class="app-grid" id="appGrid"></div>`;
    ag.insertAdjacentElement('afterend', sec);
    return $('appGrid');
  }
  function injectButton() {
    const grid = ensureAppsSection(); if (!grid || $('btnGoChat')) return;
    const btn = document.createElement('div'); btn.className = 'action-btn'; btn.id = 'btnGoChat';
    btn.innerHTML = `<div class="icon">💬</div><div class="label" id="chatNavLabel">${L().action}</div>`;
    btn.addEventListener('click', openHome);
    grid.appendChild(btn);
  }

  function injectPages() {
    const c = document.querySelector('.container'); if (!c || $('page-chat')) return;
    const home = document.createElement('div'); home.className = 'page'; home.id = 'page-chat';
    home.innerHTML = homeHTML(); c.appendChild(home);
    const convo = document.createElement('div'); convo.className = 'page'; convo.id = 'page-chat-convo';
    convo.innerHTML = convoHTML(); c.appendChild(convo);
    const add = document.createElement('div'); add.className = 'page'; add.id = 'page-chat-add';
    add.innerHTML = addHTML(); c.appendChild(add);

    $('chatBack').addEventListener('click', () => backToWallet());
    $('chatName').addEventListener('click', editName);
    $('chatAddFriend').addEventListener('click', () => go('page-chat-add'));
    $('chatConvoBack').addEventListener('click', () => openHome());
    $('chatSendBtn').addEventListener('click', sendCurrent);
    $('chatInput').addEventListener('keydown', e => { if (e.key === 'Enter') sendCurrent(); });
    $('chatAddBack').addEventListener('click', () => openHome());
    $('chatSaveFriend').addEventListener('click', saveFriend);
  }

  function homeHTML() {
    const l = L();
    return `<div class="ch-wrap">
      <div class="ch-header"><button class="ch-back" id="chatBack" title="${l.back}">←</button>
        <div class="ch-title">${l.title}</div><div class="ch-sub">${l.sub}</div></div>
      <div class="ch-card">
        <div class="ch-avatar" id="chatMyAvatar">🐕</div>
        <div class="ch-card-main">
          <div class="ch-name unset" id="chatName">${l.setName}</div>
          <div class="ch-meta"><span>${l.idLabel}:</span> <b id="chatMyId">—</b></div>
          <div class="ch-addr" id="chatMyAddr">—</div>
        </div>
      </div>
      <div class="ch-sec-title"><span>${l.contacts}</span><button class="ch-add-btn" id="chatAddFriend">${l.addFriend}</button></div>
      <div class="ch-list" id="chatList"></div>
    </div>`;
  }
  function convoHTML() {
    const l = L();
    return `<div class="ch-wrap">
      <div class="ch-header"><button class="ch-back" id="chatConvoBack" title="${l.backChat}">←</button>
        <div class="ch-title" id="chatConvoName" style="font-size:15px">—</div><div class="ch-sub" id="chatConvoSub"></div></div>
      <div class="ch-convo-actions" id="chatConvoActions"></div>
      <div class="ch-msgs" id="chatMsgs"></div>
      <div class="ch-note" id="chatConvoNote"></div>
      <div class="ch-input-bar">
        <input class="ch-input" id="chatInput" placeholder="${l.msgPh}" />
        <button class="ch-send" id="chatSendBtn">${l.send}</button>
      </div>
    </div>`;
  }
  function addHTML() {
    const l = L();
    return `<div class="ch-wrap">
      <div class="ch-header"><button class="ch-back" id="chatAddBack" title="${l.backChat}">←</button>
        <div class="ch-title" style="font-size:16px">${l.addTitle}</div></div>
      <div class="ch-form">
        <div class="ch-field"><label class="ch-label">${l.fRemark}</label><input class="ch-tf" id="afRemark" maxlength="20" /></div>
        <div class="ch-field"><label class="ch-label">${l.fDoge}</label><input class="ch-tf" id="afDoge" placeholder="name.doge" maxlength="20" /></div>
        <div class="ch-field"><label class="ch-label">${l.fAddr}</label><input class="ch-tf" id="afAddr" placeholder="D..." /></div>
        <button class="ch-primary" id="chatSaveFriend">${l.save}</button>
      </div>
    </div>`;
  }

  /* ===================== 逻辑 ===================== */
  let curCid = null;

  async function openHome() {
    go('page-chat');
    await renderProfile();
    await renderList();
  }
  function backToWallet() { if (window.showPage) showPage('page-wallet'); const h = $('mainHeader'); if (h) h.style.display = 'flex'; }

  async function renderProfile() {
    const l = L(); const addr = myAddr();
    const self = await getLS('doge_ns_self', ''); // 名字由 .doge 应用维护,Chat 只读
    const nameEl = $('chatName'); const idEl = $('chatMyId'); const addrEl = $('chatMyAddr'); const avEl = $('chatMyAvatar');
    if (!addr) { nameEl.textContent = l.noWallet; nameEl.className = 'ch-name unset'; idEl.textContent = '—'; addrEl.textContent = '—'; return; }
    const id = deriveId(addr);
    if (self) { nameEl.innerHTML = `${self}.doge <span class="edit">→</span>`; nameEl.className = 'ch-name'; }
    else { nameEl.textContent = l.setName; nameEl.className = 'ch-name unset'; }
    idEl.textContent = id;
    addrEl.textContent = addr;
    avEl.textContent = avatarFor(id);
  }

  function editName() {
    // 取名归 .doge 应用,这里点名字直接跳过去
    if (window.openDogeNs) window.openDogeNs();
    else toast(L().setName);
  }

  async function renderList() {
    const l = L(); const list = await getContacts(); const box = $('chatList');
    const all = await getLS(K_MSGS, {});
    box.innerHTML = list.map(c => {
      const msgs = all[c.id] || []; const last = msgs.length ? msgs[msgs.length - 1].text : (c.builtin ? 'wow~ 🐕' : (c.dogeName ? c.dogeName + '.doge' : c.id));
      return `<div class="ch-item" data-cid="${c.id}">
        <div class="av">${avatarFor(c.id)}</div>
        <div class="mid"><div class="nm">${esc(contactName(c))}</div><div class="pv">${esc(last)}</div></div>
      </div>`;
    }).join('');
    box.querySelectorAll('.ch-item').forEach(el => el.addEventListener('click', () => openConvo(el.dataset.cid)));
  }

  async function openConvo(cid) {
    const l = L(); curCid = cid;
    const list = await getContacts(); const c = list.find(x => x.id === cid); if (!c) return;
    go('page-chat-convo');
    $('chatConvoName').textContent = contactName(c);
    $('chatConvoSub').textContent = c.builtin ? 'demo bot' : (c.dogeName ? c.dogeName + '.doge' : 'ID ' + c.id);
    // 操作按钮(非内置好友:转账/复制地址)
    const act = $('chatConvoActions');
    if (c.builtin || !c.address || c.address === 'demo') act.innerHTML = '';
    else act.innerHTML = `<button class="ch-mini" id="chatTransfer">📤 ${l.transfer}</button><button class="ch-mini" id="chatCopyAddr">📋 ${l.copyAddr}</button>`;
    if ($('chatTransfer')) $('chatTransfer').addEventListener('click', () => transferTo(c));
    if ($('chatCopyAddr')) $('chatCopyAddr').addEventListener('click', () => copyText(c.address));
    $('chatConvoNote').textContent = c.builtin ? '' : l.localNote;
    await renderMsgs(cid);
  }

  async function renderMsgs(cid) {
    const msgs = await getMsgs(cid); const box = $('chatMsgs');
    box.innerHTML = msgs.map(m => `<div class="ch-bubble ${m.me ? 'me' : 'them'}">${esc(m.text)}</div>`).join('');
    box.scrollTop = box.scrollHeight;
  }

  async function sendCurrent() {
    if (!curCid) return;
    const inp = $('chatInput'); const text = (inp.value || '').trim(); if (!text) return;
    inp.value = '';
    await pushMsg(curCid, { me: true, text, t: dnow() });
    await renderMsgs(curCid);
    if (curCid === BOT_ID) {
      const r = L().botReplies; const reply = r[Math.floor(Math.random() * r.length)];
      setTimeout(async () => { await pushMsg(BOT_ID, { me: false, text: reply, t: dnow() }); if (curCid === BOT_ID) await renderMsgs(BOT_ID); }, 650);
    }
  }

  function transferTo(c) {
    if (window.showPage) { showPage('page-send'); const h = $('mainHeader'); if (h) h.style.display = 'flex'; }
    const to = document.getElementById('sendTo'); if (to) { to.value = c.address; to.dispatchEvent(new Event('input')); }
  }
  async function copyText(t) { try { await navigator.clipboard.writeText(t); toast(L().copyOk); } catch (e) { toast(t); } }

  async function saveFriend() {
    const l = L();
    const remark = ($('afRemark').value || '').trim();
    let dogeName = ($('afDoge').value || '').trim().toLowerCase().replace(/\.doge$/, '');
    const address = ($('afAddr').value || '').trim();
    if (!remark) { toast(l.needRemark, true); return; }
    if (!address) { toast(l.needAddr, true); return; }
    const list = await getLS(K_CONTACTS, []);
    list.push({ id: deriveId(address) || ('c' + dnow()), remark, dogeName, address });
    await setLS(K_CONTACTS, list);
    $('afRemark').value = ''; $('afDoge').value = ''; $('afAddr').value = '';
    toast(l.saved);
    openHome();
  }

  /* ===================== 工具 ===================== */
  function esc(s) { return String(s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m])); }
  let _seq = 0; function dnow() { return ++_seq; } // 避免 Date.now 依赖,仅用于顺序/key

  function applyLang() {
    const l = L();
    const set = (sel, txt) => { const e = document.querySelector(sel); if (e) e.textContent = txt; };
    set('#chatNavLabel', l.action);
    set('#slotAppsTitle', l.appsTitle);
    if ($('page-chat') && document.querySelector('#page-chat.active')) openHome();
  }

  function init() {
    injectCSS(); injectPages(); injectButton();
    const lb = $('langBtn'); if (lb) lb.addEventListener('click', () => setTimeout(applyLang, 0));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
