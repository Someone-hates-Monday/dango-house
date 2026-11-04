import json,time,shutil,requests
from pathlib import Path
root=Path(__file__).resolve().parents[2];out=root/'test-results/cg-lab/rin-xia-v1';comfy=root/'.animation-lab/ComfyUI';base='http://127.0.0.1:8188'
print('Waiting for all four verified 14B assets',flush=True)
while not (root/'test-results/cg-lab/model-manifest.json').exists():time.sleep(5)
shutil.copy2(out/'reference.png',comfy/'input/dango-rin-xia-v1.png')
positive='A high quality anime visual novel cinematic shot of two adult women seated close together on a sofa in warm sunset light. Preserve the exact two characters, their faces, individual clothing, hair ornaments and book from the reference image. The orange-haired woman on the RIGHT gently smooths one small strand of the blue-haired woman\'s hair near her maid headband with the hand already raised in the reference. The blue-haired woman on the LEFT tilts her head very slightly toward her companion, softly blinks and smiles with affection. The orange-haired woman blushes slightly and smiles back. Their heads remain separate; their hands do not merge. Very subtle breathing and soft movement in hair tips. Other hands stay on their own laps. A tender, wholesome, shy affectionate moment. Locked camera and unchanged composition, a single continuous shot, no zoom, no scene change. Detailed clean anime illustration, stable costumes, faces and proportions.'
negative='extra people, duplicated faces, merged faces, face morphing, crossed eyes, changed hair colors, changing costumes, extra arms, extra hands, fused fingers, distorted hands, missing fingers, additional ornaments, giant motion, jumping, sudden head turn, talking mouth, shaking camera, zoom, pan, scene cut, frame flicker, text, captions, watermark, logo, nudity'
def node(kind,**inputs):return {'class_type':kind,'inputs':inputs}
g={
'1':node('UNETLoader',unet_name='wan2.2_i2v_high_noise_14B_fp8_scaled.safetensors',weight_dtype='default'),
'2':node('UNETLoader',unet_name='wan2.2_i2v_low_noise_14B_fp8_scaled.safetensors',weight_dtype='default'),
'3':node('ModelSamplingSD3',model=['1',0],shift=8.0),
'4':node('ModelSamplingSD3',model=['2',0],shift=8.0),
'5':node('CLIPLoader',clip_name='umt5_xxl_fp8_e4m3fn_scaled.safetensors',type='wan',device='default'),
'6':node('VAELoader',vae_name='wan_2.1_vae.safetensors'),
'7':node('LoadImage',image='dango-rin-xia-v1.png'),
'8':node('CLIPTextEncode',clip=['5',0],text=positive),
'9':node('CLIPTextEncode',clip=['5',0],text=negative),
'10':node('WanImageToVideo',positive=['8',0],negative=['9',0],vae=['6',0],width=832,height=480,length=81,batch_size=1,start_image=['7',0]),
'11':node('KSamplerAdvanced',model=['3',0],add_noise='enable',noise_seed=2026110401,steps=24,cfg=3.5,sampler_name='euler',scheduler='simple',positive=['10',0],negative=['10',1],latent_image=['10',2],start_at_step=0,end_at_step=12,return_with_leftover_noise='enable'),
'12':node('KSamplerAdvanced',model=['4',0],add_noise='disable',noise_seed=0,steps=24,cfg=3.5,sampler_name='euler',scheduler='simple',positive=['10',0],negative=['10',1],latent_image=['11',0],start_at_step=12,end_at_step=24,return_with_leftover_noise='disable'),
'13':node('VAEDecode',samples=['12',0],vae=['6',0]),
'14':node('CreateVideo',images=['13',0],fps=16.0),
'15':node('SaveVideo',video=['14',0],filename_prefix='cg/dango-rin-xia-v1',format='mp4',codec='h264')}
(out/'workflow-api.json').write_text(json.dumps(g,indent=2),encoding='utf8')
start=time.time();r=requests.post(base+'/prompt',json={'prompt':g,'client_id':'dango-cg-local'},timeout=30)
if not r.ok:raise RuntimeError(r.text)
pid=r.json()['prompt_id'];print('QUEUED',pid,flush=True)
(out/'generation.json').write_text(json.dumps({'status':'running','prompt_id':pid,'model':'Wan2.2 I2V A14B high/low FP8 scaled','comfy_version':'v0.3.75','seed':2026110401,'width':832,'height':480,'frames':81,'steps':24,'fps':16,'positive':positive,'negative':negative,'local_inference':True,'reference_source':'built-in imagegen using existing portraits','approved':False},indent=2),encoding='utf8')
while True:
 history=requests.get(base+'/history/'+pid,timeout=30).json().get(pid)
 if history:
  (out/'comfy-history.json').write_text(json.dumps(history,indent=2),encoding='utf8')
  if history.get('status',{}).get('status_str')=='error':raise RuntimeError('Comfy execution failed; see local history')
  outputs=history.get('outputs',{})
  assets=[]
  for v in outputs.values():
   for kind in ('images','videos','gifs'):
    assets.extend(x for x in v.get(kind,[]) if x.get('filename','').endswith(('.mp4','.webm')))
  if assets:
   item=assets[0];source=comfy/'output'/item.get('subfolder','')/item['filename'];shutil.copy2(source,out/'raw.mp4')
   record=json.loads((out/'generation.json').read_text());record.update(status='generated_pending_visual_review',seconds=round(time.time()-start,2));(out/'generation.json').write_text(json.dumps(record,indent=2),encoding='utf8');print('DONE',out/'raw.mp4',flush=True);break
 time.sleep(5)
