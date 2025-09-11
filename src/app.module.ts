import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DrizzleModule } from './drizzle/drizzle.module';
import { CommonModule } from './common/common.module';
import modules from './modules';

@Module({
  imports: [CommonModule, DrizzleModule, ...modules],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
