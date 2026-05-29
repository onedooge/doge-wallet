// i18n.js — bilingual (zh / en) dictionary and switcher
'use strict';

const I18N = {
  zh: {
    // header
    header_logo_sub: 'Much Crypto. Very Wow.',
    btn_refresh_title: '刷新',
    btn_settings_title: '设置',
    btn_lang_title: '切换语言 / Switch Language',
    back_btn: '← 返回',
    back_wallet: '← 返回钱包',
    back_rp: '← 红包',

    // welcome
    welcome_title: '欢迎使用 DOGE Wallet!',
    welcome_sub: 'Much Wow · Very Crypto · So Decentralized',
    welcome_meme1: '🌟 wow. such wallet.',
    welcome_meme2: '💰 very dogecoin. much safe.',
    welcome_meme3: '🚀 so moon. many features.',
    welcome_meme4: '✨ amaze. very secure. wow.',
    welcome_btn_create: '🆕 创建新钱包',
    welcome_btn_import: '📥 导入已有钱包',

    // create password
    create_pwd_title: '🔐 设置钱包密码',
    create_pwd_sub: '密码用于加密本地数据，请牢记！',
    create_pwd_label: '密码',
    create_pwd_ph: '至少8位字符...',
    create_pwd_confirm_label: '确认密码',
    create_pwd_confirm_ph: '再次输入密码...',
    create_pwd_btn: '✨ 创建钱包',

    // backup
    backup_title: '🌱 备份助记词',
    backup_sub: '这 12 个单词是恢复钱包的唯一凭证',
    backup_warn_head: '请立即用纸笔抄写，妥善保管！',
    backup_warn1_a: '助记词 ',
    backup_warn1_b: '丢失',
    backup_warn1_c: ' = 钱包永久丢失，',
    backup_warn1_d: '无法找回',
    backup_warn2_a: '助记词 ',
    backup_warn2_b: '泄露',
    backup_warn2_c: ' = 资产被盗，',
    backup_warn2_d: '无法挽回',
    backup_warn3: '切勿截图、拍照、存入手机 / 电脑 / 网盘 / 聊天软件',
    backup_warn4: '切勿告诉任何人 — 包括"客服"、亲友、技术支持',
    backup_warn5: '建议抄写 2 份，分别放在不同的安全位置',
    backup_check_a: '我已用纸笔抄写并妥善保管，理解一旦丢失或泄露',
    backup_check_b: '无法找回',
    backup_confirm_btn: '✅ 我已安全备份',

    // import
    import_title: '📥 导入钱包',
    import_sub: '输入助记词或私钥来恢复您的钱包',
    import_seed_label: '助记词 / 私钥',
    import_seed_ph: '输入12或24个助记词，用空格分隔\n或输入WIF格式私钥...',
    import_pwd_label: '设置新密码',
    import_pwd_ph: '设置钱包访问密码...',
    import_btn: '📥 导入钱包',

    // unlock
    unlock_title: '解锁钱包',
    unlock_sub: 'Much Security. Very Safe. Wow.',
    unlock_pwd_label: '密码',
    unlock_pwd_ph: '输入钱包密码...',
    unlock_btn: '🔓 解锁',
    unlock_reset_btn: '🔄 重置钱包',

    // wallet main
    wallet_balance_label: '总余额',
    wallet_address_loading: '加载中...',
    wallet_copy: '复制',
    wallet_copied: '✓ 已复制',
    wallet_action_send: '发送',
    wallet_action_receive: '接收',
    wallet_action_redpacket: '红包',
    wallet_action_refresh: '刷新',
    apps_title: '应用',
    wallet_tx_title: '交易记录',
    wallet_claim_rp: '🧧 领红包',
    wallet_tx_empty_line1: '🐕 暂无交易记录',
    wallet_tx_empty_line2: 'Such empty. Very quiet. Wow.',

    // send
    send_title: '📤 发送 DOGE',
    send_sub: 'Much Send. Very Transaction. Wow.',
    send_to_label: '收款地址',
    send_to_ph: 'D开头的Dogecoin地址...',
    send_amount_label: '发送数量 (DOGE)',
    send_fee_label: '网络手续费 (DOGE)',
    fee_low: '低',
    fee_mid: '中',
    fee_high: '高',
    fee_low_hint: '网络空闲',
    fee_mid_hint: '推荐',
    fee_high_hint: '网络繁忙',
    fee_custom_label: '自定义',
    fee_custom_ph: '输入金额...',
    send_fee_tip: '💡 网络繁忙时建议选高档；手续费过低可能导致交易长时间不被确认。建议范围 0.1–1 DOGE。',
    send_balance_avail: '可用余额:',
    send_btn: '🚀 确认发送',

    // receive
    recv_title: '📥 接收 DOGE',
    recv_sub: '把你的地址分享给对方即可',
    recv_copy_btn: '📋 复制地址',

    // red packet — send
    rp_send_title: '发 DOGE 红包',
    rp_send_sub: 'Much Lucky. Very Wow. So Generous.',
    rp_amount_label: '红包总金额 (DOGE)',
    rp_count_label: '红包个数',
    rp_count_3: '3个',
    rp_count_5: '5个',
    rp_count_8: '8个',
    rp_count_10: '10个',
    rp_greet_label: '红包祝福语',
    rp_greet_ph: '恭喜发财，DOGE大吉！',
    rp_preview_default: '填写金额预览分配...',
    rp_create_btn: '🧧 创建红包',

    // red packet — share
    rp_share_title: '红包已创建！',
    rp_share_sub_tmpl: '共 5 个，总额 10 DOGE',
    rp_share_id_label: '红包 ID',
    rp_share_slots_label: '随机分配',
    rp_share_link_hint: '分享此链接给朋友领取：',
    rp_share_link_loading: '生成中...',
    rp_copy_link: '📋 复制链接',
    rp_view_status: '📊 查看状态',

    // red packet — claim
    rp_claim_from: '来自朋友的红包',
    rp_claim_greet: '恭喜发财，DOGE大吉！',
    rp_claim_meta: '还剩 5/5 个未领取',
    rp_result_label: '手气不错！',
    rp_claim_id_label: '输入红包 ID',
    rp_claim_id_ph: '粘贴红包ID...',
    rp_load_btn: '🔍 查询红包',
    rp_claim_btn: '🧧 抢红包！',

    // red packet — status
    rp_status_title: '🧧 红包状态',

    // settings
    settings_title: '⚙️ 钱包设置',
    settings_sub: 'Manage Your DOGE. Such Options. Wow.',
    auto_lock_label: '自动锁定',
    auto_lock_off: '关闭即锁',
    auto_lock_5m: '5 分钟',
    auto_lock_15m: '15 分钟',
    auto_lock_30m: '30 分钟',
    auto_lock_60m: '60 分钟',
    hot_wallet_title: '⚠️ 安全提示 · 这是热钱包',
    hot_wallet_intro: '本钱包适合<strong>小额日常交互</strong>。',
    hot_wallet_tip1: '资金较多 → 建议「关闭即锁」，每次输入密码',
    hot_wallet_tip2: '小额日常 → 可设较长免密（5~60 分钟）',
    hot_wallet_tip3: '大额资产请使用 <strong>硬件钱包</strong> 或交易所',
    settings_export_key: '🔑 导出私钥',
    settings_show_seed: '🌱 查看助记词',
    settings_export_seed: '📦 加密导出助记词',
    settings_lock: '🔒 锁定钱包',
    settings_reset: '⚠️ 重置钱包',
    settings_footer_l1: 'DOGE Wallet v1.0.2',
    settings_footer_l2: 'Much Open Source. Very Trustworthy. Wow. 🐕',

    // ── Dialogs / Toasts ──
    confirm_show_seed: '⚠️ 即将显示助记词！\n\n请确保周围没有他人。切勿截图！',
    confirm_export_key: '⚠️ 私钥非常敏感！确定要查看吗？\n\n切勿分享给任何人！',
    confirm_reset_strong: '⚠️ 危险操作！\n\n重置将删除所有数据。\n请确保已备份助记词！\n\n确定重置？',
    confirm_reset_unlock: '⚠️ 确定要重置钱包吗？\n\n所有数据将被删除，请确保已备份助记词！',
    confirm_backup_final: '⚠️ 最后确认\n\n你已经把 12 个助记词手写抄录到纸上并妥善保管了吗？\n\n点击"确定"后将关闭此页，今后只能通过设置 → 查看助记词重新查看。',
    confirm_export_enc: '⚠️ 加密导出助记词\n\n风险提示：\n• 联网设备存在被盗、勒索软件加密、云同步外泄等风险\n• 文件即使用密码加密，弱密码仍可能被暴力破解\n• 最安全的方式是纸笔抄写后离线保管\n\n下一步需要输入钱包密码进行加密。\n确定继续？',
    prompt_export_pwd: '请输入钱包密码（用于加密导出文件）：',

    toast_pwd_min8: '⚠️ 密码至少需要8位字符',
    toast_pwd_mismatch: '❌ 两次密码不一致',
    toast_creating: '🔄 创建钱包中...',
    toast_create_fail: '❌ 创建失败: ',
    toast_create_success: '🎉 钱包创建成功！Much Wow!',
    toast_need_seed: '⚠️ 请输入助记词或私钥',
    toast_importing: '🔄 导入中...',
    toast_import_success: '✅ 钱包导入成功！',
    toast_need_pwd: '⚠️ 请输入密码',
    toast_unlocking: '🔄 解锁中...',
    toast_unlocked: '🔓 已解锁！Such Security. Wow.',
    toast_reset_done: '🔄 钱包已重置',
    toast_need_addr_amt: '⚠️ 请填写收款地址和金额',
    toast_sending: '🔄 发送中...',
    toast_send_success: '🚀 发送成功！Much Transaction. Wow!',
    toast_refreshing: '🔄 刷新中...',
    toast_refresh_ok: '✅ 刷新成功！',
    toast_network_issue: '⚠️ 网络连接问题，请稍后重试',
    toast_copy_fail: '❌ 复制失败',
    toast_addr_copied: '📋 地址已复制！',
    toast_wif_copied: '🔑 WIF私钥已复制到剪贴板（请立即清除）',
    toast_locked_first: '❌ 钱包已锁定，请先解锁',
    toast_pwd_wrong: '❌ 密码错误',
    toast_export_done: '✅ 已加密导出，请妥善保管',
    toast_lock_done: '🔒 钱包已锁定',

    tx_recv_label: '收到',
    tx_send_label: '发送',

    // ── Red packet (dynamic) ──
    rp_min_warn: '⚠️ 每人最少 0.01 DOGE，请增加金额或减少人数',
    rp_preview_tmpl: '🎲 预览 {count} 个红包：最少 {min} DOGE，最多 {max} DOGE（随机）',
    rp_share_sub_tmpl_dyn: '共 {count} 个，总额 {total} DOGE',
    rp_share_text_tmpl: 'DOGE红包ID: {id}  |  在 DOGE Wallet 插件中输入此ID领取',
    rp_claim_from_tmpl: '来自 {sender} 的红包',
    rp_claim_meta_tmpl: '还剩 {remain}/{total} 个未领取 · 共 {amount} DOGE',
    rp_progress_label: '进度:',
    rp_claimed_word: '已领取',
    rp_total_label: '总额:',
    rp_fully_claimed: '✅ 红包已领完',
    rp_expired: '⏰ 红包已过期',
    rp_claimed_short: '已领取',
    rp_waiting: '等待领取...',
    rp_claimed_tag: '✓ 已领',
    rp_open_tag: '未领',
    rp_slot_claimed: '已领',
    rp_slot_open: '未领',

    rp_toast_locked: '❌ 请先解锁钱包',
    rp_toast_need_amount: '⚠️ 请输入红包金额',
    rp_toast_insufficient_tmpl: '❌ 余额不足 (余额: {bal} DOGE)',
    rp_toast_creating: '🔄 创建中...',
    rp_toast_create_success: '🧧 红包创建成功！Much Lucky!',
    rp_toast_link_copied: '📋 红包链接已复制！',
    rp_toast_need_id: '⚠️ 请输入红包 ID',
    rp_toast_searching: '🔍 查询中...',
    rp_toast_taken_all: '😢 红包已被领完',
    rp_toast_expired: '⏰ 红包已过期',
    rp_toast_already_claimed: '🐕 您已经领过这个红包了',
    rp_toast_found_tmpl: '✅ 找到红包！{remain}/{total} 个未领取',
    rp_toast_claiming: '🔄 领取中...',
    rp_toast_grab_success_tmpl: '🎉 抢到 {amount} DOGE！Much Lucky!',
  },

  en: {
    // header
    header_logo_sub: 'Much Crypto. Very Wow.',
    btn_refresh_title: 'Refresh',
    btn_settings_title: 'Settings',
    btn_lang_title: 'Switch Language / 切换语言',
    back_btn: '← Back',
    back_wallet: '← Back to Wallet',
    back_rp: '← Red Packet',

    // welcome
    welcome_title: 'Welcome to DOGE Wallet!',
    welcome_sub: 'Much Wow · Very Crypto · So Decentralized',
    welcome_meme1: '🌟 wow. such wallet.',
    welcome_meme2: '💰 very dogecoin. much safe.',
    welcome_meme3: '🚀 so moon. many features.',
    welcome_meme4: '✨ amaze. very secure. wow.',
    welcome_btn_create: '🆕 Create New Wallet',
    welcome_btn_import: '📥 Import Wallet',

    // create password
    create_pwd_title: '🔐 Set Wallet Password',
    create_pwd_sub: 'Used to encrypt local data — keep it safe!',
    create_pwd_label: 'Password',
    create_pwd_ph: 'At least 8 characters...',
    create_pwd_confirm_label: 'Confirm Password',
    create_pwd_confirm_ph: 'Re-enter password...',
    create_pwd_btn: '✨ Create Wallet',

    // backup
    backup_title: '🌱 Backup Mnemonic',
    backup_sub: 'These 12 words are the only way to recover your wallet',
    backup_warn_head: 'Write them down on paper and store safely!',
    backup_warn1_a: 'Mnemonic ',
    backup_warn1_b: 'lost',
    backup_warn1_c: ' = wallet permanently gone, ',
    backup_warn1_d: 'no recovery',
    backup_warn2_a: 'Mnemonic ',
    backup_warn2_b: 'leaked',
    backup_warn2_c: ' = funds stolen, ',
    backup_warn2_d: 'no refund',
    backup_warn3: 'Never screenshot, photograph, or save to phone / PC / cloud / chat apps',
    backup_warn4: 'Never tell anyone — including "support", friends, or tech help',
    backup_warn5: 'Recommended: write 2 copies and store in different safe places',
    backup_check_a: 'I have written it on paper and stored safely. I understand once lost or leaked, ',
    backup_check_b: 'there is no recovery',
    backup_confirm_btn: '✅ I Have Backed Up',

    // import
    import_title: '📥 Import Wallet',
    import_sub: 'Enter mnemonic or private key to recover your wallet',
    import_seed_label: 'Mnemonic / Private Key',
    import_seed_ph: 'Enter 12 or 24 words separated by spaces\nor a WIF private key...',
    import_pwd_label: 'Set New Password',
    import_pwd_ph: 'Wallet access password...',
    import_btn: '📥 Import Wallet',

    // unlock
    unlock_title: 'Unlock Wallet',
    unlock_sub: 'Much Security. Very Safe. Wow.',
    unlock_pwd_label: 'Password',
    unlock_pwd_ph: 'Enter wallet password...',
    unlock_btn: '🔓 Unlock',
    unlock_reset_btn: '🔄 Reset Wallet',

    // wallet main
    wallet_balance_label: 'Total Balance',
    wallet_address_loading: 'Loading...',
    wallet_copy: 'Copy',
    wallet_copied: '✓ Copied',
    wallet_action_send: 'Send',
    wallet_action_receive: 'Receive',
    wallet_action_redpacket: 'Red Packet',
    wallet_action_refresh: 'Refresh',
    apps_title: 'Apps',
    wallet_tx_title: 'Transactions',
    wallet_claim_rp: '🧧 Claim',
    wallet_tx_empty_line1: '🐕 No transactions yet',
    wallet_tx_empty_line2: 'Such empty. Very quiet. Wow.',

    // send
    send_title: '📤 Send DOGE',
    send_sub: 'Much Send. Very Transaction. Wow.',
    send_to_label: 'Recipient Address',
    send_to_ph: 'Dogecoin address starting with D...',
    send_amount_label: 'Amount (DOGE)',
    send_fee_label: 'Network Fee (DOGE)',
    fee_low: 'Low',
    fee_mid: 'Standard',
    fee_high: 'High',
    fee_low_hint: 'Low traffic',
    fee_mid_hint: 'Recommended',
    fee_high_hint: 'Busy network',
    fee_custom_label: 'Custom',
    fee_custom_ph: 'Enter amount...',
    send_fee_tip: '💡 Pick the high tier when the network is busy. Too-low fees may leave the transaction unconfirmed for a long time. Recommended range: 0.1–1 DOGE.',
    send_balance_avail: 'Available:',
    send_btn: '🚀 Confirm Send',

    // receive
    recv_title: '📥 Receive DOGE',
    recv_sub: 'Share your address with the sender',
    recv_copy_btn: '📋 Copy Address',

    // red packet — send
    rp_send_title: 'Send DOGE Red Packet',
    rp_send_sub: 'Much Lucky. Very Wow. So Generous.',
    rp_amount_label: 'Total Amount (DOGE)',
    rp_count_label: 'Number of Packets',
    rp_count_3: '3',
    rp_count_5: '5',
    rp_count_8: '8',
    rp_count_10: '10',
    rp_greet_label: 'Greeting Message',
    rp_greet_ph: 'Happy DOGE day, much fortune!',
    rp_preview_default: 'Fill amount to preview split...',
    rp_create_btn: '🧧 Create Red Packet',

    // red packet — share
    rp_share_title: 'Red Packet Created!',
    rp_share_sub_tmpl: '5 packets · 10 DOGE total',
    rp_share_id_label: 'Packet ID',
    rp_share_slots_label: 'Random Split',
    rp_share_link_hint: 'Share this link with friends:',
    rp_share_link_loading: 'Generating...',
    rp_copy_link: '📋 Copy Link',
    rp_view_status: '📊 View Status',

    // red packet — claim
    rp_claim_from: 'Red Packet from a Friend',
    rp_claim_greet: 'Happy DOGE day, much fortune!',
    rp_claim_meta: '5/5 packets remaining',
    rp_result_label: 'Lucky pull!',
    rp_claim_id_label: 'Enter Packet ID',
    rp_claim_id_ph: 'Paste packet ID...',
    rp_load_btn: '🔍 Find Packet',
    rp_claim_btn: '🧧 Grab It!',

    // red packet — status
    rp_status_title: '🧧 Red Packet Status',

    // settings
    settings_title: '⚙️ Wallet Settings',
    settings_sub: 'Manage Your DOGE. Such Options. Wow.',
    auto_lock_label: 'Auto-lock',
    auto_lock_off: 'Lock on close',
    auto_lock_5m: '5 min',
    auto_lock_15m: '15 min',
    auto_lock_30m: '30 min',
    auto_lock_60m: '60 min',
    hot_wallet_title: '⚠️ Security · This is a Hot Wallet',
    hot_wallet_intro: 'This wallet is best for <strong>small daily transactions</strong>.',
    hot_wallet_tip1: 'Larger funds → choose "Lock on close" and enter password each time',
    hot_wallet_tip2: 'Small daily use → longer auto-lock OK (5–60 min)',
    hot_wallet_tip3: 'For significant holdings, use a <strong>hardware wallet</strong> or exchange',
    settings_export_key: '🔑 Export Private Key',
    settings_show_seed: '🌱 View Mnemonic',
    settings_export_seed: '📦 Export Encrypted Backup',
    settings_lock: '🔒 Lock Wallet',
    settings_reset: '⚠️ Reset Wallet',
    settings_footer_l1: 'DOGE Wallet v1.0.2',
    settings_footer_l2: 'Much Open Source. Very Trustworthy. Wow. 🐕',

    // ── Dialogs / Toasts ──
    confirm_show_seed: '⚠️ About to display mnemonic!\n\nMake sure no one is watching. Never screenshot!',
    confirm_export_key: '⚠️ Private key is highly sensitive! Continue?\n\nNever share it with anyone!',
    confirm_reset_strong: '⚠️ Danger!\n\nReset will delete all data.\nMake sure you have backed up the mnemonic!\n\nConfirm reset?',
    confirm_reset_unlock: '⚠️ Reset the wallet?\n\nAll data will be deleted. Make sure the mnemonic is backed up!',
    confirm_backup_final: '⚠️ Final confirmation\n\nHave you written down all 12 words on paper and stored them safely?\n\nAfter confirming, this page closes. You can view it again later via Settings → View Mnemonic.',
    confirm_export_enc: '⚠️ Encrypted Mnemonic Export\n\nRisks:\n• Online devices may be hacked, hit by ransomware, or leak via cloud sync\n• Even with password encryption, weak passwords can be brute-forced\n• Safest option is paper backup, kept offline\n\nNext step: enter your wallet password to encrypt.\nContinue?',
    prompt_export_pwd: 'Enter wallet password (used to encrypt the export):',

    toast_pwd_min8: '⚠️ Password must be at least 8 characters',
    toast_pwd_mismatch: '❌ Passwords do not match',
    toast_creating: '🔄 Creating wallet...',
    toast_create_fail: '❌ Creation failed: ',
    toast_create_success: '🎉 Wallet created! Much Wow!',
    toast_need_seed: '⚠️ Please enter a mnemonic or private key',
    toast_importing: '🔄 Importing...',
    toast_import_success: '✅ Wallet imported!',
    toast_need_pwd: '⚠️ Please enter your password',
    toast_unlocking: '🔄 Unlocking...',
    toast_unlocked: '🔓 Unlocked! Such Security. Wow.',
    toast_reset_done: '🔄 Wallet reset',
    toast_need_addr_amt: '⚠️ Please fill in address and amount',
    toast_sending: '🔄 Sending...',
    toast_send_success: '🚀 Sent! Much Transaction. Wow!',
    toast_refreshing: '🔄 Refreshing...',
    toast_refresh_ok: '✅ Refreshed!',
    toast_network_issue: '⚠️ Network issue, please retry later',
    toast_copy_fail: '❌ Copy failed',
    toast_addr_copied: '📋 Address copied!',
    toast_wif_copied: '🔑 WIF key copied to clipboard (clear it ASAP)',
    toast_locked_first: '❌ Wallet is locked, please unlock first',
    toast_pwd_wrong: '❌ Wrong password',
    toast_export_done: '✅ Encrypted backup saved, keep it safe',
    toast_lock_done: '🔒 Wallet locked',

    tx_recv_label: 'Received',
    tx_send_label: 'Sent',

    // ── Red packet (dynamic) ──
    rp_min_warn: '⚠️ Minimum 0.01 DOGE per slot. Increase amount or reduce count.',
    rp_preview_tmpl: '🎲 Preview {count} packets: min {min} DOGE, max {max} DOGE (random)',
    rp_share_sub_tmpl_dyn: '{count} packets · {total} DOGE total',
    rp_share_text_tmpl: 'DOGE Red Packet ID: {id}  |  Enter this ID in the DOGE Wallet extension to claim',
    rp_claim_from_tmpl: 'Red Packet from {sender}',
    rp_claim_meta_tmpl: '{remain}/{total} remaining · {amount} DOGE total',
    rp_progress_label: 'Progress:',
    rp_claimed_word: 'claimed',
    rp_total_label: 'Total:',
    rp_fully_claimed: '✅ All claimed',
    rp_expired: '⏰ Expired',
    rp_claimed_short: 'Claimed',
    rp_waiting: 'Waiting...',
    rp_claimed_tag: '✓ Taken',
    rp_open_tag: 'Open',
    rp_slot_claimed: 'Taken',
    rp_slot_open: 'Open',

    rp_toast_locked: '❌ Please unlock wallet first',
    rp_toast_need_amount: '⚠️ Please enter the packet amount',
    rp_toast_insufficient_tmpl: '❌ Insufficient balance (balance: {bal} DOGE)',
    rp_toast_creating: '🔄 Creating...',
    rp_toast_create_success: '🧧 Red Packet created! Much Lucky!',
    rp_toast_link_copied: '📋 Link copied!',
    rp_toast_need_id: '⚠️ Please enter the packet ID',
    rp_toast_searching: '🔍 Searching...',
    rp_toast_taken_all: '😢 All packets have been claimed',
    rp_toast_expired: '⏰ This packet has expired',
    rp_toast_already_claimed: '🐕 You have already claimed this packet',
    rp_toast_found_tmpl: '✅ Found! {remain}/{total} packets remaining',
    rp_toast_claiming: '🔄 Claiming...',
    rp_toast_grab_success_tmpl: '🎉 Grabbed {amount} DOGE! Much Lucky!',
  },
};


let currentLang = 'zh';

function detectLang() {
  try {
    const saved = localStorage.getItem('doge_lang');
    if (saved && I18N[saved]) return saved;
  } catch (e) {}
  const nav = (navigator.language || 'zh').toLowerCase();
  return nav.startsWith('zh') ? 'zh' : 'en';
}

function applyI18n(root) {
  root = root || document;
  const dict = I18N[currentLang] || I18N.zh;

  root.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const v = dict[key];
    if (v === undefined) return;
    // Dict values may contain inline HTML (e.g. <strong>) — render as HTML if detected.
    if (typeof v === 'string' && v.indexOf('<') !== -1) el.innerHTML = v;
    else el.textContent = v;
  });
  root.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const key = el.getAttribute('data-i18n-ph');
    if (dict[key] !== undefined) el.setAttribute('placeholder', dict[key]);
  });
  root.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    if (dict[key] !== undefined) el.setAttribute('title', dict[key]);
  });
}

function setLang(lang) {
  if (!I18N[lang]) return;
  currentLang = lang;
  try { localStorage.setItem('doge_lang', lang); } catch (e) {}
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  applyI18n();
  const btn = document.getElementById('langBtn');
  if (btn) btn.textContent = lang === 'zh' ? 'EN' : '中';
}

function toggleLang() {
  setLang(currentLang === 'zh' ? 'en' : 'zh');
}

function t(key, fallback) {
  const dict = I18N[currentLang] || I18N.zh;
  return dict[key] !== undefined ? dict[key] : (fallback !== undefined ? fallback : key);
}

function initI18n() {
  currentLang = detectLang();
  setLang(currentLang);
}

function tt(key, params) {
  let s = t(key);
  if (params) for (const k in params) s = s.split('{' + k + '}').join(params[k]);
  return s;
}

window.I18n = { setLang, toggleLang, t, tt, initI18n, applyI18n, getLang: () => currentLang };
