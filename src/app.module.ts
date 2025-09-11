import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DrizzleModule } from './drizzle/drizzle.module';
import modules from './modules';

@Module({
  imports: [DrizzleModule, ...modules],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
