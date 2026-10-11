import { ServiceUnavailableException } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import { Model } from 'mongoose';
import { SecurityCounter } from './security-counter.schema';

export class MongoThrottleStorage implements ThrottlerStorage {
  constructor(private readonly counters: Model<SecurityCounter>) {}

  async increment(key: string, ttl: number, limit: number) {
    const now = Date.now();
    const window = Math.floor(now / ttl);
    const expiresAt = new Date((window + 1) * ttl);
    try {
      const counter = await this.counters
        .findOneAndUpdate(
          { _id: `throttle:${key}:${window}` },
          { $inc: { count: 1 }, $setOnInsert: { expiresAt } },
          { upsert: true, returnDocument: 'after', setDefaultsOnInsert: false },
        )
        .exec();
      const remaining = Math.max(
        1,
        Math.ceil((expiresAt.getTime() - now) / 1000),
      );
      return {
        totalHits: counter.count,
        timeToExpire: remaining,
        isBlocked: counter.count > limit,
        timeToBlockExpire: remaining,
      };
    } catch {
      throw new ServiceUnavailableException(
        'Request limit verification unavailable.',
      );
    }
  }
}
