import fs from 'fs-extra';
import path from 'path';

export function sanitizeFilename(name) {
  return name.replace(/[^a-z0-9_.-]/gi, '_').toLowerCase();
}

export function ensureFolders() {
  fs.ensureDirSync(path.resolve(process.cwd(), 'database/backups'));
  fs.ensureDirSync(path.resolve(process.cwd(), 'sessions'));
  fs.ensureDirSync(path.resolve(process.cwd(), 'temp'));
  fs.ensureDirSync(path.resolve(process.cwd(), 'logs'));
}

export async function cleanupTemp() {
  const tempDir = path.resolve(process.cwd(), 'temp');
  if (await fs.pathExists(tempDir)) {
    await fs.emptyDir(tempDir);
  }
}
