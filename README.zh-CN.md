# 🐕 DOGE Wallet — Chrome 浏览器扩展

[English](README.md) | **中文**

> **Much Crypto. Very Secure. Such Red Packet. Wow.**

一个完全运行在浏览器本地的狗狗币（Dogecoin）钱包扩展，使用真实的 secp256k1 椭圆曲线密码学、BIP39/BIP44 HD 密钥推导、链上交易签名，以及一个微信风格的 🧧 **红包** 功能。

![License](https://img.shields.io/badge/license-MIT-orange)
![Manifest](https://img.shields.io/badge/manifest-v3-blue)
![Crypto](https://img.shields.io/badge/crypto-secp256k1-yellow)
![Chain](https://img.shields.io/badge/chain-Dogecoin-C8A435)

---

## ✨ 功能

| 功能 | 说明 |
|------|------|
| 🔐 **HD 钱包** | BIP39 12 位助记词 + BIP44 路径 `m/44'/3'/0'/0/0` |
| 🔑 **真实密码学** | secp256k1 ECDSA、RIPEMD-160、Base58Check，无简化 |
| 💰 **实时余额** | 通过 Blockchair API 查询 |
| 📈 **价格行情** | CoinGecko 提供 DOGE/USD 实时价格 |
| 📤 **发送 DOGE** | 构造并签名真实的 P2PKH 交易，广播到主网 |
| 📥 **接收** | 显示地址 + 二维码 |
| 🧧 **红包** | 微信风格幸运分配，DOGE 在好友间随机切分 |
| 🔒 **AES-GCM 加密** | 钱包数据本地加密，PBKDF2（21 万次迭代） |
| 📱 **导入 / 导出** | 支持 BIP39 助记词导入、WIF 私钥导出、加密助记词导出 |

---

## 🧧 红包功能

发一个 DOGE 红包给多位好友 — 金额用 **二倍均值算法** 随机分配（和微信红包一致）。

### 工作流程

```
发送方                            接收方
  │                                  │
  ├─ 设置总金额：10 DOGE              │
  ├─ 设置个数：5 人                  │
  ├─ 随机分配：[3.2, 1.5, 2.1,       │
  │            0.8, 2.4] DOGE        │
  ├─ 生成红包 ID ──────────────────┤
  │   例如 RPAB3DE7KL                │
  │                                  │
  │       通过聊天分享 ID            │
  │  ────────────────────────────►   │
  │                                  ├─ 在插件中粘贴 ID
  │                                  ├─ 点击 "抢红包！"
  │  ◄────────────────────────────   │
  │   链上交易（secp256k1 签名）     │
  └─                                 └─ 收到 DOGE ✓
```

### 红包规则
- 每份最少 **0.01 DOGE**
- 每个红包最多 **20** 份
- **24 小时** 后过期
- 每个地址只能领 **一次**
- 使用 **二倍均值算法** 保证随机公平

---

## 🏗️ 项目结构

```
doge-wallet/
├── manifest.json          # Chrome MV3 manifest
├── popup.html             # 单页 UI（所有页面）
└── js/
    ├── secp256k1.js       # secp256k1 椭圆曲线（雅可比坐标）
    ├── crypto-utils.js    # RIPEMD-160、Base58Check、BIP39/32/44、AES-GCM
    ├── wallet.js          # 钱包状态、UTXO 拉取、构造签名广播交易
    ├── redpacket.js       # 红包业务逻辑（拆分、创建、领取）
    ├── ui.js              # 主 UI 控制器
    ├── ui-redpacket.js    # 红包 UI 控制器
    └── background.js      # Service worker
```

### 密码学栈

```
熵（128 位随机）
    │
    ▼ BIP39
助记词（从 2048 词表里选 12 个）
    │
    ▼ PBKDF2-SHA512（2048 次迭代，salt="mnemonic"）
512 位 Seed
    │
    ▼ HMAC-SHA512（key="Bitcoin seed"）
主密钥 + Chain Code
    │
    ▼ BIP44 路径：m/44'/3'/0'/0/0（coin_type=3 表示 Dogecoin）
私钥（32 字节）
    │
    ├──▼ secp256k1 标量乘 G
    │   压缩公钥（33 字节）
    │       │
    │       ▼ SHA-256 → RIPEMD-160（Hash160）
    │       20 字节 key hash
    │           │
    │           ▼ 版本字节 0x1E + checksum（double-SHA256）
    │           Dogecoin 地址（Base58Check，"D" 开头）
    │
    └──▼ 版本字节 0x9E + 压缩标志 0x01
        WIF 私钥（Base58Check，"Q" 开头）
```

### 交易签名

```
UTXO 选择（按金额从大到小）
    │
    ▼
为每个输入构造 raw TX preimage（P2PKH, SIGHASH_ALL）
    │
    ▼ double-SHA256
消息哈希（32 字节）
    │
    ▼ RFC6979 确定性 k（HMAC-SHA256）
    ▼ secp256k1 ECDSA 签名
(r, s) → DER 编码 → 追加 0x01（SIGHASH_ALL）
    │
    ▼
scriptSig: <DER 签名 + 类型字节> <压缩公钥>
    │
    ▼ Blockchair API 广播
交易哈希 ✓
```

---

## 🚀 安装

### 从源码安装（开发者模式）

1. 克隆仓库：
   ```bash
   git clone https://github.com/onedooge/doge-wallet.git
   ```

2. 打开 Chrome，进入 `chrome://extensions/`

3. 打开右上角 **"开发者模式"** 开关

4. 点击 **"加载已解压的扩展程序"**，选择 `doge-wallet/` 文件夹

5. 工具栏会出现 🐕 图标

### 从 Release ZIP 安装

1. 从 [Releases](../../releases) 下载 `doge-wallet-extension.zip`
2. 解压
3. 按上面的 2–5 步操作

---

## 🔒 安全说明

- **所有密钥本地保存** — 私钥永远不会离开你的设备
- **AES-GCM-256** 加密 + PBKDF2（21 万次迭代，SHA-256）
- **无外部密钥服务** — 完全自托管
- **无统计、无广告、无追踪**
- secp256k1 实现使用 **雅可比射影坐标**，规避域算术里的时序泄漏
- ECDSA 使用 RFC6979 **确定性 k**，杜绝 k 复用漏洞

### 助记词备份建议

1. **首推纸笔抄写、离线保管**（最安全）
2. 抄写后建议保存 2 份在不同的物理位置
3. 切勿截图、拍照、上传到云盘、发送到聊天软件
4. 切勿告诉任何人 — 包括"客服"、亲友、技术支持
5. 如必须电子保存，使用插件设置里的 **"📦 加密导出助记词"** — 用钱包密码加密生成 .json 文件

### ⚠️ 免责声明

本钱包仅供学习与实验使用。虽然使用了真实的密码学组件：
- secp256k1 实现 **未经过独立审计**
- 大额资产请使用经过审计的硬件钱包
- 务必 **备份助记词** — 没有助记词无法恢复
- 先用小额试验

---

## 🛠️ 开发

### 环境要求
- Chrome 或 Chromium 浏览器
- 无需构建 — 纯原生 JavaScript

### 文件概览

| 文件 | 行数 | 功能 |
|------|------|------|
| `js/secp256k1.js` | 207 | 椭圆曲线运算（点加、倍点、标量乘） |
| `js/crypto-utils.js` | 376 | 全部密码学原语 + BIP39/32/44 |
| `js/wallet.js` | 80 | 钱包核心 + 网络调用 |
| `js/redpacket.js` | 216 | 红包业务逻辑 |
| `js/ui.js` | ~490 | 主 UI 事件处理 |
| `js/ui-redpacket.js` | 292 | 红包 UI |
| `popup.html` | ~1400 | 完整 UI（所有页面 + 样式） |

### 用到的 API

| API | 用途 | 速率限制 |
|-----|------|---------|
| [Blockchair](https://blockchair.com/api) | 余额、UTXO、广播 | 1440 次/天（免费） |
| [CoinGecko](https://www.coingecko.com/api) | DOGE/USD 价格 | 30 次/分钟（免费） |

### 手动测试

1. 在 Chrome 中加载扩展
2. 创建新钱包 — 验证地址是 `D` 开头
3. 在 [dogechain.info](https://dogechain.info) 上查地址
4. 从水龙头给自己发一点点 DOGE
5. 刷新看余额是否更新

---

## 📋 页面 / UI 流程

```
欢迎页
├── 创建钱包
│   ├── 设置密码
│   └── 备份助记词（12 词）
└── 导入钱包
    └── 输入助记词 + 密码

解锁页（已有钱包）
    └── 输入密码

主钱包页
├── 余额卡（DOGE + USD）
├── 地址栏 + 复制
├── 操作：发送 | 接收 | 🧧 红包 | 刷新
├── 🧧 领红包（按钮）
└── 交易记录

发送 DOGE
接收 DOGE（二维码）
红包 — 发送
红包 — 分享（ID + 分配预览）
红包 — 领取
红包 — 状态
设置
├── 导出私钥（WIF）
├── 查看助记词
├── 📦 加密导出助记词
├── 锁定钱包
└── 重置钱包
```

---

## 🗺️ 路线图

- [ ] 多账户支持（BIP44 account index）
- [ ] 完整交易历史详情
- [ ] 从 mempool 估算手续费
- [ ] 红包跨设备同步（IPFS 或中继）
- [ ] 二维码扫描接收
- [ ] 硬件钱包支持（Ledger）
- [ ] 代币支持（Doginals / DRC-20）

---

## 🤝 贡献

欢迎 PR！流程：
1. Fork 本仓库
2. 新建功能分支：`git checkout -b feature/my-feature`
3. 提交清晰的 commit message
4. 提交 PR 并说明改动

---

## 📄 License

MIT License — 详见 [LICENSE](LICENSE)。

---

<div align="center">
  <strong>🐕 Much Open Source. Very Community. Such Wow. 🐕</strong>
</div>
