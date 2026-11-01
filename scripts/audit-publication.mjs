// Read-only pre-publication audit. Prints paths/rule names, never matched secrets.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const files = execFileSync('git', ['ls-files', '-z'], {encoding:'utf8'}).split('\0').filter(Boolean);
const errors = [];
const secretRules = [
  ['OpenAI-style key', /\bsk-(?:proj-|ant-)?[A-Za-z0-9_-]{20,}/g],
  ['GitHub token', /\b(?:gh[pousr]_[A-Za-z0-9]{25,}|github_pat_[A-Za-z0-9_]{30,})/g],
  ['Private key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
  ['AWS access key', /\bAKIA[A-Z0-9]{16}\b/g],
  ['Google API key', /\bAIza[0-9A-Za-z_-]{30,}/g],
  ['Signed URL', /[?&](?:X-Amz-Signature|X-Goog-Signature|access_token|refresh_token)=[^&\s"'<>]+/gi],
];
let bytes=0;
for(const file of files){
  if(/^(?:node_modules|dist|dist-electron|release|test-results|\.animation-lab)\//.test(file)||/(?:^|\/)(?:credentials\.json|Local State|\.env[^/]*|.*\.sqlite(?:-.*)?)$/.test(file))errors.push(`${file}: private/generated file`);
  const data=fs.readFileSync(file);bytes+=data.length;
  if(data.length>=95*1024*1024)errors.push(`${file}: exceeds publication size budget`);
  if(/\.(?:png|jpe?g|webp|webm|ico|ttf|woff2?)$/i.test(file))continue;
  const text=data.toString('utf8');
  for(const [name,rule] of secretRules){rule.lastIndex=0;if(rule.test(text))errors.push(`${file}: ${name}`);}
}
// Validate links in maintained docs; historical experiment notes intentionally reference local-only trials.
const maintained=['README.md','CONTRIBUTING.md','CODE_OF_CONDUCT.md','SECURITY.md','THIRD_PARTY_NOTICES.md','CHANGELOG.md','docs/README.md','docs/PRIVACY.md','docs/ROADMAP.md','docs/PROJECT_NAME.md','docs/screenshots/README.md','docs/AGENT-WATCH-PARTY-PLAN.md','docs/AGENT-REFERENCES.md'];
for(const file of maintained){
  const text=fs.readFileSync(file,'utf8');
  for(const match of text.matchAll(/\]\(([^\s)]+)\)/g)){
    const target=match[1];if(/^(?:https?:|mailto:|#)/.test(target))continue;
    const local=target.split('#')[0];if(!fs.existsSync(path.resolve(path.dirname(file),local)))errors.push(`${file}: missing local link ${target}`);
  }
}
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}
else console.log(`PASS: ${files.length} indexed files, ${(bytes/1024/1024).toFixed(1)} MiB; no known secret patterns or excluded data; maintained local links resolve.`);
