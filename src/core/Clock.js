import { SIM } from '../config.js';

// Fixed-timestep accumulator. Simulation runs at exactly SIM.TICK_RATE Hz
// regardless of render rate; the renderer interpolates using `alpha`.
export class Clock {
  constructor() {
    this.accumulator = 0;
    this.last = performance.now() / 1000;
    this.alpha = 0;
    this.frameDelta = 0;
    this.elapsed = 0;
    this.tickCount = 0;
  }

  // Calls `stepFn(dt)` zero or more times, then leaves `this.alpha` set to the
  // leftover fraction of a tick for render interpolation.
  advance(stepFn) {
    const now = performance.now() / 1000;
    let delta = now - this.last;
    this.last = now;

    // A tab that was backgrounded can produce a huge delta. Clamp it rather
    // than trying to simulate minutes of missed time.
    if (delta > 0.25) delta = 0.25;
    this.frameDelta = delta;
    this.elapsed += delta;
    this.accumulator += delta;

    let ticks = 0;
    while (this.accumulator >= SIM.TICK_DT && ticks < SIM.MAX_TICKS_PER_FRAME) {
      stepFn(SIM.TICK_DT);
      this.accumulator -= SIM.TICK_DT;
      ticks++;
      this.tickCount++;
    }

    // If we hit the tick ceiling we are running behind; drop the backlog so we
    // do not spiral.
    if (ticks >= SIM.MAX_TICKS_PER_FRAME) this.accumulator = 0;

    this.alpha = this.accumulator / SIM.TICK_DT;
    return ticks;
  }
}
