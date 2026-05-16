# 🐕 DOGE Wallet — Chrome Extension

**English** | [中文](README.zh-CN.md)

> **Much Crypto. Very Secure. Such Red Packet. Wow.**

A fully client-side Dogecoin Chrome extension wallet with real secp256k1 cryptography, BIP39/BIP44 HD key derivation, on-chain transaction signing, and a WeChat-style 🧧 **red packet** feature.

![License](https://img.shields.io/badge/license-MIT-orange)
![Manifest](https://img.shields.io/badge/manifest-v3-blue)
![Crypto](https://img.shields.io/badge/crypto-secp256k1-yellow)
![Chain](https://img.shields.io/badge/chain-Dogecoin-C8A435)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔐 **HD Wallet** | BIP39 12-word mnemonic + BIP44 path `m/44'/3'/0'/0/0` |
| 🔑 **Real Cryptography** | secp256k1 ECDSA, RIPEMD-160, Base58Check — no shortcuts |
| 💰 **Live Balance** | Powered by Blockchair API |
| 📈 **Price Ticker** | Real-time DOGE/USD via CoinGecko |
| 📤 **Send DOGE** | Builds & signs real P2PKH transactions, broadcasts to mainnet |
| 📥 **Receive** | Address display with QR code |
| 🧧 **Red Packet** | WeChat-style lucky money — split DOGE among friends randomly |
| 🔒 **AES-GCM Encryption** | Wallet encrypted with PBKDF2 (210,000 iterations) locally |
| 📱 **Import/Export** | BIP39 mnemonic import, WIF private key export |

---

## 🧧 Red Packet Feature

Send a DOGE red packet to multiple friends — amounts are randomly distributed using the **double-average algorithm** (same as WeChat).

### How it works

```
Sender                           Recipients
  │                                  │
  ├─ Set amount: 10 DOGE             │
  ├─ Set count: 5 people             │
  ├─ Random split: [3.2, 1.5, 2.1,  │
  │                 0.8, 2.4] DOGE   │
  ├─ Generate Red Packet ID ─────────┤
  │   e.g. RPAB3DE7KL                │
  │                                  │
  │            Share ID via chat     │
  │  ────────────────────────────►   │
  │                                  ├─ Enter ID in extension
  │                                  ├─ Click "抢红包！"
  │  ◄────────────────────────────   │
  │   On-chain TX (secp256k1 signed) │
  └─                                 └─ Receives DOGE ✓
```

### Red Packet rules
- Minimum **0.01 DOGE** per slot
- Maximum **20** slots per packet
- Expires after **24 hours**
- Each address can only claim **once**
- Uses **double-average algorithm** for fair randomness

---

## 🏗️ Architecture

```
doge-wallet/
├── manifest.json          # Chrome MV3 manifest
├── popup.html             # Single-page UI (all pages)
└── js/
    ├── secp256k1.js       # Real secp256k1 elliptic curve (Jacobian coords)
    ├── crypto-utils.js    # RIPEMD-160, Base58Check, BIP39/32/44, AES-GCM
    ├── wallet.js          # Wallet state, UTXO fetch, TX build & sign & broadcast
    ├── redpacket.js       # Red packet logic (split, create, claim)
    ├── ui.js              # Main UI controller
    ├── ui-redpacket.js    # Red packet UI controller
    └── background.js      # Service worker
```

### Cryptographic stack

```
Entropy (128-bit random)
    │
    ▼ BIP39
Mnemonic (12 words from 2048-word list)
    │
    ▼ PBKDF2-SHA512 (2048 iterations, salt="mnemonic")
512-bit Seed
    │
    ▼ HMAC-SHA512 ("Bitcoin seed")
Master Key + Chain Code
    │
    ▼ BIP44 path: m/44'/3'/0'/0/0  (coin_type=3 = Dogecoin)
Private Key (32 bytes)
    │
    ├──▼ secp256k1 scalar multiply G
    │   Compressed Public Key (33 bytes)
    │       │
    │       ▼ SHA-256 → RIPEMD-160 (Hash160)
    │       20-byte key hash
    │           │
    │           ▼ version byte 0x1E + checksum (double-SHA256)
    │           Dogecoin Address (Base58Check, starts with 'D')
    │
    └──▼ version byte 0x9E + 0x01 compressed flag
        WIF Private Key (Base58Check, starts with 'Q')
```

### Transaction signing

```
UTXO selection (largest-first)
    │
    ▼
Raw TX preimage per input (P2PKH, SIGHASH_ALL)
    │
    ▼ double-SHA256
Message hash (32 bytes)
    │
    ▼ RFC6979 deterministic k (HMAC-SHA256)
    ▼ secp256k1 ECDSA sign
(r, s) → DER encode → append 0x01 (SIGHASH_ALL)
    │
    ▼
scriptSig: <DER sig + hashtype> <compressed pubkey>
    │
    ▼ Blockchair API broadcast
Transaction Hash ✓
```

---

## 🚀 Installation

### From source (developer mode)

1. Clone the repository:
   ```bash
   git clone https://github.com/onedooge/doge-wallet.git
   ```

2. Open Chrome and go to `chrome://extensions/`

3. Enable **Developer mode** (top-right toggle)

4. Click **"Load unpacked"** and select the `doge-wallet/` folder

5. The 🐕 icon will appear in your toolbar

### From release ZIP

1. Download `doge-wallet-extension.zip` from [Releases](../../releases)
2. Unzip it
3. Follow steps 2–5 above

---

## 🔒 Security

- **All keys are local** — private keys never leave your device
- **AES-GCM-256** encryption with PBKDF2 (210,000 iterations, SHA-256)
- **No external key servers** — fully self-custodial
- **No analytics, no ads, no tracking**
- secp256k1 implementation uses **Jacobian projective coordinates** to avoid timing leaks in field arithmetic
- RFC6979 **deterministic k** for ECDSA — eliminates k-reuse vulnerabilities

### ⚠️ Disclaimer

This wallet is provided for educational and experimental use. While it uses real cryptographic primitives:
- The secp256k1 implementation has **not been independently audited**
- For large amounts, consider using audited hardware wallets
- Always **back up your seed phrase** — there is no recovery without it
- Test with small amounts first

---

## 🛠️ Development

### Prerequisites
- Chrome or Chromium browser
- No build step required — pure vanilla JS

### File overview

| File | Lines | Purpose |
|------|-------|---------|
| `js/secp256k1.js` | 207 | Elliptic curve math (point add, double, multiply) |
| `js/crypto-utils.js` | 376 | All crypto primitives + BIP39/32/44 |
| `js/wallet.js` | 402 | Core wallet operations + network calls |
| `js/redpacket.js` | 216 | Red packet business logic |
| `js/ui.js` | 439 | Main UI event handling |
| `js/ui-redpacket.js` | 292 | Red packet UI |
| `popup.html` | 1313 | Complete UI (all pages + styles) |

### APIs used

| API | Purpose | Rate limit |
|-----|---------|-----------|
| [Blockchair](https://blockchair.com/api) | Balance, UTXOs, broadcast | 1440 req/day (free) |
| [CoinGecko](https://www.coingecko.com/api) | DOGE/USD price | 30 req/min (free) |

### Running tests (manual)

1. Load extension in Chrome
2. Create a new wallet — verify address starts with `D`
3. Check address on [dogechain.info](https://dogechain.info)
4. Send a tiny amount to yourself from a faucet
5. Verify balance updates on refresh

---

## 📋 Pages / UI Flow

```
Welcome
├── Create Wallet
│   ├── Set Password
│   └── Backup Mnemonic (12 words)
└── Import Wallet
    └── Enter mnemonic + password

Unlock (returning user)
    └── Enter password

Main Wallet
├── Balance card (DOGE + USD)
├── Address strip + copy
├── Actions: Send | Receive | 🧧 Red Packet | Refresh
├── 🧧 Claim Red Packet (button)
└── Transaction history

Send DOGE
Receive DOGE (QR code)
Red Packet — Send
Red Packet — Share (ID + slot preview)
Red Packet — Claim
Red Packet — Status
Settings
├── Export private key (WIF)
├── View seed phrase
├── Lock wallet
└── Reset wallet
```

---

## 🗺️ Roadmap

- [ ] Multi-account support (BIP44 account index)
- [ ] Transaction history with full details
- [ ] Fee estimation from mempool
- [ ] Red packet cross-device sync (IPFS or relay)
- [ ] QR code scanner for receiving
- [ ] Hardware wallet support (Ledger)

---

## 🤝 Contributing

PRs welcome! Please:
1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit with clear messages
4. Open a PR with a description of changes

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">
  <strong>🐕 Much Open Source. Very Community. Such Wow. 🐕</strong>
</div>
