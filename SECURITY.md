# 安全报告 / Security policy

本项目为 Alpha，仅维护最新版本。不要在公开 Issue 中提交可用 Key、私人数据库或敏感利用细节。  
This project is in Alpha; only the latest version is maintained. Do not post live keys, private databases, or sensitive exploit details in public issues.

请发至 **2872397866@qq.com**，标题 `Dango House security`，包括版本、最小复现、影响和脱敏日志。若启用 GitHub 私有漏洞报告，也可使用该入口。不承诺固定修复时限或漏洞奖励。  
Email **2872397866@qq.com** with the subject `Dango House security`, version, minimal reproduction, impact, and redacted logs. Use GitHub private reporting if enabled. We cannot promise a fixed response time or bug bounty.

Key 泄露应先到服务商撤销换新。safeStorage 是本机系统保护，不能防御同一账户下的恶意程序。自定义端点会收到请求内容与对应 Key，只连接可信地址。  
Revoke and rotate leaked keys with the provider first. safeStorage is OS-backed local protection, not a defense against malware under the same account. Custom endpoints receive content and the associated key; connect only to trusted addresses.

Windows 便携包目前未代码签名。请从本仓库 Releases 下载并核对 SHA-256；校验和验证文件一致性，不等于第三方安全审计。  
Windows portable builds are currently unsigned. Download from this repository's Releases and check SHA-256; checksums verify consistency, not third-party security auditing.
