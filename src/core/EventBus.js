// Central pub/sub. Systems talk through this rather than importing each other,
// so later phases (damage, pickups, kills) can hook in without rewiring.

export class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  on(event, fn) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(fn);
    return () => this.off(event, fn);
  }

  once(event, fn) {
    const wrapped = (payload) => {
      this.off(event, wrapped);
      fn(payload);
    };
    return this.on(event, wrapped);
  }

  off(event, fn) {
    const set = this.listeners.get(event);
    if (set) set.delete(fn);
  }

  emit(event, payload) {
    const set = this.listeners.get(event);
    if (!set) return;
    // Copy so a handler that unsubscribes mid-emit cannot corrupt iteration.
    for (const fn of [...set]) fn(payload);
  }

  clear() {
    this.listeners.clear();
  }
}
