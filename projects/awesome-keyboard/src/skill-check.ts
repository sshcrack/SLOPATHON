import type { SpecialKey } from './contracts';

const ROTATION_MS = 1450;
const TARGET_SIZE = 0.13;

export class SkillCheck {
  private readonly dial: HTMLElement;
  private readonly label: HTMLElement;
  private readonly needle: HTMLElement;
  private readonly result: HTMLElement;
  private animationFrame?: number;
  private resolve?: (success: boolean) => void;
  private startedAt = 0;
  private targetStart = 0;

  constructor(private readonly root: HTMLElement) {
    this.dial = this.required('.skill-check__dial');
    this.label = this.required('#skill-check-label');
    this.needle = this.required('.skill-check__needle');
    this.result = this.required('#skill-check-result');
    root.addEventListener('pointerdown', (event) => {
      if (event.button === 0) this.attempt();
    });
  }

  run(key: SpecialKey): Promise<boolean> {
    if (this.resolve) this.finish(false);
    this.targetStart = 0.08 + Math.random() * 0.79;
    this.dial.style.setProperty('--target-start', `${this.targetStart}turn`);
    this.dial.style.setProperty(
      '--target-end',
      `${this.targetStart + TARGET_SIZE}turn`,
    );
    this.label.textContent = `Authorize ${key.toUpperCase()}: click in the green zone.`;
    this.result.textContent = 'LEFT-CLICK TO ACTIVATE';
    this.root.classList.remove('skill-check--success', 'skill-check--miss');
    this.root.hidden = false;
    this.startedAt = performance.now();
    this.animate(this.startedAt);
    return new Promise((resolve) => {
      this.resolve = resolve;
    });
  }

  stop(): void {
    if (this.resolve || this.pendingResolve) this.finish(false);
  }

  private attempt(): void {
    if (!this.resolve) return;
    const position = this.position(performance.now());
    const success = position >= this.targetStart
      && position <= this.targetStart + TARGET_SIZE;
    this.root.classList.add(
      success ? 'skill-check--success' : 'skill-check--miss',
    );
    this.result.textContent = success ? 'AUTHORIZED' : 'ACCESS DENIED';
    window.setTimeout(() => this.finish(success), 520);
    const resolve = this.resolve;
    this.resolve = undefined;
    this.pendingResolve = resolve;
  }

  private pendingResolve?: (success: boolean) => void;

  private finish(success: boolean): void {
    if (this.animationFrame !== undefined) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = undefined;
    }
    this.root.hidden = true;
    const resolve = this.resolve ?? this.pendingResolve;
    this.resolve = undefined;
    this.pendingResolve = undefined;
    resolve?.(success);
  }

  private animate = (now: number): void => {
    const turn = this.position(now);
    this.needle.style.transform = `rotate(${turn}turn)`;
    this.animationFrame = requestAnimationFrame(this.animate);
  };

  private position(now: number): number {
    return ((now - this.startedAt) % ROTATION_MS) / ROTATION_MS;
  }

  private required(selector: string): HTMLElement {
    const element = this.root.querySelector<HTMLElement>(selector);
    if (!element) throw new Error(`Missing skill-check element: ${selector}`);
    return element;
  }
}
