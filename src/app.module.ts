import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DrizzleModule } from './core/database';
import { SharedModule } from './shared/shared.module';
import modules from './modules';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    SharedModule,
    DrizzleModule,
    ...modules,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
