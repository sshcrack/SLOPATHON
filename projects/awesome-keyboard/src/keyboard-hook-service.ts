import koffi from 'koffi';

const user32 = koffi.load('user32.dll');

const LowLevelKeyboardProc = koffi.proto('LowLevelKeyboardProc', koffi.types.int64, [koffi.types.int, koffi.types.uint64, koffi.types.int64]);
const SetWindowsHookExW = user32.func('SetWindowsHookExW', koffi.types.intptr, [koffi.types.int, koffi.pointer(LowLevelKeyboardProc), koffi.types.intptr, koffi.types.uint32]);
const CallNextHookEx = user32.func('CallNextHookEx', koffi.types.int64, [koffi.types.intptr, koffi.types.int, koffi.types.uint64, koffi.types.int64]);
const UnhookWindowsHookEx = user32.func('UnhookWindowsHookEx', koffi.types.bool, [koffi.types.intptr]);
const GetAsyncKeyState = user32.func('GetAsyncKeyState', koffi.types.short, [koffi.types.int]);

const WH_KEYBOARD_LL = 13;
const WM_KEYDOWN = 0x0100;
const WM_SYSKEYDOWN = 0x0104;

const VK_SHIFT = 0x10;
const VK_CONTROL = 0x11;
const VK_MENU = 0x12;
const VK_E = 0x45;

let hookHandle: number = 0;
let hookProc: ((nCode: number, wParam: number, lParam: number) => number) | null = null;
let exitCallback: (() => void) | null = null;
let fired = false;

const isExitCombo = (): boolean => {
  return (
    (GetAsyncKeyState(VK_CONTROL) & 0x8000) !== 0 &&
    (GetAsyncKeyState(VK_MENU) & 0x8000) !== 0 &&
    (GetAsyncKeyState(VK_SHIFT) & 0x8000) !== 0 &&
    (GetAsyncKeyState(VK_E) & 0x8000) !== 0
  );
};

export const installHook = (onExit: () => void): void => {
  if (hookHandle !== 0) {
    uninstallHook();
  }

  exitCallback = onExit;
  fired = false;

  hookProc = (nCode: number, wParam: number, lParam: number): number => {
    if (nCode < 0) {
      return CallNextHookEx(hookHandle, nCode, wParam, lParam);
    }

    if (
      !fired
      && (wParam === WM_KEYDOWN || wParam === WM_SYSKEYDOWN)
      && isExitCombo()
    ) {
      fired = true;
      const cb = exitCallback;
      exitCallback = null;
      setImmediate(() => cb?.());
      return CallNextHookEx(hookHandle, nCode, wParam, lParam);
    }

    return 1;
  };

  hookHandle = SetWindowsHookExW(WH_KEYBOARD_LL, hookProc, 0, 0);
  if (!hookHandle) {
    hookHandle = 0;
    hookProc = null;
    exitCallback = null;
    throw new Error('Failed to install keyboard hook');
  }
};

export const uninstallHook = (): void => {
  if (hookHandle !== 0) {
    UnhookWindowsHookEx(hookHandle);
    hookHandle = 0;
  }
  hookProc = null;
  exitCallback = null;
  fired = false;
};
