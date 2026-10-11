import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SecurityCounter } from './security-counter.schema';
import { positiveSetting } from './security-settings';

export class RetryableServiceException extends ServiceUnavailableException {
  constructor(
    message: string,
    readonly retryAfter: number,
  ) {
    super(message);
  }
}

@Injectable()
export class ProviderAccessService {
  private active = 0;
  private readonly concurrency = positiveSetting('PROVIDER_MAX_CONCURRENCY', 4);
  private readonly limits = {
    spoonacular: positiveSetting('SPOONACULAR_DAILY_REQUEST_LIMIT', 100),
    azure: positiveSetting('AZURE_DAILY_CHARACTER_LIMIT', 50000),
  };

  constructor(
    @InjectModel(SecurityCounter.name)
    private readonly counters: Model<SecurityCounter>,
  ) {}

  async run<T>(
    provider: keyof ProviderAccessService['limits'],
    work: () => Promise<T>,
    units = 1,
  ): Promise<T> {
    if (this.active >= this.concurrency)
      throw new RetryableServiceException('Service busy. Retry later.', 5);
    this.active++;
    try {
      const now = new Date();
      const day = now.toISOString().slice(0, 10);
      const tomorrow = Date.parse(day) + 86400000;
      const exhausted = () =>
        new RetryableServiceException(
          'Provider daily budget exhausted. Retry later.',
          Math.max(1, Math.ceil((tomorrow - now.getTime()) / 1000)),
        );
      if (
        !Number.isSafeInteger(units) ||
        units < 1 ||
        units > this.limits[provider]
      )
        throw exhausted();
      try {
        const id = `budget:${provider}:${day}`;
        await this.counters
          .updateOne(
            { _id: id },
            {
              $setOnInsert: {
                count: 0,
                expiresAt: new Date(tomorrow + 86400000),
              },
            },
            { upsert: true },
          )
          .exec();
        const counter = await this.counters
          .findOneAndUpdate(
            {
              _id: id,
              count: { $lte: this.limits[provider] - units },
            },
            {
              $inc: { count: units },
            },
            { returnDocument: 'after' },
          )
          .exec();
        if (!counter) throw exhausted();
      } catch (error: unknown) {
        if (error instanceof RetryableServiceException) throw error;
        if (
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          error.code === 11000
        )
          throw exhausted();
        throw new RetryableServiceException(
          'Provider budget verification unavailable.',
          5,
        );
      }
      return await work();
    } finally {
      this.active--;
    }
  }
}
