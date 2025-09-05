import { IsString } from 'class-validator';

export class CreateCategoryDto {
  @IsString({
    message: 'Name must be a string',
  })
  name: string;
}
