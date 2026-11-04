import fs from 'node:fs';
import path from 'node:path';
import {
  BRIDGE_DEFAULT_PORT,
  newBridgeToken,
  type BridgeFile,
} from '../../src/shared/bridge';

export type BridgeFilePatch = Partial<Pick<BridgeFile, 'enabled' | 'port'>> & { rotateToken?: boolean };

export function bridgeFilePath(userData: string) {
  return path.join(userData, 'bridge.json');
}

export function readBridgeFile(userData: string): BridgeFile {
  const file = bridgeFilePath(userData);
  try {
    const raw = JSON.parse(fs.readFileSync(file, 'utf8')) as Partial<BridgeFile>;
    if (raw && raw.version === 1 && typeof raw.token === 'string' && Number.isFinite(raw.port)) {
      return {
        version: 1,
        enabled: !!raw.enabled,
        host: '127.0.0.1',
        port: Math.max(1024, Math.min(65535, Number(raw.port) || BRIDGE_DEFAULT_PORT)),
        token: raw.token,
        updatedAt: Number(raw.updatedAt) || Date.now(),
      };
    }
  } catch {
    /* create below */
  }
  return {
    version: 1,
    enabled: false,
    host: '127.0.0.1',
    port: BRIDGE_DEFAULT_PORT,
    token: newBridgeToken(),
    updatedAt: Date.now(),
  };
}

export function applyBridgePatch(userData: string, patch: BridgeFilePatch): BridgeFile {
  const current = readBridgeFile(userData);
  const next: BridgeFile = {
    version: 1,
    enabled: typeof patch.enabled === 'boolean' ? patch.enabled : current.enabled,
    host: '127.0.0.1',
    port: Number.isFinite(patch.port)
      ? Math.max(1024, Math.min(65535, Math.floor(Number(patch.port))))
      : current.port,
    token: patch.rotateToken ? newBridgeToken() : current.token,
    updatedAt: Date.now(),
  };
  const file = bridgeFilePath(userData);
  fs.writeFileSync(`${file}.tmp`, JSON.stringify(next, null, 2));
  fs.renameSync(`${file}.tmp`, file);
  return next;
}
