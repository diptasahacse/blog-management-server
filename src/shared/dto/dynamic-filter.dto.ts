import { Type, Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import {
  FilterConfig,
  FieldConfig,
  FieldDataType,
  FilterOperationType,
} from '../interfaces/filter.interface';

/**
 * Base pagination DTO
 */
export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Page must be a number' })
  @Min(1, { message: 'Page must be greater than 0' })
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Limit must be a number' })
  @Min(1, { message: 'Limit must be greater than 0' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  limit: number = 10;
}

/**
 * Base sort DTO
 */
export class SortDto {
  @IsOptional()
  @IsString()
  field: string = 'createdAt';

  @IsOptional()
  @IsEnum(['ASC', 'DESC'], { message: 'Sort order must be ASC or DESC' })
  order: 'ASC' | 'DESC' = 'ASC';
}

/**
 * Filter operation DTO
 */
export class FilterOperationDto {
  @IsEnum(FilterOperationType, { message: 'Invalid filter operation' })
  operation!: FilterOperationType;

  value!: unknown;
}

/**
 * Generic filter input interface
 */
export interface IGenericFilterInput {
  search?: string;
  filters?: Record<string, FilterOperationDto>;
  relations?: Record<string, IGenericFilterInput>;
  pagination: PaginationDto;
  sort: SortDto;
}

/**
 * Base query parameters DTO for URL-based filtering
 */
export class BaseQueryParamsDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Page must be a number' })
  @Min(1, { message: 'Page must be greater than 0' })
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Limit must be a number' })
  @Min(1, { message: 'Limit must be greater than 0' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  limit: number = 10;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * Dynamic filter DTO generator utility
 */
export class DynamicFilterDtoGenerator {
  /**
   * Create filter input from query parameters
   */
  static createFilterInputFromQuery(
    queryParams: Record<string, unknown>,
    config: FilterConfig,
  ): IGenericFilterInput {
    const input: IGenericFilterInput = {
      pagination: new PaginationDto(),
      sort: new SortDto(),
    };

    // Handle search
    if (queryParams.search && typeof queryParams.search === 'string') {
      input.search = queryParams.search;
    }

    // Handle pagination
    if (queryParams.page) {
      input.pagination.page = Number(queryParams.page) || 1;
    }
    if (queryParams.limit) {
      input.pagination.limit = Number(queryParams.limit) || 10;
    }

    // Handle sorting
    if (queryParams.sortBy && typeof queryParams.sortBy === 'string') {
      input.sort.field = queryParams.sortBy;
    }
    if (queryParams.sortOrder) {
      input.sort.order = queryParams.sortOrder as 'ASC' | 'DESC';
    }

    // Handle field filters
    const filters: Record<string, FilterOperationDto> = {};
    Object.entries(config.fields).forEach(([fieldName, fieldConfig]) => {
      if (queryParams[fieldName] !== undefined) {
        filters[fieldName] = {
          operation: this.getDefaultOperationForField(fieldConfig),
          value: this.transformValueForField(
            queryParams[fieldName],
            fieldConfig,
          ),
        };
      }
    });

    if (Object.keys(filters).length > 0) {
      input.filters = filters;
    }

    return input;
  }

  /**
   * Get default operation for a field type
   */
  private static getDefaultOperationForField(
    fieldConfig: FieldConfig,
  ): FilterOperationType {
    switch (fieldConfig.type) {
      case FieldDataType.STRING:
        return FilterOperationType.ILIKE;
      case FieldDataType.NUMBER:
      case FieldDataType.DATE:
        return FilterOperationType.EQUAL;
      case FieldDataType.BOOLEAN:
      case FieldDataType.ENUM:
      case FieldDataType.UUID:
        return FilterOperationType.EQUAL;
      default:
        return FilterOperationType.EQUAL;
    }
  }

  /**
   * Transform value based on field type
   */
  private static transformValueForField(
    value: unknown,
    fieldConfig: FieldConfig,
  ): unknown {
    if (fieldConfig.transform) {
      return fieldConfig.transform(value);
    }

    switch (fieldConfig.type) {
      case FieldDataType.NUMBER:
        return typeof value === 'string' ? Number(value) : value;
      case FieldDataType.BOOLEAN:
        return typeof value === 'string'
          ? value.toLowerCase() === 'true'
          : Boolean(value);
      case FieldDataType.DATE:
        return typeof value === 'string' ? new Date(value) : value;
      default:
        return value;
    }
  }
}
