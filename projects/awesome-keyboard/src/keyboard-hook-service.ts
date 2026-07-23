import { app } from 'electron';
import { spawn, execSync, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';

let child: ChildProcess | null = null;
let exitHandler: (() => void) | null = null;
let inputQueue: Promise<unknown> = Promise.resolve();

const exePath = (): string => {
  const dev = path.join(app.getAppPath(), 'native', 'keyboard-blocker.exe');
  const res = path.join(process.resourcesPath, 'keyboard-blocker.exe');
  if (fs.existsSync(dev)) return dev;
  return res;
};

const buildIfMissing = (): boolean => {
  if (fs.existsSync(exePath())) return true;
  try {
    execSync('node scripts/build-native.js', { cwd: app.getAppPath(), stdio: 'ignore', timeout: 30000 });
    return fs.existsSync(exePath());
  } catch {
    return false;
  }
};

export const installHook = (onExit: () => void): void => {
  if (child) return;
  exitHandler = onExit;

  if (!buildIfMissing()) return;

  try {
    child = spawn(exePath(), [], { stdio: ['pipe', 'pipe', 'pipe'] });

    let buffer = '';

    child.stdout?.on('data', (data: Buffer) => {
      buffer += data.toString();
      if (buffer.includes('EXIT')) {
        child = null;
        onExit();
      }
    });

    child.on('error', () => { child = null; });
    child.on('exit', () => { child = null; });
  } catch {
    child = null;
  }
};

export const uninstallHook = (): void => {
  exitHandler = null;
  child?.kill();
  child = null;
};

const stopHook = (): Promise<void> => new Promise((resolve) => {
  if (!child) {
    resolve();
    return;
  }
  const activeChild = child;
  const finish = (): void => resolve();
  activeChild.once('exit', finish);
  activeChild.once('error', finish);
  activeChild.kill();
});

/**
 * Runs a synthetic keystroke while the native low-level hook is absent, then
 * reinstalls the hook before another application action can use that window.
 */
export const typeWithHookTemporarilyDisabled = <T>(
  type: () => Promise<T>,
): Promise<T> => {
  const task = inputQueue.then(async () => {
    await stopHook();
    try {
      return await type();
    } finally {
      if (exitHandler) installHook(exitHandler);
    }
  });
  inputQueue = task.catch((): void => undefined);
  return task;
};
