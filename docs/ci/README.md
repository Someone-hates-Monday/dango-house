# 自动检查 / Continuous integration

配置位于 [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)，在推送 main 和提交 PR 时使用 Windows / Node.js 22 检查发布文件、运行单元测试并构建。执行状态见 [Actions](https://github.com/Someone-hates-Monday/dango-house/actions/workflows/ci.yml)。  
The workflow runs publication checks, unit tests, and a build on Windows / Node.js 22 for main pushes and PRs. See Actions for execution status.

流程只读仓库，不运行真实 API 测试，不需要 Key。来自 Fork 的 PR 使用相同的 `pull_request` 检查，不使用带有写权限或密钥的 `pull_request_target`。窗口/动画的桌面交互仍需相应的本地检查。  
The workflow has read-only repository permissions, does not call live APIs, and needs no keys. Fork PRs use the same pull_request checks, without privileged pull_request_target execution. Window and animation interactions still require appropriate local desktop checks.
