import { ServiceUnavailableException } from '@nestjs/common';

export class SingleFlight<K, V> {
  private readonly pending = new Map<K, Promise<V>>();

  run(key: K, work: () => Promise<V>): Promise<V> {
    const existing = this.pending.get(key);
    if (existing) return existing;
    if (this.pending.size >= 64) {
      return Promise.reject(
        new ServiceUnavailableException('Service busy. Retry later.'),
      );
    }
    const promise = Promise.resolve()
      .then(work)
      .finally(() => this.pending.delete(key));
    this.pending.set(key, promise);
    return promise;
  }
}
