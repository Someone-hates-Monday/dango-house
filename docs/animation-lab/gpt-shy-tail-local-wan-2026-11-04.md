# GPT 害羞收尾 · 本地 Wan 双形态实验（2026-11-04）

用户授权本地实验；**未**替换 `public/` 生产素材，**未**充值云端，**未**推送。

## Codex vs 本会话（能力对照）

| | Cursor 本会话 | Codex（就仓库与既有交接） |
| --- | --- | --- |
| 直接即梦 API／MCP | 无 | 无（同样靠网页或本机） |
| 本地 Wan TI2V | 可跑 `.animation-lab` 已锁环境 | 同机同脚本也可跑 |
| 浏览器半自动即梦 | 有 computer-use，历史上传易超时 | 曾做过网页试片，非无人值守 |
| 本次选择 | **本地 Wan**，免积分 | — |

## 场景

`shy-tail-curl-recover`：轻害羞表情 + 同一条西方龙尾自根部驱动向近腿收拢，短停后展开恢复。规则对齐 `character-consistency.json#gpt.tailBodyLanguage.shy`。

## 产出

| 形态 | 首帧锚 | 目录 | 耗时 | 峰值显存 |
| --- | --- | --- | --- | --- |
| Q | `public/community/gpt/idle.webp` | `test-results/animation-lab/gpt/wan-shy-tail-q/` | ~94s | 见 generation.json |
| CG | `public/portraits/gpt.jpg` | `test-results/animation-lab/gpt/wan-shy-tail-cg/` | ~79s | 见 generation.json |

**纠错（同日）**：本轮**不是**文档所述增强后的 Wan2.2 I2V A14B FP8（Comfy 双专家）。实际加载的是旧试验脚本默认的 **Wan2.2-TI2V-5B**（`.animation-lab/models/Wan2.2-TI2V-5B`），49 帧、28 步、512²、绿幕。14B FP8 权重在 `.animation-lab/ComfyUI/models/diffusion_models/wan2.2_i2v_*_14B_fp8_scaled*`，本轮未走 Comfy。效果离谱应优先归因于**错用 5B TI2V**，不能用来否定 14B 路线。脚本：`scripts/animation-lab/wan-gpt-tail-trial.py`（待改为 14B／Comfy 或明确标注 5B）。

## 目检（非艺术验收通过）

- **Q**：身份大体可认；中段有轻微晃动／比例漂移风险；尾部有位移但「收拢→停→展开」是否清晰需播 `raw.mp4` 再定，不能凭单帧宣称达标。
- **CG**：成年体更接近立绘；绿幕渗进裙／饰的绿色污染明显；小云团道具偶发；尾形有变化但结构连续性未逐帧验收。
- 两条均 **draft / not-run 艺术关**，禁止入库与自动播放。

## 复现（错误的 5B 路径，仅作对照）

```powershell
.animation-lab\venv\Scripts\python.exe scripts\animation-lab\wan-gpt-tail-trial.py --form q --frames 49 --steps 28 --seed 2411041
.animation-lab\venv\Scripts\python.exe scripts\animation-lab\wan-gpt-tail-trial.py --form cg --frames 49 --steps 28 --seed 2411042
```

## 14B FP8 重跑（正确路线）

ComfyUI `--disable-all-custom-nodes`，Wan2.2 I2V A14B high/low FP8，832×480，81 帧，16fps，24 步。

| 形态 | 目录 | 耗时 | seed |
| --- | --- | --- | --- |
| Q | `test-results/animation-lab/gpt/wan14b-shy-tail-q/` | ~949s | 2026110414 |
| CG | `test-results/animation-lab/gpt/wan14b-shy-tail-cg/` | ~907s（首次曾整图缓存假完成，已换 seed 强制重跑） | 2026110417 |

```powershell
.animation-lab\venv\Scripts\python.exe .animation-lab\ComfyUI\main.py --listen 127.0.0.1 --port 8188 --reserve-vram 2 --use-pytorch-cross-attention --disable-all-custom-nodes --disable-api-nodes
.animation-lab\venv\Scripts\python.exe scripts\animation-lab\prepare-gpt-shy-tail-refs.py
.animation-lab\venv\Scripts\python.exe scripts\animation-lab\generate-gpt-shy-tail-14b.py --form q --seed 2026110414
.animation-lab\venv\Scripts\python.exe scripts\animation-lab\generate-gpt-shy-tail-14b.py --form cg --seed 2026110417
```

仍为实验草稿，未批准入库。推理后应停掉 Comfy 释放显存。
