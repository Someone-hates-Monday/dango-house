**Language / 语言 / 言語:** [简体中文](PRIVACY.zh-CN.md) · [English](PRIVACY.en.md) · [日本語](PRIVACY.ja.md) · [Index](PRIVACY.md)

# 隐私与数据 / Privacy & data

## 本地保存 / Local storage

聊天、关系、好感、家具、提醒、共同记忆和配置保存在 `%APPDATA%/Qiting`，包括 SQLite 文件。聊天数据库没有额外应用层加密。Key 使用 Electron safeStorage 的 Windows 系统保护单独加密保存，不写入聊天或公开仓库。  
Chats, relationships, affection, furniture, reminders, shared memories, and settings are stored under `%APPDATA%/Qiting`, including SQLite files. Chat databases have no extra application-level encryption. Keys are separately encrypted with Electron safeStorage and Windows OS protection, not stored in chats or the public repository.

## 何时联网 / Network use

离线演示不请求模型。测试连接及真实模型回复会请求选定端点并消耗额度，Key 作为认证发往对应端点。  
Offline demos make no model requests. Connection tests and live replies contact the selected endpoint, consume quota, and send the associated key as authentication.

请求包括对应频道最近最多 24 条消息、显式共同记忆、称呼与关系设置、必要的角色和小屋状态。私聊不混入群聊；显式共同记忆可用于多个频道。服务商保留数据的规则取决于其条款和账户设置。  
Requests include up to 24 recent messages from the relevant channel, explicit shared memories, relationship/address settings, and necessary character/room state. Private chats exclude group messages; shared memories can be used across channels. Provider retention depends on its terms and your account settings.

当前没有内置广告或产品分析遥测。开发脚本按明确命令下载素材或测试 API，不会随普通应用自动运行。  
There is no built-in advertising or product analytics telemetry. Developer scripts download assets or test APIs only when explicitly run, not during normal app use.

## 清理与报告 / Cleanup & reports

当前设置可保存或替换 Key，尚无单独删除按钮。要移除保存的 Key，可完全退出应用和托盘后删除数据目录内的 `credentials.json`（会移除所有已保存服务凭证）。备份应视为私密文件，不上传 Issue、公开云盘或 Git。删除整个数据目录会同时丢失聊天与设置，操作前自行备份。  
Settings currently save or replace keys, without a dedicated delete button. After quitting the app and tray process, delete `credentials.json` in the data directory to remove all saved provider credentials. Treat backups as private; never upload them to issues, public cloud folders, or Git. Deleting the entire data directory also loses chats and settings, so back up anything needed first.

截图和日志先脱敏，安全问题私下联系，见 [SECURITY.md](../SECURITY.md)。  
Redact screenshots and logs; report sensitive issues privately as described in the security policy.
