# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x     | ✅ Yes    |

## Reporting a Vulnerability

If you discover a security vulnerability, please **do not** open a public GitHub issue.

Instead, email the details to the maintainer or open a [GitHub Security Advisory](../../security/advisories/new).

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will respond within 72 hours and aim to release a patch within 7 days for critical issues.

## Known Limitations

- The secp256k1 implementation is **not constant-time** — side-channel attacks may be possible in adversarial environments. Do not use on shared/compromised machines.
- Red packet state is stored in `chrome.storage.local` — it is **not end-to-end encrypted**.
- This extension has **not been professionally audited**. Use at your own risk with small amounts.
