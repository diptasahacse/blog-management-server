import { Injectable } from '@nestjs/common';
import { FindUsersDto } from '../dto/find-users.dto';
import {
  IGenericFilterInput,
  FilterOperationDto,
} from '../../../shared/dto/dynamic-filter.dto';
import { FilterOperationType } from '../../../shared/interfaces/filter.interface';

@Injectable()
export class UserFilterService {
  /**
   * Convert FindUsersDto to IGenericFilterInput format for dynamic query builder
   */
  convertToGenericFilter(dto: FindUsersDto): IGenericFilterInput {
    const filters: Record<string, FilterOperationDto> = {};

    // Handle specific field filters
    if (dto.id) {
      filters.id = {
        operation: FilterOperationType.EQUAL,
        value: dto.id,
      };
    }

    if (dto.name) {
      filters.name = {
        operation: FilterOperationType.ILIKE,
        value: `%${dto.name}%`,
      };
    }

    if (dto.email) {
      filters.email = {
        operation: FilterOperationType.ILIKE,
        value: `%${dto.email}%`,
      };
    }

    if (dto.role) {
      filters.role = {
        operation: FilterOperationType.EQUAL,
        value: dto.role,
      };
    }

    // Handle date range filters
    if (dto.createdFrom) {
      filters.createdAt_gte = {
        operation: FilterOperationType.GREATER_THAN_OR_EQUAL,
        value: new Date(dto.createdFrom),
      };
    }

    if (dto.createdTo) {
      filters.createdAt_lte = {
        operation: FilterOperationType.LESS_THAN_OR_EQUAL,
        value: new Date(dto.createdTo),
      };
    }

    if (dto.updatedFrom) {
      filters.updatedAt_gte = {
        operation: FilterOperationType.GREATER_THAN_OR_EQUAL,
        value: new Date(dto.updatedFrom),
      };
    }

    if (dto.updatedTo) {
      filters.updatedAt_lte = {
        operation: FilterOperationType.LESS_THAN_OR_EQUAL,
        value: new Date(dto.updatedTo),
      };
    }

    return {
      search: dto.search,
      filters,
      pagination: {
        page: dto.page,
        limit: dto.limit,
      },
      sort: {
        field: dto.sortBy || 'createdAt',
        order: dto.sortOrder || 'DESC',
      },
    };
  }
}
