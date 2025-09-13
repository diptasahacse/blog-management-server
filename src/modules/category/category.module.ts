import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { DrizzleModule } from 'src/core/database';
import { SharedModule } from 'src/shared/shared.module';
import { CategoryRepository } from './category.repository';

@Module({
  controllers: [CategoryController],
  providers: [CategoryService, CategoryRepository],
  imports: [DrizzleModule, SharedModule],
  exports: [],
})
export class CategoryModule {}
