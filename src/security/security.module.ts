import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { createHash } from 'node:crypto';
import { Model } from 'mongoose';
import {
  SecurityCounter,
  SecurityCounterSchema,
} from './security-counter.schema';
import { MongoThrottleStorage } from './mongo-throttle.storage';
import { ProviderAccessService } from './provider-access.service';
import { positiveSetting } from './security-settings';

const countersModule = MongooseModule.forFeature([
  { name: SecurityCounter.name, schema: SecurityCounterSchema },
]);

@Global()
@Module({
  imports: [
    countersModule,
    ThrottlerModule.forRootAsync({
      imports: [countersModule],
      inject: [getModelToken(SecurityCounter.name)],
      useFactory: (counters: Model<SecurityCounter>) => ({
        storage: new MongoThrottleStorage(counters),
        throttlers: [
          {
            name: 'default',
            ttl: 60000,
            limit: positiveSetting('RATE_LIMIT_PER_ROUTE', 30),
          },
          {
            name: 'global',
            ttl: 60000,
            limit: positiveSetting('RATE_LIMIT_GLOBAL', 120),
            generateKey: (_context, tracker) =>
              createHash('sha256').update(`global:${tracker}`).digest('hex'),
          },
        ],
      }),
    }),
  ],
  providers: [
    ProviderAccessService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
  exports: [ProviderAccessService],
})
export class SecurityModule {}
