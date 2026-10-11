import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { RecipesModule } from './recipes/recipes.module';
import { SecurityModule } from './security/security.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.MONGO_URI,
        autoIndex: process.env.NODE_ENV !== 'production',
        serverSelectionTimeoutMS: 5000,
      }),
    }),
    SecurityModule,
    RecipesModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
