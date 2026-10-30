// Only reviewed production assets belong here; lab drafts are never auto-loaded.
export const patVideos:Readonly<Record<string,string>>={
  gpt:'./video/gpt/pat-pixverse-p1.webm',
  gemini:'./video/gemini/pat-doubao-a1.webm',
  glm:'./video/glm/pat-doubao-a1.webm',
};

export const idleVideos:Readonly<Record<string,string>>=Object.fromEntries(
  ['gpt','gemini','glm','kimi','grok'].map(file=>[file,'./video/'+file+'/idle-jimeng-v1.webm']),
);
