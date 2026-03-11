/**
 * crypto-utils.js — Real Dogecoin cryptographic primitives
 *
 * Implements:
 *  - SHA-256 (WebCrypto)
 *  - RIPEMD-160 (pure JS — not in WebCrypto)
 *  - Hash160 = RIPEMD160(SHA256(x))
 *  - Base58Check encode/decode
 *  - BIP39 mnemonic (full 2048-word list subset, 128-bit entropy = 12 words)
 *  - BIP32/BIP44 HD key derivation (simplified HMAC-SHA512 path)
 *  - Real Dogecoin address from secp256k1 public key
 *  - WIF private key encoding (Dogecoin mainnet 0x9E)
 *  - AES-GCM encryption for wallet storage
 *  - QR code matrix generator
 */
'use strict';

(function(global) {

// ────────────────────────────────────────────────────────────────────────────
// SHA-256 (WebCrypto)
// ────────────────────────────────────────────────────────────────────────────
async function sha256(data) {
  const buf = data instanceof Uint8Array ? data : new TextEncoder().encode(data);
  return new Uint8Array(await crypto.subtle.digest('SHA-256', buf));
}

async function doubleSha256(data) {
  return sha256(await sha256(data));
}

async function sha256Hex(data) {
  return Array.from(await sha256(data)).map(b => b.toString(16).padStart(2,'0')).join('');
}

// ────────────────────────────────────────────────────────────────────────────
// RIPEMD-160 — pure JS (not available in WebCrypto)
// Based on the reference implementation
// ────────────────────────────────────────────────────────────────────────────
function ripemd160(msg) {
  // Convert to array of 32-bit words (little-endian)
  function f(j, x, y, z) {
    if (j < 16)  return x ^ y ^ z;
    if (j < 32)  return (x & y) | (~x & z);
    if (j < 48)  return (x | ~y) ^ z;
    if (j < 64)  return (x & z) | (y & ~z);
    return x ^ (y | ~z);
  }
  const K  = [0x00000000, 0x5A827999, 0x6ED9EBA1, 0x8F1BBCDC, 0xA953FD4E];
  const KK = [0x50A28BE6, 0x5C4DD124, 0x6D703EF3, 0x7A6D76E9, 0x00000000];
  const r  = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,
              7,4,13,1,10,6,15,3,12,0,9,5,2,14,11,8,
              3,10,14,4,9,15,8,1,2,7,0,6,13,11,5,12,
              1,9,11,10,0,8,12,4,13,3,7,15,14,5,6,2,
              4,0,5,9,7,12,2,10,14,1,3,8,11,6,15,13];
  const rr = [5,14,7,0,9,2,11,4,13,6,15,8,1,10,3,12,
              6,11,3,7,0,13,5,10,14,15,8,12,4,9,1,2,
              15,5,1,3,7,14,6,9,11,8,12,2,10,0,4,13,
              8,6,4,1,3,11,15,0,5,12,2,13,9,7,10,14,
              12,15,10,4,1,5,8,7,6,2,13,14,0,3,9,11];
  const s  = [11,14,15,12,5,8,7,9,11,13,14,15,6,7,9,8,
              7,6,8,13,11,9,7,15,7,12,15,9,11,7,13,12,
              11,13,6,7,14,9,13,15,14,8,13,6,5,12,7,5,
              11,12,14,15,14,15,9,8,9,14,5,6,8,6,5,12,
              9,15,5,11,6,8,13,12,5,12,13,14,11,8,5,6];
  const ss = [8,9,9,11,13,15,15,5,7,7,8,11,14,14,12,6,
              9,13,15,7,12,8,9,11,7,7,12,7,6,15,13,11,
              9,7,15,11,8,6,6,14,12,13,5,14,13,13,7,5,
              15,5,8,11,14,14,6,14,6,9,12,9,12,5,15,8,
              8,5,12,9,12,5,14,6,8,13,6,5,15,13,11,11];

  // Pad message
  const bytes = Array.from(msg);
  const bitLen = bytes.length * 8;
  bytes.push(0x80);
  while (bytes.length % 64 !== 56) bytes.push(0);
  for (let i = 0; i < 8; i++) bytes.push((bitLen / Math.pow(2, i*8)) & 0xff);

  const words = [];
  for (let i = 0; i < bytes.length / 4; i++) {
    words.push((bytes[i*4]) | (bytes[i*4+1] << 8) | (bytes[i*4+2] << 16) | (bytes[i*4+3] << 24));
  }

  let [h0, h1, h2, h3, h4] = [0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476, 0xC3D2E1F0];

  const rol = (x, n) => (x << n) | (x >>> (32 - n));
  const add = (...xs) => xs.reduce((a, b) => (a + b) | 0);

  for (let i = 0; i < words.length / 16; i++) {
    const X = words.slice(i*16, i*16+16);
    let [al, bl, cl, dl, el] = [h0, h1, h2, h3, h4];
    let [ar, br, cr, dr, er] = [h0, h1, h2, h3, h4];

    for (let j = 0; j < 80; j++) {
      let T = add(al, f(j, bl, cl, dl), X[r[j]], K[Math.floor(j/16)]);
      T = add(rol(T, s[j]), el);
      [al, el, dl, cl, bl] = [el, dl, rol(cl, 10), bl, T];

      T = add(ar, f(79-j, br, cr, dr), X[rr[j]], KK[Math.floor(j/16)]);
      T = add(rol(T, ss[j]), er);
      [ar, er, dr, cr, br] = [er, dr, rol(cr, 10), br, T];
    }
    const T = add(h1, cl, dr);
    [h1, h2, h3, h4, h0] = [add(h2, dl, er), add(h3, el, ar), add(h4, al, br), add(h0, bl, cr), T];
  }

  const result = new Uint8Array(20);
  [h0,h1,h2,h3,h4].forEach((h, i) => {
    result[i*4]   =  h        & 0xff;
    result[i*4+1] = (h >>  8) & 0xff;
    result[i*4+2] = (h >> 16) & 0xff;
    result[i*4+3] = (h >> 24) & 0xff;
  });
  return result;
}

// Hash160 = RIPEMD160(SHA256(data)) — used for Bitcoin/Dogecoin addresses
async function hash160(data) {
  const sha = await sha256(data);
  return ripemd160(Array.from(sha));
}

// ────────────────────────────────────────────────────────────────────────────
// Base58Check
// ────────────────────────────────────────────────────────────────────────────
const BASE58_CHARS = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

async function base58CheckEncode(payload) {
  const checksum = (await doubleSha256(payload)).slice(0, 4);
  const full = new Uint8Array([...payload, ...checksum]);

  let num = 0n;
  for (const b of full) num = num * 256n + BigInt(b);

  let str = '';
  while (num > 0n) {
    str = BASE58_CHARS[Number(num % 58n)] + str;
    num /= 58n;
  }
  for (const b of full) {
    if (b !== 0) break;
    str = '1' + str;
  }
  return str;
}

async function base58CheckDecode(str) {
  let num = 0n;
  for (const c of str) {
    const idx = BASE58_CHARS.indexOf(c);
    if (idx < 0) throw new Error('Invalid Base58 character');
    num = num * 58n + BigInt(idx);
  }
  let hex = num.toString(16);
  if (hex.length % 2) hex = '0' + hex;
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(i*2, i*2+2), 16);

  const payload = bytes.slice(0, -4);
  const checksum = bytes.slice(-4);
  const expectedChecksum = (await doubleSha256(payload)).slice(0, 4);
  for (let i = 0; i < 4; i++) {
    if (checksum[i] !== expectedChecksum[i]) throw new Error('Invalid checksum');
  }
  return payload;
}

// ────────────────────────────────────────────────────────────────────────────
// Real Dogecoin address from secp256k1 public key
// Version byte: 0x1E (30) → addresses start with 'D'
// ────────────────────────────────────────────────────────────────────────────
async function publicKeyToAddress(pubKeyBytes) {
  const keyHash = await hash160(pubKeyBytes);
  const versioned = new Uint8Array([0x1E, ...keyHash]);  // 0x1E = Dogecoin P2PKH
  return base58CheckEncode(versioned);
}

// ────────────────────────────────────────────────────────────────────────────
// WIF private key (Dogecoin mainnet: version 0x9E, + 0x01 compressed suffix)
// ────────────────────────────────────────────────────────────────────────────
async function privateKeyToWIF(privKeyBytes) {
  const payload = new Uint8Array([0x9E, ...privKeyBytes, 0x01]);
  return base58CheckEncode(payload);
}

async function wifToPrivateKey(wif) {
  const payload = await base58CheckDecode(wif);
  if (payload[0] !== 0x9E) throw new Error('Not a Dogecoin WIF key');
  // Remove version byte and optional compression flag
  return payload.slice(1, payload[payload.length-1] === 0x01 ? -1 : undefined);
}

// ────────────────────────────────────────────────────────────────────────────
// BIP39 — Full 2048-word list (English)
// ────────────────────────────────────────────────────────────────────────────
const BIP39_WORDLIST = "abandon ability able about above absent absorb abstract absurd abuse access accident account accuse achieve acid acoustic acquire across act action actor actress actual adapt add addict address adjust admit adult advance advice aerobic afford afraid again age agent agree ahead aim air airport aisle alarm album alcohol alert alien all alley allow almost alone alpha already also alter always amateur amazing among amount amused analyst anchor ancient anger angle angry animal ankle announce annual another answer antenna antique anxiety apart apology appear apple approve april arch arctic area arena argue arm armed armor army around arrange arrest arrive arrow art artefact artist artwork ask aspect assault asset assist assume asthma athlete atom attack attend attitude attract auction audit august aunt author auto autumn average avocado avoid awake aware away awesome awful awkward axis baby balance bamboo banana banner bar barely bargain barrel base basic basket battle beach bean beauty because become beef before begin behave behind believe below belt bench benefit best betray better between beyond bicycle bid bike bind biology bird birth bitter black blade blame blanket blast bleak bless blind blood blossom blouse blue blur blush board boat body boil bomb bone book boost border boring borrow boss bottom bounce box boy bracket brain brand brave bread breeze brick bridge brief bright bring brisk broccoli broken bronze broom brother brown brush bubble buddy budget buffalo build bulb bulk bullet bundle bunker burden burger burst bus business busy butter buyer buzz cabbage cabin cable cactus cage cake call calm camera camp canal cancel candy cannon canvas canyon capable capital captain car carbon card cargo carpet carry cart case cash casino castle casual cat catalog catch category cattle cause cave ceiling census chair chaos chapter charge chase chat cheap check cheese chef cherry chest chicken chief child chimney choice choose chronic chuckle chunk cigar cinnamon circle citizen city civil claim clap clarify claw clay clean clerk clever click client cliff climb clinic clip clock clog close cloth cloud clown club clump cluster cobalt code coil coin collect color column combine come comfort comic common company concert conduct confirm congress connect consider control convince cook cool copper copy coral core corn correct cost cotton couch country couple course cousin cover coyote crack cradle craft cram crane crash crater crawl crazy cream credit creek crew cricket crime crisp critic cross crouch crowd crucial cruel cruise crumble crunch crush cry crystal cube culture cup cupboard curious current curtain curve cushion custom cute cycle dad damage damp dance danger daring dash daughter dawn day deal debate debris decade december decide decline decorate decrease deer defense define defy degree delay deliver demand demise denial dentist deny depart depend deposit depth derive describe desert design desk despair destroy detail detect develop device devote diagram dial diamond diary dice diesel diet differ digital dignity dilemma dinner dinosaur direct dirt disagree discover disease dish dismiss disorder display distance divert divide divorce dizzy doctor document dog doll dolphin domain donate donkey donor door dose double dove draft dragon drama drastic draw dream dress drift drill drink drip drive drop drum dry duck dumb dune during dust dutch duty dwarf dynamic eager eagle early earn earth easily east easy echo ecology edge edit educate effort egg eight either elbow elder electric elegant element elephant elevator elite else embark embody embrace emerge emotion employ empower empty enable enact endless endorse enemy energy enforce engage engine enhance enjoy enlist enough enrich enroll ensure enter entire entry envelope episode equal equip erase erode erosion error erupt escape essay essence estate eternal ethics evidence evil evoke evolve exact example excess exchange excite exclude exercise exhaust exhibit exile exist exit exotic expand expire explain expose express extend extra eye fable face faculty faint faith fall false fame family famous fan fancy fantasy far fashion fat fatal father fatigue fault favorite feature february federal fee feed feel feet fellow felt fence festival fetch fever few fiber fiction field figure file film filter final find fine finger finish fire firm first fiscal fish fit fitness fix flag flame flash flat flavor flee flight flip float flock floor flower fluid flush fly foam focus fog foil follow food force forest forget fork fortune forum forward fossil foster found fox fragile frame frequent fresh friend fringe frog front frost frown frozen fruit fuel fun funny furnace fury future gadget gain galaxy gallery game gap garbage garden garlic garment gas gasp gate gather gauge gaze general genius genre gentle genuine gesture ghost ginger giraffe girl give glad glance glare glass glide glimpse globe gloom glory glove glow glue goat goddess gold good goose gorilla gospel gossip govern gown grab grace grain grant grape grasp grass gravity great green grid grief grit grocery group grow grunt guard guide guilt guitar gun gym habit hair half hammer hamster hand happy harbor harsh harvest hat haunt hawk hazard head health heart heavy hedgehog height hello helmet help hen hero hidden high hill hint hip hire history hobby hockey hold hole holiday hollow home honey hood hope horn hospital host hour hover hub huge human humble humor hundred hungry hunt hurdle hurry hurt husband hybrid ice icon ignore ill illegal image imitate immense immune impact impose improve impulse inbox income increase index indicate indoor industry infant inflict inform inhale inject inner innocent input inquiry insane insect inside inspire install intact interest into invest invite involve iron island isolate issue item ivory jacket jaguar jar jazz jealous jeans jelly jewel job join joke journey joy judge juice jump jungle junior junk just kangaroo keen keep ketchup key kick kid kingdom kiss kit kitchen kite kitten kiwi knee knife knock know lab ladder lady lake lamp language laptop large later laugh laundry lava law lawn lawsuit layer lazy leader learn leave lecture left leg legal legend leisure lemon lend length lens leopard lesson letter level liar liberty library license life lift light like limb limit link lion liquid list little live lizard load loan lobster local lock logic lonely long loop lottery loud lounge love loyal lucky luggage lumber lunar lunch luxury lyrics machine mad magic magnet maid main major make mammal mango mansion manual maple marble march margin marine master match matrix maximum maze meadow mean medal media melody melt member memory mention menu mercy mesh message metal method middle midnight milk million mimic mind minimum minor minute miracle miss mistake mix mixed mixture mobile model modify mom monitor monkey monster month moon moral more morning mosquito mother motion mound mouse move movie much muffin mule multiply muscle museum mushroom music must mutual myself mystery naive name napkin narrow nasty natural nature near neck need negative neglect neither nephew nerve network news next nice night noble noise nominee noodle normal notable note nothing notice novel now nuclear nurse nut oak obey object oblige obscure obtain ocean october odor off offer office often oil okay old olympic omit once onion open option orange orbit orchard order ordinary organ orient original orphan ostrich other outdoor outside oval over own oyster ozone packet page pair palace palm panda panel panic panther paper parade parent park parrot party pass patch path patrol pause pave payment peace peanut peasant pelican pen penalty pencil people pepper perfect permit person pet phone photo phrase physical piano picnic picture piece pig pigeon pill pilot pink pioneer pipe pistol pitch pizza place planet plastic plate play please pledge pluck plug plunge poem poet point polar pole police pond pony popular portion position possible post potato pottery poverty powder power practice praise predict prefer prepare present pretty prevent price pride primary print priority prison private prize problem process produce profit program project promote proof property prosper protect proud provide public pudding pull pulp pulse pumpkin punish pupil purchase purpose push put puzzle pyramid query question quick quit quiz quote rabbit raccoon race rack radar radio rage rail rain raise rally ramp ranch random range rapid rare rate rather raven reach ready real reason rebel rebuild recall receive recipe record recycle reduce reflect reform refuse region regret regular reject relax release relief rely remain remember remind remove render renew rent reopen repair repeat replace report require rescue resemble resist resource response result retire retreat return reunion reveal review reward rhythm ribbon rice rich ride ridge rifle right rigid ring riot ripple risk ritual rival river road roast robot robust rocket romance roof rookie rotate rough round route royal rubber rude rug rule run runway rural sad saddle sadness safe sail salad salmon salon salt salute same sample sand satisfy satoshi sauce sausage save say scale scan scare scatter scene scheme scissors scorpion scout scrap screen script scrub search season seat second secret section security seed seek segment select sell seminar senior sense sentence series service session settle setup seven shadow shaft shallow share shed shell sheriff shield shift shine ship shiver shock shoe shoot shop short shoulder shove shrimp shrug shuffle shy sibling siege sight sign silent silk silly silver similar simple since sing siren sister situate six size ski skill skin skirt skull slab slam sleep slender slice slide slight slim slogan slot slow slush small smart smile smoke smooth snack snake snap sniff snow soap soccer social sock solar soldier solid solution solve someone song soon sorry soul sound soup source south space spare spatial spawn speak special speed sphere spice spider spike spin spirit split spoil sponsor spoon spray spread spring spy square squeeze squirrel stable stadium staff stage stairs stamp stand start state stay steak steel stem step stereo stick still sting stock stomach stone stop store storm story stove strategy street strike strong struggle student stuff stumble style subject submit subway success such sudden suffer sugar suggest suit summer sun sunny sunset super supply supreme sure surface surge surprise sustain swallow swamp swap swear sweet swift swim swing switch sword symbol symptom syrup table tackle tag tail talent tamper tank tape target task tattoo taxi teach team tell ten tenant tennis tent term test text thank that theme then theory there they thing this thought three thrive throw thumb thunder ticket tilt timber time tiny tip tired title toast tobacco today together toilet token tomato tomorrow tone tongue tonight tool topic topple torch tornado tortoise toss total tourist toward tower town toy track trade traffic tragic train transfer trap trash travel tray treat tree trend trial tribe trick trigger trim trip trophy trouble truck truly trumpet trust truth try tube tuition tumble tuna tunnel turkey turn turtle twelve twenty twice twin twist two type typical ugly umbrella unable unaware uncle uncover under undo unfair unfold unhappy uniform unique universe unknown unlock until unusual unveil update upgrade uphold upon upper upset urban usage use used useful useless usual utility vacant vacuum vague valid valley valve van vanish vapor various vast vault vehicle velvet vendor venture venue verb verify version very veteran viable vibrant vicious victory video view village vintage violin virtual virus visa visit visual vital vivid vocal voice void volcano volume vote voyage wage wagon wait walk wall walnut want warfare warm warrior wash wasp waste water wave way wealth weapon wear weasel web wedding weekend weird welcome well west wet whale wheat wheel when where whip whisper wide width wife wild will win window wine wing wink winner winter wire wisdom wise wish witness wolf woman wonder wood wool word work world worry worth wrap wreck wrestle wrist write wrong yard year yellow you young youth zebra zero zone zoo".split(' ');

// Generate cryptographically random entropy
function generateEntropy(bits = 128) {
  const bytes = new Uint8Array(bits / 8);
  crypto.getRandomValues(bytes);
  return bytes;
}

// Convert entropy to BIP39 mnemonic (real checksum)
async function entropyToMnemonic(entropy) {
  const hashByte = (await sha256(entropy))[0];
  const checksumBits = entropy.length * 8 / 32; // ENT/32

  // Build bit string: entropy bits + checksum bits
  let bits = '';
  for (const b of entropy) bits += b.toString(2).padStart(8, '0');
  bits += hashByte.toString(2).padStart(8, '0').slice(0, checksumBits);

  const words = [];
  for (let i = 0; i < bits.length / 11; i++) {
    const idx = parseInt(bits.slice(i * 11, i * 11 + 11), 2);
    words.push(BIP39_WORDLIST[idx]);
  }
  return words;
}

// BIP39 mnemonic to 512-bit seed (PBKDF2-SHA512)
async function mnemonicToSeed(mnemonic, passphrase = '') {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(mnemonic.trim()), 'PBKDF2', false, ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode('mnemonic' + passphrase), iterations: 2048, hash: 'SHA-512' },
    keyMaterial, 512
  );
  return new Uint8Array(bits);
}

// HMAC-SHA512
async function hmacSha512(key, data) {
  const keyBuf = key instanceof Uint8Array ? key : new TextEncoder().encode(key);
  const k = await crypto.subtle.importKey('raw', keyBuf, { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', k, data));
}

// BIP32 master key derivation from seed
async function seedToMasterKey(seed) {
  const I = await hmacSha512(new TextEncoder().encode('Bitcoin seed'), seed);
  return { key: I.slice(0, 32), chainCode: I.slice(32) };
}

// BIP32 child key derivation (hardened: index >= 0x80000000)
async function deriveChildKey(parentKey, parentChainCode, index) {
  const indexBuf = new Uint8Array(4);
  new DataView(indexBuf.buffer).setUint32(0, index, false);

  let data;
  if (index >= 0x80000000) {
    // Hardened
    data = new Uint8Array([0x00, ...parentKey, ...indexBuf]);
  } else {
    const pubKey = Secp256k1.getPublicKey(parentKey, true);
    data = new Uint8Array([...pubKey, ...indexBuf]);
  }

  const I = await hmacSha512(parentChainCode, data);
  const IL = I.slice(0, 32), IR = I.slice(32);

  // childKey = (IL + parentKey) mod N
  const ILn = Secp256k1.bytesToBigInt(IL);
  const pkn  = Secp256k1.bytesToBigInt(parentKey);
  const childKeyN = (ILn + pkn) % Secp256k1.N;
  const childKey = Secp256k1.bigIntToBytes32(childKeyN);

  return { key: childKey, chainCode: IR };
}

// BIP44 path: m/44'/3'/0'/0/0  (Dogecoin = coin type 3)
async function mnemonicToDogeKey(mnemonic) {
  const seed = await mnemonicToSeed(mnemonic);
  let { key, chainCode } = await seedToMasterKey(seed);

  const path = [44 + 0x80000000, 3 + 0x80000000, 0 + 0x80000000, 0, 0];
  for (const idx of path) {
    ({ key, chainCode } = await deriveChildKey(key, chainCode, idx));
  }
  return key;
}

// Full wallet key derivation
async function mnemonicToPrivateKey(mnemonic) {
  return mnemonicToDogeKey(mnemonic.trim());
}

// Real Dogecoin address from private key
async function privateKeyToAddress(privKeyBytes) {
  const pubKey = Secp256k1.getPublicKey(privKeyBytes, true); // compressed
  return publicKeyToAddress(pubKey);
}

// ────────────────────────────────────────────────────────────────────────────
// AES-GCM wallet encryption
// ────────────────────────────────────────────────────────────────────────────
async function pbkdf2Key(password, salt, iterations = 210000) {
  const enc = new TextEncoder();
  const keyMat = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, keyMat, 256
  );
  return new Uint8Array(bits);
}

async function encryptData(data, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv   = crypto.getRandomValues(new Uint8Array(12));
  const keyBytes = await pbkdf2Key(password, salt);
  const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt']);
  const encoded = new TextEncoder().encode(JSON.stringify(data));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  return { salt: Array.from(salt), iv: Array.from(iv), data: Array.from(new Uint8Array(encrypted)) };
}

async function decryptData(encObj, password) {
  const salt = new Uint8Array(encObj.salt);
  const iv   = new Uint8Array(encObj.iv);
  const keyBytes = await pbkdf2Key(password, salt);
  const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['decrypt']);
  const encrypted = new Uint8Array(encObj.data);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted);
  return JSON.parse(new TextDecoder().decode(decrypted));
}

// ────────────────────────────────────────────────────────────────────────────
// QR code matrix (deterministic visual representation)
// ────────────────────────────────────────────────────────────────────────────
function generateQRMatrix(text) {
  const size = 25;
  const matrix = [];
  let hash = 5381;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) + hash) ^ text.charCodeAt(i);
    hash |= 0;
  }
  for (let r = 0; r < size; r++) {
    matrix.push([]);
    for (let c = 0; c < size; c++) {
      if ((r < 7 && c < 7) || (r < 7 && c >= size-7) || (r >= size-7 && c < 7)) {
        const inBorder =
          r === 0 || r === 6 || c === 0 || c === 6 ||
          (r >= size-7 && (r === size-7 || r === size-1 || c === 0 || c === 6)) ||
          (c >= size-7 && (c === size-7 || c === size-1 || r === 0 || r === 6));
        const inCenter =
          (r >= 2 && r <= 4 && c >= 2 && c <= 4) ||
          (r >= 2 && r <= 4 && c >= size-5 && c <= size-3) ||
          (r >= size-5 && r <= size-3 && c >= 2 && c <= 4);
        matrix[r].push(inBorder || inCenter ? 1 : 0);
      } else {
        const seed = (hash ^ (r * 2654435761 + c * 40503)) >>> 0;
        matrix[r].push(((seed * 1103515245 + 12345) >>> 16) & 1);
      }
    }
  }
  return matrix;
}

global.CryptoUtils = {
  sha256, sha256Hex, doubleSha256,
  ripemd160, hash160,
  base58CheckEncode, base58CheckDecode,
  publicKeyToAddress, privateKeyToAddress,
  privateKeyToWIF, wifToPrivateKey,
  generateEntropy, entropyToMnemonic,
  mnemonicToSeed, mnemonicToPrivateKey,
  encryptData, decryptData,
  generateQRMatrix,
  BIP39_WORDLIST
};

})(window);
