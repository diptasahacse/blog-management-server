import { IsString } from 'class-validator';

export class CreateCategoryDto {
  @IsString({
    message: 'Name must be a string',
  })
  name: string;
  @IsString({
    message: 'Slug must be a string',
  })
  slug: string;
}
