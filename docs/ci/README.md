# 自动检查模板 / CI template

[`windows-checks.yml`](windows-checks.yml) 提供 Windows / Node.js 22 的发布文件检查、单元测试与构建流程。**当前仅为模板，未在 GitHub 自动启用。** 首次上传所用 OAuth 凭证没有 `workflow` 权限，因此将模板保留在文档目录。  
The template provides Windows / Node.js 22 publication checks, unit tests, and builds. **It is not currently active on GitHub.** The OAuth credential used for the initial upload lacked the `workflow` scope, so the configuration is stored here.

有相应仓库权限后，可用 GitHub 网页创建 `.github/workflows/ci.yml` 并放入该内容，或由具有 `workflow` 权限的 Git 凭证提交。模板未包含真实 API 测试，不需要服务商密钥。  
To enable it, create `.github/workflows/ci.yml` in the GitHub web editor with this content, or commit using a credential with workflow permission. It does not run live API tests or require provider secrets.
