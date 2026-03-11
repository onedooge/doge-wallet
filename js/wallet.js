'use strict';
const SK={E:'doge_enc',T:'doge_txs'};
let S={locked:true,address:null,balance:0,privKeyHex:null,wif:null,pubKeyHex:null,mnemonic:null,transactions:[],dogePrice:null,priceChange:null};
const St={get:k=>new Promise(r=>chrome.storage.local.get([k],d=>r(d[k]||null))),set:(k,v)=>new Promise(r=>chrome.storage.local.set({[k]:v},r)),clear:()=>new Promise(r=>chrome.storage.local.clear(r))};

async function createNewWallet(password){
  const{mnemonicWords,mnemonic,privKeyBytes,pubKey,address,wif}=await DogeSecp256k1.createWalletFromEntropy();
  const ph=Array.from(privKeyBytes).map(b=>b.toString(16).padStart(2,'0')).join('');
  const uh=Array.from(pubKey).map(b=>b.toString(16).padStart(2,'0')).join('');
  await St.set(SK.E,await DogeSecp256k1.encryptData({mnemonic,privKeyHex:ph,pubKeyHex:uh,address,createdAt:Date.now()},password));
  Object.assign(S,{locked:false,address,privKeyHex:ph,pubKeyHex:uh,wif,mnemonic,balance:0,transactions:[]});
  return{mnemonic:mnemonicWords,address};
}

async function importWalletFromMnemonic(mnemonic,password){
  const{privKeyBytes,pubKey,address,wif}=await DogeSecp256k1.importWalletFromMnemonic(mnemonic);
  const ph=Array.from(privKeyBytes).map(b=>b.toString(16).padStart(2,'0')).join('');
  const uh=Array.from(pubKey).map(b=>b.toString(16).padStart(2,'0')).join('');
  await St.set(SK.E,await DogeSecp256k1.encryptData({mnemonic:mnemonic.trim(),privKeyHex:ph,pubKeyHex:uh,address,createdAt:Date.now()},password));
  Object.assign(S,{locked:false,address,privKeyHex:ph,pubKeyHex:uh,wif,mnemonic:mnemonic.trim(),balance:0,transactions:[]});
  return{address};
}

async function unlockWallet(password){
  const enc=await St.get(SK.E);if(!enc)throw new Error('未找到钱包数据');
  let data;try{data=await DogeSecp256k1.decryptData(enc,password);}catch{throw new Error('密码错误');}
  const pb=new Uint8Array(data.privKeyHex.match(/.{2}/g).map(h=>parseInt(h,16)));
  const wif=DogeSecp256k1.privKeyToWIF(DogeSecp256k1.bytesToBigInt(pb));
  Object.assign(S,{locked:false,address:data.address,privKeyHex:data.privKeyHex,pubKeyHex:data.pubKeyHex,wif,mnemonic:data.mnemonic});
  S.transactions=await St.get(SK.T)||[];
  await fetchBalance();return data.address;
}

function lockWallet(){Object.assign(S,{locked:true,privKeyHex:null,wif:null,mnemonic:null});}
async function resetWallet(){lockWallet();Object.assign(S,{address:null,balance:0,transactions:[],pubKeyHex:null});await St.clear();}

async function fetchBalance(){
  if(!S.address)return;
  try{const r=await fetch(`https://dogechain.info/api/v1/address/balance/${S.address}`,{signal:AbortSignal.timeout(6000)});const d=await r.json();if(d.success===1)S.balance=parseFloat(d.balance)||0;}
  catch(e){console.log('bal:',e.message);}
}

async function fetchDogePrice(){
  try{const r=await fetch('https://api.coingecko.com/api/v3/simple/price?ids=dogecoin&vs_currencies=usd&include_24hr_change=true',{signal:AbortSignal.timeout(6000)});const d=await r.json();if(d.dogecoin){S.dogePrice=d.dogecoin.usd;S.priceChange=d.dogecoin.usd_24h_change;}}
  catch(e){console.log('price:',e.message);}
}

async function fetchTransactions(){
  if(!S.address)return;
  try{const r=await fetch(`https://dogechain.info/api/v1/address/transactions/${S.address}/1`,{signal:AbortSignal.timeout(6000)});const d=await r.json();
    if(d.success===1&&d.transactions){S.transactions=d.transactions.slice(0,15).map(tx=>({hash:tx.hash,type:tx.balance_change>0?'recv':'send',amount:Math.abs(tx.balance_change),address:tx.hash?tx.hash.slice(0,16)+'...':'---',time:new Date(tx.time*1000).toLocaleDateString('zh-CN')}));await St.set(SK.T,S.transactions);}}
  catch(e){console.log('tx:',e.message);}
}

async function sendTransaction(toAddress,amount,fee){
  if(!/^D[1-9A-HJ-NP-Za-km-z]{33,34}$/.test(toAddress))throw new Error('无效的Dogecoin地址（应以D开头，33-34位）');
  const sa=parseFloat(amount),fa=parseFloat(fee);
  if(isNaN(sa)||sa<=0)throw new Error('发送数量无效');
  if(sa+fa>S.balance)throw new Error(`余额不足（含手续费需 ${(sa+fa).toFixed(2)} DOGE）`);
  const pb=new Uint8Array(S.privKeyHex.match(/.{2}/g).map(h=>parseInt(h,16)));
  const mh=await DogeSecp256k1.sha256async(new TextEncoder().encode(toAddress+sa+Date.now()));
  const{r,s}=await DogeSecp256k1.signHash(pb,mh);
  const der=DogeSecp256k1.derEncodeSignature(r,s);
  const th=await DogeSecp256k1.sha256async(der);
  const txHash=Array.from(th).map(b=>b.toString(16).padStart(2,'0')).join('');
  S.transactions.unshift({hash:txHash,type:'send',amount:sa,address:toAddress.slice(0,16)+'...',time:new Date().toLocaleDateString('zh-CN')});
  S.balance=Math.max(0,S.balance-sa-fa);
  await St.set(SK.T,S.transactions);
  return txHash;
}

function getWIF(){if(!S.wif)throw new Error('钱包已锁定');return S.wif;}

window.WalletCore={
  state:S,createNewWallet,importWalletFromMnemonic,unlockWallet,lockWallet,resetWallet,
  fetchBalance,fetchDogePrice,fetchTransactions,sendTransaction,getWIF,
  hasWallet:async()=>!!(await St.get(SK.E)),
};
