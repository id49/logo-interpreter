import { Cancelled, type Location } from '@logo/logo';
export type ExecutionState = 'running' | 'paused' | 'waiting' | 'done' | 'stopped' | 'error';
/** Browser-independent instruction permits. A step grants exactly one statement. */
export class Controller {
  paused: boolean;
  stopped = false;
  delay = 80;
  private credits = 0;
  private notify: (() => void) | undefined;
  private stepInstruction = false;
  private pauseVersion = 0;
  private ticks = 0;
  private ticketVersion = 0;
  constructor(
    paused = false,
    private status: (state: ExecutionState, loc?: Location) => void = () => {},
  ) {
    this.paused = paused;
  }
  pause() {
    this.paused = true;
    this.pauseVersion++;
    this.credits = 0;
    this.wake();
    this.status('paused');
  }
  resume() {
    this.paused = false;
    this.credits = 0;
    this.wake();
    this.status('running');
  }
  step() {
    this.paused = true;
    this.credits++;
    this.wake();
  }
  stop() {
    this.stopped = true;
    this.wake();
  }
  setDelay(delay: number) {
    this.delay = Math.max(0, Math.min(1000, delay));
    this.wake();
  }
  private wake() {
    this.notify?.();
    this.notify = undefined;
  }
  private check() {
    if (this.stopped) throw new Cancelled();
  }
  private wait(ms?: number) {
    return new Promise<void>((resolve) => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const finish = () => {
        if (timer) clearTimeout(timer);
        if (this.notify === finish) this.notify = undefined;
        resolve();
      };
      this.notify = finish;
      if (ms !== undefined) timer = setTimeout(finish, ms);
    });
  }
  async before(loc: Location): Promise<void> {
    this.check();
    this.status(this.paused ? 'paused' : 'running', loc);
    while (this.paused && !this.credits) {
      await this.wait();
      this.check();
    }
    this.stepInstruction = this.paused;
    this.ticketVersion = this.pauseVersion;
    if (this.paused) this.credits--;
    else {
      const start = Date.now();
      while (!this.paused && Date.now() - start < this.delay) {
        await this.wait(this.delay - (Date.now() - start));
        this.check();
      }
      if (this.paused) return this.before(loc);
    }
    this.check();
    // Always yield to messages, even at instant speed and inside tight loops.
    if (++this.ticks % 32 === 0 || this.paused || this.delay > 0)
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    this.check();
    if (this.paused && this.pauseVersion !== this.ticketVersion) return this.before(loc);
  }
  async afterInput() {
    this.check();
    while (
      this.paused &&
      !(this.stepInstruction && this.ticketVersion === this.pauseVersion) &&
      !this.credits
    ) {
      this.status('paused');
      await this.wait();
      this.check();
    }
    if (
      this.paused &&
      this.credits &&
      !(this.stepInstruction && this.ticketVersion === this.pauseVersion)
    ) {
      this.credits--;
      this.stepInstruction = true;
      this.ticketVersion = this.pauseVersion;
    }
  }
}
