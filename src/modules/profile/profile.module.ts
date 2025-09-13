import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { DrizzleModule } from 'src/core/database/drizzle.module';

@Module({
  imports: [DrizzleModule],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
