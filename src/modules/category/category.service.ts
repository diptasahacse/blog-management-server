import { Injectable } from '@nestjs/common';
import { BaseService } from '../base/base.service';
import { CategoryRepository } from './category.repository';
import * as schema from 'src/drizzle/schemas';

@Injectable()
export class CategoryService extends BaseService<
  typeof schema.CategoryTable,
  CategoryRepository
> {
  constructor(repository: CategoryRepository) {
    super(repository);
  }
  // You can override methods here to add custom business logic
  // For example, add custom validation or business rules specific to your app
  // Override create if you need custom logic
  // async create(createCategoryDto: CreateCategoryDto) {
  //   // Add custom logic here before calling super
  //   return super.create(createCategoryDto);
  // }
  // Add custom methods specific to categories
  // async findBySlug(slug: string) {
  //   // Custom method not in base class
  //   return this.repository.findByName(slug); // This is just an example
  // }
}
