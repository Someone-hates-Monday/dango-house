import requests,json,hashlib,concurrent.futures,os,time,threading
from pathlib import Path
from urllib.parse import quote
root=Path(__file__).resolve().parents[2]
metadata=root/'.animation-lab/cg-modelscope.json'
if not metadata.exists():
 response=requests.get('https://modelscope.cn/api/v1/models/Comfy-Org/Wan_2.2_ComfyUI_Repackaged/repo/files?Recursive=true&Revision=594fe158780d7aa76539080fa06dce5e955fea53',timeout=30)
 response.raise_for_status();metadata.parent.mkdir(parents=True,exist_ok=True);metadata.write_text(json.dumps(response.json()),encoding='utf8')
files=json.loads(metadata.read_text(encoding='utf8'))['Data']['Files']
names=['wan2.2_i2v_high_noise_14B_fp8_scaled.safetensors','wan2.2_i2v_low_noise_14B_fp8_scaled.safetensors','umt5_xxl_fp8_e4m3fn_scaled.safetensors','wan_2.1_vae.safetensors']
files=[f for f in files if f['Path'].split('/')[-1] in names]; assert len(files)==4
expected={
 names[0]:'6122e79d55e0f235698d11d657f3b196c5273c830da00b2b013c5a048d5e6a42',
 names[1]:'5471a457b6ac404202a5fbe6c11595a3d5641fc766b00f38763f72303fffc21e',
 names[2]:'c3355d30191f1f066b26d93fba017ae9809dce6c627dda5f6a66eaa651204f68',
 names[3]:'2fc39d31359a4b0a64f55876d8ff7fa8d780956ae2cb13463b0223e15148976b',
}
assert all(f['Sha256']==expected[f['Path'].split('/')[-1]] for f in files),'unexpected upstream weights'
manifest=[]
def download(f):
 target=root/'.animation-lab/ComfyUI/models'/f['Path'].replace('split_files/','');target.parent.mkdir(parents=True,exist_ok=True)
 partial=target.with_suffix(target.suffix+'.partial'); checkpoint=target.with_suffix('.ranges.json'); lock=threading.Lock()
 url='https://modelscope.cn/api/v1/models/Comfy-Org/Wan_2.2_ComfyUI_Repackaged/repo?Revision='+f['Revision']+'&FilePath='+quote(f['Path'],safe='')
 if not target.exists():
  progress=json.loads(checkpoint.read_text()) if checkpoint.exists() else {'base':partial.stat().st_size if partial.exists() else 0,'done':[]}
  checkpoint.write_text(json.dumps(progress)); base=progress['base']; chunk=128*1024*1024
  spans=[(i,s,min(s+chunk,f['Size'])-1) for i,s in enumerate(range(base,f['Size'],chunk)) if i not in progress['done']]
  last=[time.time()]
  def part(span):
   i,start,end=span
   for attempt in range(5):
    try:
     r=requests.get(url,headers={'Range':f'bytes={start}-{end}'},stream=True,timeout=(30,100));r.raise_for_status()
     if r.status_code!=206:raise RuntimeError('range unsupported')
     position=start
     with partial.open('r+b' if partial.exists() else 'w+b') as o:
      o.seek(start)
      for c in r.iter_content(2*1024*1024):
       if position+len(c)>end+1:raise RuntimeError('range overflow')
       o.write(c);position+=len(c)
     if position!=end+1:raise RuntimeError('range incomplete')
     with lock:
      progress['done'].append(i);checkpoint.write_text(json.dumps(progress))
      if time.time()-last[0]>25:
       print(target.name,round((base+len(progress['done'])*chunk)/1e9,2),'/',round(f['Size']/1e9,2),'GB',flush=True);last[0]=time.time()
     return
    except Exception as e:
     if attempt==4:raise
     time.sleep(2*(attempt+1))
   raise RuntimeError('range retries exhausted')
  with concurrent.futures.ThreadPoolExecutor(max_workers=12) as p:list(p.map(part,spans))
  assert partial.stat().st_size==f['Size'];os.replace(partial,target)
 h=hashlib.sha256()
 with target.open('rb') as o:
  for c in iter(lambda:o.read(16*1024*1024),b''):h.update(c)
 assert h.hexdigest()==f['Sha256'],target.name+' hash mismatch'
 manifest.append({'name':target.name,'size':f['Size'],'sha256':h.hexdigest(),'revision':f['Revision'],'source':url})
 print('VERIFIED',target.name,flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as p:list(p.map(download,files))
(root/'test-results/cg-lab/model-manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf8')
