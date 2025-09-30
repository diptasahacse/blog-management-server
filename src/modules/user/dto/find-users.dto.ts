import {
  IsOptional,
  IsString,
  IsEmail,
  IsUUID,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { BaseQueryParamsDto } from '../../../shared/dto/dynamic-filter.dto';
import { UserRoleEnum } from 'src/modules/auth/enums/user.enum';

export enum UserSortField {
  ID = 'id',
  NAME = 'name',
  EMAIL = 'email',
  ROLE = 'role',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class FindUsersDto extends BaseQueryParamsDto {
  @IsOptional()
  @IsEnum(UserSortField)
  override sortBy?: UserSortField = UserSortField.CREATED_AT;

  // User-specific search filters
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  name?: string;

  @IsOptional()
  @IsEmail()
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  email?: string;

  @IsOptional()
  @IsEnum(UserRoleEnum)
  role?: UserRoleEnum;

  @IsOptional()
  @IsDateString()
  createdFrom?: string; // ISO date string

  @IsOptional()
  @IsDateString()
  createdTo?: string; // ISO date string

  @IsOptional()
  @IsDateString()
  updatedFrom?: string; // ISO date string

  @IsOptional()
  @IsDateString()
  updatedTo?: string; // ISO date string
}
