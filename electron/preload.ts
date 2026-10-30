import { contextBridge, ipcRenderer } from 'electron';
import type { DesktopBridge } from '../src/shared/types';
const bridge: DesktopBridge = {
  getState: () => ipcRenderer.invoke('garden:state'),
  dispatch: action => ipcRenderer.invoke('garden:action', action),
  subscribe: callback => { const listener = (_event: unknown, state: any) => callback(state); ipcRenderer.on('garden:update', listener); return () => ipcRenderer.removeListener('garden:update', listener); },
  window: command => ipcRenderer.send('garden:window', command),
  hitTest: interactive => ipcRenderer.send('garden:hit', interactive),
  openPrivate: id => ipcRenderer.send('garden:private', id),
  saveKey: (provider, key) => ipcRenderer.invoke('garden:key', provider, key),
  keyStatus: () => ipcRenderer.invoke('garden:keys'),
  testConnection: (provider, model, endpoint) => ipcRenderer.invoke('garden:test', provider, model, endpoint),
};
contextBridge.exposeInMainWorld('garden', bridge);
