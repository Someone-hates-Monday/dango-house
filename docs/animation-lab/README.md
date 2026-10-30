# 本地动画试验（非发布素材）

2026-10-28，Windows / RTX 5090 Laptop 24GB / 64GB 内存。

## 范围

试验免费本地模型能否改善 AI 娘待机、转头和步态。生产程序 v0.3.0 没有替换为这些试片。浏览预览页不代表质量验收通过。

环境与模型放在项目 `.animation-lab/`，已加入 `.gitignore`，不会打进应用。运行库和模型均已实际下载，Wan 权重共约34.2GB，每个模型文件按 ModelScope 原仓库 SHA256 校验。代码固定版本和许可见 `sources.json`，模型校验见 `model-file-checksums.json`，Python 版本锁见 `../animation-lab-requirements-lock.txt`。

## 已完成试验

1. RIFE v4.6（ncnn Vulkan，NVIDIA GPU 1）。Claude/Grok 各有转头和跑步两段，分别120帧/30fps、32帧/48fps。黑白背景各推理一次以恢复透明通道，没有用透明度混合代替模型补帧。
2. Wan2.2 TI2V 5B，原生官方实现，Windows 使用 PyTorch 2.8 CUDA12.8 / SDPA。Claude 使用单张完整 CrossPet 角色图，生成81帧、512×512、24fps的待机和跑步试片。待机另外试验121帧、40步和更明确的单一转头指令。

## 质量判断

- **RIFE 四段均不采用。** 原图比例、姿态与步态不一致；补帧只增加时间上的密度，无法创造缺失的正确解剖结构。Claude 由宽头待机变成窄身侧脸尤其明显。用户也指出一致性和流畅度不合格，预览已撤下自动播放。
- **Wan 首轮两段不采用。** 人物宽高相对稳定，但待机没有完成明确左右转头，跑步没有做出实际交替迈腿。视频能解码、参数正确、帧数够，都不能视作动画质量合格。
- **Wan 第二轮转头也不采用。** 改为单一明确转头指令、121帧、40步、shift=3、seed=241029 后，出现脸部重复与变形。没有将原始样片自动展示，也没有继续给其他角色批量生成。当前试验未产出可替换正式动画的素材，不能称作已解决动画一致性或流畅度。
- 后续样片必须单独检查人物比例、脸/发饰/服装一致性、动作是否执行、脚步与地面接触、头发/耳朵/脚的完整边界及循环接缝。预览服务只有 `approved: true` 才能展示新视频，生成结束不会自动发布。

## 文件和复现

样片和原始帧保留在 `test-results/animation-lab/`；各次 Wan 提示词、参数、seed、耗时和显存占用在对应 `generation.json`。不覆盖前一轮样片。

```powershell
# 已配置环境下重新试验，先检查输出，不直接替换 public 素材
.animation-lab/venv/Scripts/python.exe scripts/animation-lab/prepare-frames.py
.animation-lab/venv/Scripts/python.exe scripts/animation-lab/rife-trial.py
.animation-lab/venv/Scripts/python.exe scripts/animation-lab/encode-trials.py
.animation-lab/venv/Scripts/python.exe scripts/animation-lab/wan-trial.py --action look --take 2 --frames 121 --steps 40 --seed 241029
.animation-lab/venv/Scripts/python.exe scripts/animation-lab/audit-wan.py look --take 2
node scripts/animation-lab/preview-server.mjs
```

原角色和美术的署名及非商业限制继续适用，开源推理代码或生成结果不免除原素材许可。未使用 Runway 付费视频，没有购买套餐或调用收费视频 API。

## 后续技术判断

这次不再以“增加帧数”作为解决质量问题的依据。要稳定控制转头、摸头、站起和步态，需要同一设计下的可靠关键姿势，或分层美术与可编辑的网格/骨骼绑定。2026-10-28 也核查了 [Bunraku](https://github.com/SparcAI-Inc/Bunraku)：论文和展示已公开，但代码仓库当时仅有 readme，未取得可直接运行的训练权重，不能称作已经接入的自动 Live2D 方案。
