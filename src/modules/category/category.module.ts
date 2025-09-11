import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { DrizzleModule } from 'src/drizzle/drizzle.module';

@Module({
  controllers: [CategoryController],
  providers: [CategoryService],
  imports: [DrizzleModule],
})
export class CategoryModule {}
