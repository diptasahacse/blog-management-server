import { IsOptional, IsEnum } from 'class-validator';
import { BaseSortDto } from 'src/shared/dto/sort.dto';
export enum UserSortField {
  ID = 'id',
  NAME = 'name',
  EMAIL = 'email',
  ROLE = 'role',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}

export class UserSortDto extends BaseSortDto {
  @IsOptional()
  @IsEnum(UserSortField)
  sortBy?: UserSortField = UserSortField.CREATED_AT;
}
