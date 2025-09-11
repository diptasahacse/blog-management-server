import { Controller, Post, Body, Param, Delete } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.create(createCategoryDto);
  }

  // @Get()
  // findAll(@Query() query?: IQueryOptions) {
  //   return this.categoryService.findAll(query);
  // }

  // @Get(':id')
  // findOne(
  //   @Param(
  //     'id',
  //     new ParseUUIDPipe({
  //       exceptionFactory: () => {
  //         return new NotFoundException({
  //           message: 'Category not found',
  //         });
  //       },
  //     }),
  //   )
  //   id: string,
  // ) {
  //   return this.categoryService.findOne(id);
  // }

  // @Patch(':id')
  // update(
  //   @Param('id') id: string,
  //   @Body() updateCategoryDto: UpdateCategoryDto,
  // ) {
  //   return this.categoryService.update(+id, updateCategoryDto);
  // }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoryService.delete(+id);
  }
}
