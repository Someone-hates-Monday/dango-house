import { app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage, globalShortcut, safeStorage } from 'electron';
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { GardenEngine } from './engine';
import { generateReply, requestText } from './provider';
import { restoreState } from '../src/shared/director';
import { providers } from '../src/shared/characters';
import { ids } from '../src/shared/director';
import type { CharacterId } from '../src/shared/types';
import type { Action, AppState } from '../src/shared/types';

if (!app.isPackaged && process.env.GARDEN_TEST_DATA) app.setPath('userData', process.env.GARDEN_TEST_DATA);
app.setName('Qiting');
const single = app.requestSingleInstanceLock();
if (!single) app.quit();
let mainWindow: BrowserWindow;
let tray: Tray;
let quitting = false;
let database: DatabaseSync;
let engine: GardenEngine;
let saveTimer: ReturnType<typeof setTimeout>;
const overlays = new Map<number, BrowserWindow>();
const privateWindows = new Map<CharacterId,BrowserWindow>();
let keys: Record<string, string> = {};
let lastRevision = -1;

const root = app.getAppPath();
const renderer = path.join(root, 'dist/index.html');
const preload = path.join(__dirname, 'preload.cjs');
const load = (win: BrowserWindow, view: string, display?: number, character?:CharacterId) => {
  const query = new URLSearchParams({ view, ...(character?{character}:{}), ...(display === undefined ? {} : { display: String(display), primary: String(screen.getPrimaryDisplay().id === display) }) });
  if (process.env.VITE_DEV_SERVER_URL && !app.isPackaged) void win.loadURL(`${process.env.VITE_DEV_SERVER_URL}/?${query}`);
  else void win.loadFile(renderer, { search: query.toString() });
};
function secure(win: BrowserWindow) {
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', event => event.preventDefault());
}
function persist() {
  if (!engine || !database) return;
  const snapshot = { ...engine.state, busy: false };
  database.prepare('INSERT INTO state (id, data) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET data=excluded.data').run(JSON.stringify(snapshot));
}
function broadcast(state: AppState) {
  for (const win of BrowserWindow.getAllWindows()) if (!win.isDestroyed()) win.webContents.send('garden:update', state);
  if (state.revision !== lastRevision) {
    lastRevision = state.revision;
    for (const overlay of overlays.values()) { if (state.settings.petsVisible) { if (!overlay.isVisible()) overlay.showInactive(); } else overlay.hide(); }
  }
  clearTimeout(saveTimer); saveTimer = setTimeout(persist, 300);
}
function showChat() { if (mainWindow.isMinimized()) mainWindow.restore(); mainWindow.show(); mainWindow.focus(); }
function openPrivate(id:CharacterId){if(!ids.includes(id))return;void engine.dispatch({type:'private-open',id});const existing=privateWindows.get(id);if(existing&&!existing.isDestroyed()){existing.show();existing.focus();return;}const work=screen.getPrimaryDisplay().workArea;const win=new BrowserWindow({width:470,height:650,minWidth:400,minHeight:480,x:work.x+work.width-490,y:work.y+Math.max(10,work.height-690),frame:false,title:'团子小屋 · 专属聊天',backgroundColor:'#fff8fc',webPreferences:{preload,contextIsolation:true,nodeIntegration:false,sandbox:true}});secure(win);privateWindows.set(id,win);load(win,'private',undefined,id);win.on('closed',()=>privateWindows.delete(id));}
function createOverlay(displayId: number) {
  const display = screen.getAllDisplays().find(d => d.id === displayId); if (!display) return;
  const win = new BrowserWindow({ ...display.workArea, frame: false, transparent: true, backgroundColor: '#00000000', hasShadow: false, resizable: false, skipTaskbar: true, focusable: false, alwaysOnTop: true, show: false, webPreferences: { preload, contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: true } });
  overlays.set(display.id, win); secure(win); win.setIgnoreMouseEvents(true, { forward: true });
  load(win, 'pets', display.id);
  win.once('ready-to-show', () => { if (engine.state.settings.petsVisible) win.showInactive(); });
  win.on('closed', () => overlays.delete(display.id));
}
async function getKey(provider: string) {
  if (!keys[provider]) return '';
  try { return (await safeStorage.decryptStringAsync(Buffer.from(keys[provider], 'base64'))).result; }
  catch { throw new Error('无法解密本机保存的凭证，请在连接设置重新保存。'); }
}
function known(sender: Electron.WebContents) { return BrowserWindow.getAllWindows().some(win => win.webContents === sender); }

if (single) app.whenReady().then(() => {
  fs.mkdirSync(app.getPath('userData'), { recursive: true });
  database = new DatabaseSync(path.join(app.getPath('userData'), 'garden.sqlite'));
  database.exec('PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS state (id INTEGER PRIMARY KEY, data TEXT NOT NULL)');
  const saved = database.prepare('SELECT data FROM state WHERE id=1').get() as { data?: string } | undefined;
  let restored: AppState | undefined;
  try { restored = restoreState(saved?.data ? JSON.parse(saved.data) : null); } catch { restored = restoreState(null); }
  try { keys = JSON.parse(fs.readFileSync(path.join(app.getPath('userData'), 'credentials.json'), 'utf8')); } catch { keys = {}; }
  engine = new GardenEngine(restored, broadcast, async (state, id, text, signal, update, act) => generateReply(state, id, text, await getKey(state.settings.provider), signal, update, act));
  for(const [index,id]of ids.entries()){const p=engine.state.pets[id];if(!p||!screen.getAllDisplays().some(d=>d.id===p.displayId))engine.state.pets[id]={x:.08+index*.13,y:.96,displayId:screen.getPrimaryDisplay().id};}
  mainWindow = new BrowserWindow({ width: 1280, height: 860, minWidth: 1000, minHeight: 700, frame: false, backgroundColor: '#f7f5f0', title: '团子小屋 · 桌面伙伴', show: false, webPreferences: { preload, contextIsolation: true, nodeIntegration: false, sandbox: true } });
  secure(mainWindow); load(mainWindow, 'chat');
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('close', event => { if (!quitting) { event.preventDefault(); mainWindow.hide(); } });
  for (const display of screen.getAllDisplays()) createOverlay(display.id);
  screen.on('display-added', (_event, display) => createOverlay(display.id));
  screen.on('display-removed', (_event, display) => overlays.get(display.id)?.close());
  screen.on('display-metrics-changed', (_event, display) => overlays.get(display.id)?.setBounds(display.workArea));
  const icon = nativeImage.createFromPath(path.join(root, 'dist/icon.png'));
  tray = new Tray(icon); tray.setToolTip('团子小屋 · 伙伴们在等你');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: '打开庭院', click: showChat },
    { label: '显示 / 隐藏桌宠', click: () => void engine.dispatch({ type: 'settings', patch: { petsVisible: !engine.state.settings.petsVisible } }) },
    { label: '切换任务栏停靠 / 自由桌宠', click: () => void engine.dispatch({type:'presentation',patch:{desktopMode:engine.state.presentation.desktopMode==='dock'?'free':'dock'}}) },
    { label: '免打扰 开 / 关', click: () => void engine.dispatch({ type: 'settings', patch: { dnd: !engine.state.settings.dnd } }) },
    { type: 'separator' }, { label: '退出团子小屋', click: () => { quitting = true; app.quit(); } },
  ]));
  tray.on('double-click', showChat);
  globalShortcut.register('CommandOrControl+Shift+G', () => void engine.dispatch({ type: 'settings', patch: { petsVisible: !engine.state.settings.petsVisible } }));
  ipcMain.handle('garden:state', event => { if (!known(event.sender)) throw new Error('无效窗口'); return engine.state; });
  ipcMain.handle('garden:action', (event, action: Action) => {
    if (!known(event.sender)) throw new Error('无效窗口');
    // The handler returns immediately; the engine owns cancellable turn execution.
    void engine.dispatch(action).catch(() => engine.add('system', '操作没有完成，请重试。', 'error'));
  });
  ipcMain.on('garden:window', (event, command: string) => {
    if (!known(event.sender)) return;
    if (command === 'show-chat') showChat();
    const sender=BrowserWindow.fromWebContents(event.sender);
    if (command === 'minimize') sender?.minimize();
    if (command === 'close') {if(sender===mainWindow)mainWindow.hide();else sender?.close();}
    if (command === 'quit') { quitting = true; app.quit(); }
  });
  ipcMain.on('garden:private',(event,id:CharacterId)=>{if(known(event.sender))openPrivate(id);});
  ipcMain.on('garden:hit', (event, interactive: boolean) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (typeof interactive === 'boolean' && window && [...overlays.values()].includes(window)) window.setIgnoreMouseEvents(!interactive, { forward: true });
  });
  ipcMain.handle('garden:key', async (event, provider: string, key: string) => {
    if (event.sender !== mainWindow.webContents || !providers.some(p => p.id === provider) || typeof key !== 'string' || key.length > 4096) throw new Error('凭证输入无效');
    if (!key.trim()) delete keys[provider];
    else { if (!(await safeStorage.isAsyncEncryptionAvailable())) throw new Error('系统凭证保护暂不可用，未保存。'); keys[provider] = (await safeStorage.encryptStringAsync(key.trim())).toString('base64'); }
    const target = path.join(app.getPath('userData'), 'credentials.json'); fs.writeFileSync(`${target}.tmp`, JSON.stringify(keys)); fs.renameSync(`${target}.tmp`, target);
  });
  ipcMain.handle('garden:keys', event => { if (event.sender !== mainWindow.webContents) return []; return Object.keys(keys); });
  ipcMain.handle('garden:test', async (event, provider: string, model: string, endpoint?:string) => {
    if (event.sender !== mainWindow.webContents || typeof model !== 'string' || model.length > 120 || !providers.some(p => p.id === provider)) throw new Error('连接参数无效');
    try { const result = await requestText(provider, model, await getKey(provider), '请仅回复：连接成功', [{ role: 'user', content: '你好' }], new AbortController().signal, () => {},{endpoint:typeof endpoint==='string'?endpoint:undefined}); if (!result.trim()) throw new Error('没有返回文字'); return '连接成功，模型已返回文字。'; }
    catch (error) { throw new Error(error instanceof Error ? error.message : '连接失败'); }
  });
  setInterval(() => engine.tick(), 150);
  engine.tick();
  app.on('second-instance', showChat);
}).catch(error => { console.error('团子小屋启动失败：', error); app.exit(1); });

app.on('window-all-closed', () => {});
app.on('before-quit', () => { quitting = true; if (engine) { engine.stop(); clearTimeout(saveTimer); persist(); } globalShortcut.unregisterAll(); });
