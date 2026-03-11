# Contributing to DOGE Wallet 🐕

Much welcome. Very contribution. Wow.

## Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/doge-wallet.git
   cd doge-wallet
   ```
3. Load as unpacked extension in `chrome://extensions/` (Developer mode)

## Development Workflow

No build step — just edit files and reload the extension in Chrome.

```bash
# After making changes:
# 1. Go to chrome://extensions/
# 2. Click the refresh icon on the DOGE Wallet card
# 3. Reopen the popup
```

## Code Style

- Plain vanilla JS (`'use strict'`)
- No external dependencies at runtime
- All crypto must stay in `js/secp256k1.js` and `js/crypto-utils.js`
- UI logic stays in `js/ui.js` / `js/ui-redpacket.js`
- Never use `eval()`, `innerHTML` with user data, or inline event handlers

## Pull Request Guidelines

- **One feature per PR**
- Include a clear description of what changed and why
- Test manually: create wallet, send/receive, red packet flow
- Update `README.md` if adding new features

## Areas for Contribution

- 🐛 Bug fixes
- 🌐 Translations (i18n)
- ⚡ Performance improvements to secp256k1 (windowed multiplication, etc.)
- 🔒 Security hardening
- 📱 UI/UX improvements
- 🧪 Automated tests

## Questions?

Open a [GitHub Discussion](../../discussions) — much community, very helpful.
