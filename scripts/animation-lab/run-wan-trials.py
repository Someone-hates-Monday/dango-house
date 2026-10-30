from pathlib import Path
import subprocess,sys,time,json
root=Path(__file__).resolve().parents[2]
manifest=root/'.animation-lab/models/Wan2.2-TI2V-5B/download-manifest.json'
status=root/'test-results/animation-lab/claude/wan-look/preview-status.json';status.parent.mkdir(parents=True,exist_ok=True)
status.write_text(json.dumps({'message':'Wan 本地运行环境已就绪，正在完成模型权重下载与 SHA256 校验。'},ensure_ascii=False),encoding='utf8')
print('Waiting for verified model files',flush=True)
while not manifest.exists():time.sleep(3)
for action in ['look','walk']:
 status.write_text(json.dumps({'message':f'Wan 正在本机显卡生成 Claude {action} 样片。'},ensure_ascii=False),encoding='utf8')
 result=subprocess.run([sys.executable,str(root/'scripts/animation-lab/wan-trial.py'),'--action',action,'--frames','81','--steps','30'])
 if result.returncode:
  status.write_text(json.dumps({'message':f'Wan {action} 首次试跑遇到错误，正在检查日志。'},ensure_ascii=False),encoding='utf8');sys.exit(result.returncode)
 status.write_text(json.dumps({'message':f'Claude {action} 原始样片已生成，待检查背景、步态和循环接缝。','approved':False},ensure_ascii=False),encoding='utf8')
print('Both local Wan trials generated.',flush=True)
