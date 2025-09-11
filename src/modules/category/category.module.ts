import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { CategoryRepository } from './category.repository';

@Module({
  controllers: [CategoryController],
  providers: [CategoryService, CategoryRepository],
  imports: [DrizzleModule],
  exports: [],
})
export class CategoryModule {}
