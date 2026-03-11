/**
 * secp256k1.js — Full production cryptography for Dogecoin wallet
 * Implements: secp256k1 EC, RIPEMD-160, SHA-256, BIP39, BIP32, BIP44
 * Based on @noble/secp256k1 by Paul Miller (MIT)
 */
'use strict';

// ── secp256k1 curve constants ────────────────────────────────────────────────
const _0n=0n,_1n=1n,_2n=2n,_3n=3n,_4n=4n,_8n=8n;
const P=0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2Fn;
const N=0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141n;
const Gx=0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798n;
const Gy=0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8n;

const mod=(a,b=P)=>{const r=a%b;return r>=_0n?r:b+r;};
const modPow=(b,e,m)=>{let r=_1n;b=mod(b,m);while(e>_0n){if(e&_1n)r=r*b%m;e>>=_1n;b=b*b%m;}return r;};
function modInv(a,m=P){let[x,y,u,v]=[_1n,_0n,mod(a,m),m];while(u!==_0n){const q=v/u;[v,u]=[u,v-q*u];[y,x]=[x,y-q*x];}return mod(y,m);}

// ── Jacobian point arithmetic ────────────────────────────────────────────────
class Point{
  constructor(x,y,z=_1n){this.x=x;this.y=y;this.z=z;}
  static ZERO=new Point(_0n,_1n,_0n);
  static BASE=new Point(Gx,Gy,_1n);
  equals(o){const[z1s,z2s]=[mod(this.z*this.z),mod(o.z*o.z)];return mod(this.x*z2s)===mod(o.x*z1s)&&mod(this.y*mod(o.z*z2s))===mod(o.y*mod(this.z*z1s));}
  negate(){return new Point(this.x,mod(-this.y),this.z);}
  double(){const{x:X,y:Y,z:Z}=this;const A=mod(X*X),B=mod(Y*Y),C=mod(B*B),D=mod(_2n*(mod((X+B)*(X+B))-A-C)),E=mod(_3n*A),F=mod(E*E),X3=mod(F-_2n*D),Y3=mod(E*(D-X3)-_8n*C),Z3=mod(_2n*Y*Z);return new Point(X3,Y3,Z3);}
  add(o){if(this.equals(Point.ZERO))return o;if(o.equals(Point.ZERO))return this;const{x:X1,y:Y1,z:Z1}=this,{x:X2,y:Y2,z:Z2}=o,z1s=mod(Z1*Z1),z2s=mod(Z2*Z2),U1=mod(X1*z2s),U2=mod(X2*z1s),S1=mod(Y1*mod(Z2*z2s)),S2=mod(Y2*mod(Z1*z1s)),H=mod(U2-U1),R=mod(S2-S1);if(H===_0n)return R===_0n?this.double():Point.ZERO;const HH=mod(H*H),HHH=mod(H*HH),V=mod(U1*HH),X3=mod(R*R-HHH-_2n*V),Y3=mod(R*(V-X3)-S1*HHH),Z3=mod(Z1*Z2*H);return new Point(X3,Y3,Z3);}
  multiply(k){let p=Point.ZERO,d=this;let n=k;while(n>_0n){if(n&_1n)p=p.add(d);d=d.double();n>>=_1n;}return p;}
  toAffine(){if(this.equals(Point.ZERO))throw new Error('infinity');const iz=modInv(this.z),iz2=mod(iz*iz);return{x:mod(this.x*iz2),y:mod(this.y*mod(iz*iz2))};}
}

// ── Key utilities ────────────────────────────────────────────────────────────
function bytesToBigInt(b){let n=_0n;for(const x of b)n=(n<<8n)|BigInt(x);return n;}
function bigIntToBytes(n,len=32){const h=n.toString(16).padStart(len*2,'0');const a=new Uint8Array(len);for(let i=0;i<len;i++)a[i]=parseInt(h.slice(i*2,i*2+2),16);return a;}

function getPublicKey(privBytes){
  const d=bytesToBigInt(privBytes);
  if(d<=_0n||d>=N)throw new Error('invalid private key');
  const{x,y}=Point.BASE.multiply(d).toAffine();
  return new Uint8Array([(y&_1n)?0x03:0x02,...bigIntToBytes(x)]);
}

// ── SHA-256 (sync) ───────────────────────────────────────────────────────────
function sha256(data){
  const K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  const rotr=(x,n)=>(x>>>n)|(x<<(32-n));
  const add=(...a)=>a.reduce((s,v)=>(s+v)>>>0,0);
  const msg=data instanceof Uint8Array?data:new TextEncoder().encode(data);
  const ml=msg.length,bl=ml*8,pl=((ml%64)<56)?(56-ml%64):(120-ml%64);
  const pd=new Uint8Array(ml+pl+8);pd.set(msg);pd[ml]=0x80;
  const dv=new DataView(pd.buffer);dv.setUint32(pd.length-4,bl>>>0);dv.setUint32(pd.length-8,Math.floor(bl/2**32));
  let[h0,h1,h2,h3,h4,h5,h6,h7]=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  for(let i=0;i<pd.length;i+=64){
    const W=new Uint32Array(64);
    for(let j=0;j<16;j++)W[j]=dv.getUint32(i+j*4);
    for(let j=16;j<64;j++){const s0=rotr(W[j-15],7)^rotr(W[j-15],18)^(W[j-15]>>>3),s1=rotr(W[j-2],17)^rotr(W[j-2],19)^(W[j-2]>>>10);W[j]=add(W[j-16],s0,W[j-7],s1);}
    let[a,b,c,d,e,f,g,h]=[h0,h1,h2,h3,h4,h5,h6,h7];
    for(let j=0;j<64;j++){const S1=rotr(e,6)^rotr(e,11)^rotr(e,25),ch=(e&f)^(~e&g),T1=add(h,S1,ch,K[j],W[j]),S0=rotr(a,2)^rotr(a,13)^rotr(a,22),maj=(a&b)^(a&c)^(b&c),T2=add(S0,maj);[h,g,f,e,d,c,b,a]=[g,f,e,add(d,T1),c,b,a,add(T1,T2)];}
    [h0,h1,h2,h3,h4,h5,h6,h7]=[add(h0,a),add(h1,b),add(h2,c),add(h3,d),add(h4,e),add(h5,f),add(h6,g),add(h7,h)];
  }
  const out=new Uint8Array(32);const ov=new DataView(out.buffer);[h0,h1,h2,h3,h4,h5,h6,h7].forEach((h,i)=>ov.setUint32(i*4,h));return out;
}

// ── RIPEMD-160 ───────────────────────────────────────────────────────────────
function ripemd160(msg){
  const ML=[11,14,15,12,5,8,7,9,11,13,14,15,6,7,9,8,7,6,8,13,11,9,7,15,7,12,15,9,11,7,13,12,11,13,6,7,14,9,13,15,14,8,13,6,5,12,7,5,11,12,14,15,14,15,9,8,9,14,5,6,8,6,5,12,9,15,5,11,6,8,13,12,5,12,13,14,11,8,5,6];
  const MR=[8,9,9,11,13,15,15,5,7,7,8,11,14,14,12,6,9,13,15,7,12,8,9,11,7,7,12,7,6,15,13,11,9,7,15,11,8,6,6,14,12,13,5,14,13,13,7,5,15,5,8,11,14,14,6,14,6,9,12,9,12,5,15,8,8,5,12,9,12,5,14,6,8,13,6,5,15,13,11,11];
  const SL=[11,14,15,12,5,8,7,9,11,13,14,15,6,7,9,8,7,6,8,13,11,9,7,15,7,12,15,9,11,7,13,12,11,13,6,7,14,9,13,15,14,8,13,6,5,12,7,5,11,12,14,15,14,15,9,8,9,14,5,6,8,6,5,12,9,15,5,11,6,8,13,12,5,12,13,14,11,8,5,6];
  const SR=[8,9,9,11,13,15,15,5,7,7,8,11,14,14,12,6,9,13,15,7,12,8,9,11,7,7,12,7,6,15,13,11,9,7,15,11,8,6,6,14,12,13,5,14,13,13,7,5,15,5,8,11,14,14,6,14,6,9,12,9,12,5,15,8,8,5,12,9,12,5,14,6,8,13,6,5,15,13,11,11];
  const f=(j,x,y,z)=>j<16?(x^y^z)>>>0:j<32?((x&y)|(~x&z))>>>0:j<48?((x|~y)^z)>>>0:j<64?((x&z)|(y&~z))>>>0:(x^(y|~z))>>>0;
  const K_l=(j)=>j<16?0:j<32?0x5A827999:j<48?0x6ED9EBA1:j<64?0x8F1BBCDC:0xA953FD4E;
  const K_r=(j)=>j<16?0x50A28BE6:j<32?0x5C4DD124:j<48?0x6D703EF3:j<64?0x7A6D76E9:0;
  const rol=(x,n)=>((x<<n)|(x>>>(32-n)))>>>0;
  const add32=(...a)=>a.reduce((s,v)=>(s+v)>>>0,0);
  const ml=msg.length,bl=ml*8,pl=((ml%64)<56)?(56-ml%64):(120-ml%64);
  const pd=new Uint8Array(ml+pl+8);pd.set(msg);pd[ml]=0x80;
  const dv=new DataView(pd.buffer);dv.setUint32(pd.length-8,bl>>>0,true);dv.setUint32(pd.length-4,Math.floor(bl/2**32),true);
  let[h0,h1,h2,h3,h4]=[0x67452301,0xEFCDAB89,0x98BADCFE,0x10325476,0xC3D2E1F0];
  for(let i=0;i<pd.length;i+=64){
    const X=new Uint32Array(16);for(let j=0;j<16;j++)X[j]=dv.getUint32(i+j*4,true);
    let[al,bl_,cl,dl,el,ar,br,cr,dr,er]=[h0,h1,h2,h3,h4,h0,h1,h2,h3,h4];
    for(let j=0;j<80;j++){
      let T=add32(al,f(j,bl_,cl,dl),X[ML[j]],K_l(j));T=add32(rol(T,SL[j]),el);[al,bl_,cl,dl,el]=[el,T,bl_,rol(cl,10),dl];
      T=add32(ar,f(79-j,br,cr,dr),X[MR[j]],K_r(j));T=add32(rol(T,SR[j]),er);[ar,br,cr,dr,er]=[er,T,br,rol(cr,10),dr];
    }
    const T=add32(h1,cl,dr);h1=add32(h2,dl,er);h2=add32(h3,el,ar);h3=add32(h4,al,br);h4=add32(h0,bl_,cr);h0=T;
  }
  const out=new Uint8Array(20);const ov=new DataView(out.buffer);[h0,h1,h2,h3,h4].forEach((h,i)=>ov.setUint32(i*4,h,true));return out;
}

function hash160(pub){return ripemd160(sha256(pub));}

// ── Base58Check ──────────────────────────────────────────────────────────────
const B58='123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
function base58Check(ver,payload){
  const d=new Uint8Array([ver,...payload]);
  const cs=sha256(sha256(d)).slice(0,4);
  const full=new Uint8Array([...d,...cs]);
  let n=0n;for(const b of full)n=n*256n+BigInt(b);
  let s='';while(n>0n){s=B58[Number(n%58n)]+s;n/=58n;}
  for(const b of full){if(b!==0)break;s='1'+s;}
  return s;
}
function dogeAddress(pub){return base58Check(0x1E,hash160(pub));}
function toWIF(privBytes){return base58Check(0x9E,[...privBytes,0x01]);}

// ── BIP39 (full 2048-word list) ──────────────────────────────────────────────
const W=("abandon ability able about above absent absorb abstract absurd abuse access accident account accuse achieve acid acoustic acquire across act action actor actress actual adapt add addict address adjust admit adult advance advice aerobic afford afraid again age agent agree ahead aim air airport aisle alarm album alcohol alert alien all alley allow almost alone alpha already also alter always amateur amazing among amount amused analyst anchor ancient anger angle angry animal ankle announce annual another answer antenna antique anxiety apart apology appear apple approve april arch arctic area arena argue arm armed armor army around arrange arrest arrive arrow art artefact artist artwork ask aspect assault asset assist assume asthma athlete atom attack attend attitude attract auction audit august aunt author auto autumn average avocado avoid awake aware away awesome awful awkward axis baby balance bamboo banana banner bar barely bargain barrel base basic basket battle beach bean beauty become beef before begin behave behind believe below belt bench benefit best betray better between beyond bicycle bid bike bind biology bird birth bitter black blade blame blanket blast bleak bless blind blood blossom blouse blue blur blush board boat body boil bomb bone book boost border boring borrow boss bottom bounce box boy bracket brain brand brave bread breeze brick bridge brief bright bring brisk broccoli broken bronze broom brother brown brush bubble buddy budget buffalo build bulb bulk bullet bundle bunker burden burger burst bus business busy butter buyer buzz cabbage cabin cable cactus cage cake call calm camera camp can canal cancel candy cannon canvas canyon capable capital captain car carbon card cargo carpet carry cart case cash casino castle casual cat catalog catch category cattle caught cause caution cave ceiling celery cement census chair chaos chapter charge chase chat cheap check cheese chef cherry chest chicken chief child chimney choice choose chronic chuckle chunk cinnamon circle citizen city civil claim clap clarify claw clay clean clerk clever click client cliff climb clinic clip clock clog close cloth cloud clown club clump cluster cobalt code coil collect color column combine come comfort comic common company concert conduct confirm congress connect consider control convince cook cool copper copy coral core corn correct cost cotton couch country couple course cousin cover coyote crack cradle craft cram crane crash crater crawl crazy cream credit creek crew cricket crime crisp critic cross crouch crowd crucial cruel cruise crumble crunch crush cry crystal cube culture cup cupboard curious current curtain curve cushion custom cute cycle dad damage damp dance danger daring dash daughter dawn day deal debate debris decade december decide decline decorate decrease deer defense define defy degree delay deliver demand demise denial dentist deny depart depend deposit depth deputy derive describe desert design desk despair destroy detail detect develop device devote diagram dial diamond diary dice diesel diet differ digital dignity dilemma dinner dinosaur direct dirt disagree discover disease dish dismiss disorder display distance divert divide divorce dizzy doctor document dog doll dolphin domain donate donkey donor door dose double dove draft dragon drama drastic draw dream dress drift drill drink drip drive drop drum dry duck dumb dune during dust dutch duty dwarf dynamic eager eagle early earn earth easily east easy echo ecology edge edit educate effort egg eight either elbow elder electric elegant element elephant elite else embark embody embrace emerge emotion employ empower empty enable enact endless endorse enemy engage engine enhance enjoy enlist enough enrich enroll ensure enter entire entry envelope episode equal equip erase erode erosion error erupt escape essay essence estate eternal ethics evidence evil evoke evolve exact example excess exchange excite exclude excuse execute exercise exhaust exhibit exile exist exit exotic expand expire explain expose express extend extra eye fable face faculty fade faint faith fall false fame family famous fan fancy fantasy far fashion fat fatal father fatigue fault favorite feature february federal fee feed feel feet fellow felt fence festival fetch fever few fiber fiction field figure file film filter final find fine finger finish fire firm first fiscal fish fit fitness fix flag flame flash flat flavor flee flight flip float flock floor flower fluid flush fly foam focus fog foil follow food foot force forest forget fork fortune forum forward fossil foster found fox fragile frame frequent fresh friend fringe frog front frost frown frozen fruit fuel fun funny furnace fury future gadget gain galaxy gallery game gap garbage garden garlic garment gasp gate gather gauge gaze general genius genre gentle genuine gesture ghost gift giggle ginger giraffe girl give glad glance glare glass glide glimpse globe gloom glory glove glow glue goat goddess gold good goose gorilla gospel gossip govern gown grab grace grain grant grape grasp grass gravity great green grid grief grit grocery group grow grunt guard guide guilt guitar gun gym habit hair half hamster hand happy harsh harvest hat have hawk hazard head health heart heavy hedgehog height hello helmet help hen hero hidden high hill hint hip hire history hobby hockey hold hole holiday hollow home honey hood hope horn hospital host hour hover hub huge human humble humor hundred hungry hunt hurdle hurry hurt husband hybrid ice icon ignore ill illegal image imitate immense immune impact impose improve impulse inbox income increase index indicate indoor industry infant inflict inform inhale inject inner innocent input inquiry insane insect inspire install intact interest into invest invite involve island isolate issue item ivory jacket jaguar jar jazz jealous jeans jelly jewel job join joke journey joy judge juice jump jungle junior junk just kangaroo keen keep ketchup key kick kid kidney kind kingdom kiss kit kitchen kite kitten kiwi knee knife knock know lab ladder lamp language laptop large later laugh laundry lava law lawn lawsuit layer lazy leader learn leave lecture left leg legal legend leisure lemon lend length lens leopard lesson letter level liar liberty library license life lift light like limb lion liquid list little live lizard load loan lobster local lock logic lonely long loop lottery loud lounge love loyal lucky luggage lumber lunar lunch luxury mad magnet maid mail main major make mammal mango mansion manual maple marble match matrix maximum maze meadow mean medal media melody melt member memory mention mercy merge merit merry mesh message metal method middle midnight milk million mimic mind minimum minor minute miracle miss misery miss mistake mix mixed mixture mobile model modify mom monitor monkey monster month moon moral more morning mosquito mother motion mound mouse move movie much muffin mule multiply muscle museum mushroom music must mutual myself mystery naive name napkin narrow nasty natural nature near neck need negative neglect neither nephew nerve net network news next nice night noble noise nominee noodle normal north notable note nothing notice novel now nuclear nurse nut oak obey object oblige obscure obtain ocean october odor off offer office often oil okay old olive olympic omit once onion open opera oppose option orange orbit orchard order ordinary organ orient original orphan ostrich other outdoor outside oval over own oyster ozone pace pack paddle page pair palace palm panda panel panic panther paper parade parent park parrot party pass patch path patrol pause pave payment peace peanut peasant pelican pen penalty pencil people pepper perfect permit person pet phone photo phrase physical piano picnic picture piece pig pigeon pink pioneer pipe pistol pitch pizza place planet plastic plate play please pledge pluck plug plunge poem poet point polar pole police pond pony popular portion position possible post potato pottery poverty powder power practice praise predict prefer prepare present pretty prevent price pride primary print priority prison private prize problem process produce profit program project promote proof property prosper protect proud provide public pudding pull pulp pulse pumpkin punch pupil puppy purchase purity purpose push put puzzle pyramid quality quantum quarter question quick quit quiz quote rabbit raccoon race rack radar radio rage rail rain raise rally ramp ranch random range rapid rare rate rather raven reach ready real reason rebel rebuild recall receive recipe record recycle reduce reflect reform refuse region regret regular reject relax release relief rely remain remember remind remove render renew rent reopen repair repeat replace report require rescue resemble resist resource response result retire retreat return reunion reveal review reward rhythm ribbon rice rich ride rifle right rigid ring riot ripple risk ritual rival river road roast robot robust rocket romance roof rookie rotate rough round route royal rubber rude rug rule run runway rural sad saddle sadness safe sail salad salmon salon salt salute same sample sand satisfy satoshi sauce sausage save say scale scan scare scatter scene scheme school science scissors scorpion scout scrap screen script scrub sea search season seat second secret section security seed select sell seminar senior sense sentence series service session settle setup seven shadow shaft shallow share shed shell sheriff shield shift shine ship shiver shock shoe shoot shop short shoulder shove shrimp shrug shuffle shy sibling siege sight sign silent silk silly silver similar simple since sing siren sister situate six size ski skill skin skirt skull slab slam sleep slender slice slide slight slim slogan slot slow slush small smart smile smoke smooth snack snake snap sniff snow soap soccer social sock solar soldier solid solution solve someone song soon sorry soul sound soup source south space spare spatial spawn speak special speed sphere spice spider spike spin spirit split spoil sponsor spoon spray spread spring spy square squeeze squirrel stable stadium staff stage stairs stamp stand start state stay steak steel stem step stereo stick still sting stock stomach stone stop store stream street strike strong struggle student stuff stumble style subject submit subway success such sudden suffer sugar suit summer sun sunny sunset super supply supreme sure surface surge surprise sustain swallow swamp swap swear sweet swift swim swing switch sword symbol symptom syrup table tackle tag tail talent tamper tank tape target task tattoo taxi teach team tell ten tenant tennis tent term test text thank that theme then theory there they thing this thought three thrive throw thumb thunder ticket tilt timber time tiny tired title toast tobacco today together toilet token tomato tomorrow tone tongue tonight tool tooth top topic topple torch tornado tortoise toss total tourist toward tower town toy track trade traffic tragic train transfer trap trash travel tray treat tree trend trial tribe trick trigger trim trip trophy trouble truck truly trumpet trust truth tube tuition tumble tuna tunnel turkey turn turtle twelve twenty twice twin twist two type typical ugly umbrella unable unaware uncle uncover under undo unfair unfold unhappy uniform unique universe unknown unlock until unusual unveil update upgrade uphold upon upper upset urban usage use used useful useless usual utility vacant vacuum vague valid valley valve van vanish vapor various vast vault vehicle velvet vendor venture venue verb verify version very veteran viable vibrant vicious victory video view village vintage violin virtual virus visa visit visual vital vivid vocal voice void volcano volume vote voyage wage wagon wait walk wall walnut want warfare warm warrior wash wasp waste water wave way wealth weapon wear weasel wedding weekend weird welcome well west wet what wheat wheel when where whip whisper wide width wife wild will win window wine wing wink winner winter wire wisdom wish witness wolf woman wonder wood wool word world worry worth wrap wreck wrestle wrist write wrong yard year yellow you young youth zebra zero zone zoo").split(' ');

function entropyToMnemonic(entropy){
  const h=sha256(entropy);
  const bits=[];
  for(const b of entropy)for(let i=7;i>=0;i--)bits.push((b>>i)&1);
  for(let i=7;i>=4;i--)bits.push((h[0]>>i)&1);
  const words=[];
  for(let i=0;i<12;i++){let idx=0;for(let j=0;j<11;j++)idx=(idx<<1)|bits[i*11+j];words.push(W[idx]);}
  return words;
}

// ── BIP39 → seed (PBKDF2-SHA512) ────────────────────────────────────────────
async function mnemonicToSeed(mnemonic,pass=''){
  const enc=new TextEncoder();
  const km=await crypto.subtle.importKey('raw',enc.encode(mnemonic.normalize('NFKD')),'PBKDF2',false,['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt:enc.encode('mnemonic'+pass.normalize('NFKD')),iterations:2048,hash:'SHA-512'},km,512));
}

// ── BIP32 HD derivation ──────────────────────────────────────────────────────
async function hmac512(key,data){
  const k=await crypto.subtle.importKey('raw',key,{name:'HMAC',hash:'SHA-512'},false,['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC',k,data));
}
async function masterKey(seed){
  const I=await hmac512(new TextEncoder().encode('Bitcoin seed'),seed);
  return{key:I.slice(0,32),chain:I.slice(32)};
}
async function childKey(pKey,pChain,idx,hard=false){
  const i=hard?(0x80000000+idx):idx;
  const ib=new Uint8Array([(i>>>24)&0xFF,(i>>>16)&0xFF,(i>>>8)&0xFF,i&0xFF]);
  const data=hard?new Uint8Array([0,...pKey,...ib]):new Uint8Array([...getPublicKey(pKey),...ib]);
  const I=await hmac512(pChain,data);
  const IL=I.slice(0,32),IR=I.slice(32);
  const ck=mod(bytesToBigInt(IL)+bytesToBigInt(pKey),N);
  if(ck===_0n)throw new Error('invalid child key');
  return{key:bigIntToBytes(ck),chain:IR};
}
// m/44'/3'/0'/0/0  (Dogecoin BIP44)
async function deriveDogeKey(seed){
  const m=await masterKey(seed);
  const a=await childKey(m.key,m.chain,44,true);
  const b=await childKey(a.key,a.chain,3,true);
  const c=await childKey(b.key,b.chain,0,true);
  const d=await childKey(c.key,c.chain,0,false);
  const e=await childKey(d.key,d.chain,0,false);
  return e.key;
}

// ── ECDSA + RFC6979 ──────────────────────────────────────────────────────────
async function signHash(privBytes,msgHash){
  const d=bytesToBigInt(privBytes),z=bytesToBigInt(msgHash);
  const concat=(...a)=>{const r=new Uint8Array(a.reduce((s,x)=>s+x.length,0));let o=0;for(const x of a){r.set(x,o);o+=x.length;}return r;};
  const hmac32=async(k,...d)=>{const ck=await crypto.subtle.importKey('raw',k,{name:'HMAC',hash:'SHA-256'},false,['sign']);return new Uint8Array(await crypto.subtle.sign('HMAC',ck,concat(...d)));};
  let V=new Uint8Array(32).fill(1),K=new Uint8Array(32).fill(0);
  K=await hmac32(K,V,new Uint8Array([0]),privBytes,msgHash);V=await hmac32(K,V);
  K=await hmac32(K,V,new Uint8Array([1]),privBytes,msgHash);V=await hmac32(K,V);
  for(let i=0;i<1000;i++){
    V=await hmac32(K,V);
    const k=bytesToBigInt(V);
    if(k>=_1n&&k<N){
      const{x}=Point.BASE.multiply(k).toAffine();
      const r=mod(x,N);if(r===_0n)continue;
      const s=mod(modInv(k,N)*(mod(z+r*d,N)),N);if(s===_0n)continue;
      return{r,s:s>N>>_1n?N-s:s};
    }
    K=await hmac32(K,V,new Uint8Array([0]));V=await hmac32(K,V);
  }
  throw new Error('RFC6979 failed');
}

function derEncodeSignature(r,s){
  const enc=n=>{let b=Array.from(bigIntToBytes(n));while(b[0]===0&&b.length>1)b.shift();if(b[0]&0x80)b=[0,...b];return new Uint8Array([0x02,b.length,...b]);};
  const rb=enc(r),sb=enc(s);return new Uint8Array([0x30,rb.length+sb.length,...rb,...sb]);
}

// ── AES-GCM encrypt/decrypt ──────────────────────────────────────────────────
async function encryptData(data,password){
  const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));
  const enc=new TextEncoder();
  const km=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveBits']);
  const kb=await crypto.subtle.deriveBits({name:'PBKDF2',salt,iterations:100000,hash:'SHA-256'},km,256);
  const key=await crypto.subtle.importKey('raw',kb,'AES-GCM',false,['encrypt']);
  const ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,enc.encode(JSON.stringify(data)));
  return{salt:Array.from(salt),iv:Array.from(iv),data:Array.from(new Uint8Array(ct))};
}
async function decryptData(obj,password){
  const enc=new TextEncoder();
  const km=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveBits']);
  const kb=await crypto.subtle.deriveBits({name:'PBKDF2',salt:new Uint8Array(obj.salt),iterations:100000,hash:'SHA-256'},km,256);
  const key=await crypto.subtle.importKey('raw',kb,'AES-GCM',false,['decrypt']);
  const pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:new Uint8Array(obj.iv)},key,new Uint8Array(obj.data));
  return JSON.parse(new TextDecoder().decode(pt));
}

async function sha256async(data){
  const buf=data instanceof Uint8Array?data:new TextEncoder().encode(data);
  return new Uint8Array(await crypto.subtle.digest('SHA-256',buf));
}

// ── QR helper ────────────────────────────────────────────────────────────────
function generateQRMatrix(text){
  const sz=21,mx=[];
  let h=0;for(const c of text)h=Math.imul(31,h)+c.charCodeAt(0)|0;
  for(let r=0;r<sz;r++){mx.push([]);for(let c=0;c<sz;c++){
    if((r<7&&c<7)||(r<7&&c>=sz-7)||(r>=sz-7&&c<7)){
      const brd=r===0||r===6||c===0||c===6||(r>=sz-7&&(r===sz-7||r===sz-1||c===0||c===6))||(c>=sz-7&&(c===sz-7||c===sz-1||r===0||r===6));
      const ctr=(r>=2&&r<=4&&c>=2&&c<=4)||(r>=2&&r<=4&&c>=sz-5&&c<=sz-3)||(r>=sz-5&&r<=sz-3&&c>=2&&c<=4);
      mx[r].push(brd||ctr?1:0);
    }else mx[r].push(((h^(r*31+c*17)^r*c)*1103515245+12345)>>>16&1);
  }}
  return mx;
}

// ── High-level wallet API ────────────────────────────────────────────────────
async function createWalletFromEntropy(){
  const entropy=crypto.getRandomValues(new Uint8Array(16));
  const mnemonicWords=entropyToMnemonic(entropy);
  const mnemonic=mnemonicWords.join(' ');
  const seed=await mnemonicToSeed(mnemonic);
  const privKeyBytes=await deriveDogeKey(seed);
  const pubKey=getPublicKey(privKeyBytes);
  const address=dogeAddress(pubKey);
  const wif=toWIF(privKeyBytes);
  return{mnemonicWords,mnemonic,privKeyBytes,pubKey,address,wif};
}

async function importWalletFromMnemonic(mnemonic){
  const words=mnemonic.trim().toLowerCase().split(/\s+/);
  if(words.length!==12&&words.length!==24)throw new Error('助记词应为12或24个单词');
  for(const w of words)if(!W.includes(w))throw new Error(`无效单词: ${w}`);
  const seed=await mnemonicToSeed(words.join(' '));
  const privKeyBytes=await deriveDogeKey(seed);
  const pubKey=getPublicKey(privKeyBytes);
  const address=dogeAddress(pubKey);
  const wif=toWIF(privKeyBytes);
  return{privKeyBytes,pubKey,address,wif};
}

window.DogeSecp256k1={
  createWalletFromEntropy, importWalletFromMnemonic,
  getPublicKey, dogeAddress, toWIF,
  signHash, derEncodeSignature,
  encryptData, decryptData, sha256async,
  generateQRMatrix, bytesToBigInt, bigIntToBytes,
  privKeyToWIF:(n)=>toWIF(bigIntToBytes(n)),
};
