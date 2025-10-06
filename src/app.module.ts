import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DrizzleModule } from './core/database';
import { SharedModule } from './shared/shared.module';
import modules from './modules';
import { ThrottlerModule } from '@nestjs/throttler';
import config from './config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: config.rateLimit.default.TTL_IN_SECONDS * 1000,
          limit: config.rateLimit.default.REQUEST_LIMIT,
        },
        {
          name: 'otp',
          ttl: config.rateLimit.otp.TTL_IN_SECONDS * 1000,
          limit: config.rateLimit.otp.REQUEST_LIMIT,
        },
      ],
    }),
    SharedModule,
    DrizzleModule,
    ...modules,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
