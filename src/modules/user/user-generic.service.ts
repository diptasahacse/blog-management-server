import { Injectable } from '@nestjs/common';
import { UserFilterRepository } from './user-filter.repository';
import { DynamicQueryBuilderService } from 'src/shared/services/dynamic-query-builder.service';
import { FilterOperationType } from 'src/shared/interfaces/filter.interface';
import { IGenericFilterInput } from 'src/shared/dto/dynamic-filter.dto';

@Injectable()
export class UserGenericService {
  constructor(
    private readonly userFilterRepo: UserFilterRepository,
    private readonly queryBuilder: DynamicQueryBuilderService,
  ) {}

  /**
   * Generic search using the new filtering system
   */
  async searchUsers(searchParams: {
    search?: string;
    role?: string;
    name?: string;
    email?: string;
    verified?: boolean;
    createdFrom?: Date;
    createdTo?: Date;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }) {
    // Create properly typed filters object
    const filters: Record<
      string,
      { operation: FilterOperationType; value: any }
    > = {};

    // Add field-specific filters
    if (searchParams.role) {
      filters.role = {
        operation: FilterOperationType.EQUAL,
        value: searchParams.role,
      };
    }

    if (searchParams.name) {
      filters.name = {
        operation: FilterOperationType.ILIKE,
        value: `%${searchParams.name}%`,
      };
    }

    if (searchParams.email) {
      filters.email = {
        operation: FilterOperationType.ILIKE,
        value: `%${searchParams.email}%`,
      };
    }

    if (searchParams.verified !== undefined) {
      filters.verifiedAt = {
        operation: searchParams.verified
          ? FilterOperationType.IS_NOT_NULL
          : FilterOperationType.IS_NULL,
        value: null,
      };
    }

    if (searchParams.createdFrom && searchParams.createdTo) {
      filters.createdAt = {
        operation: FilterOperationType.BETWEEN,
        value: [searchParams.createdFrom, searchParams.createdTo],
      };
    } else if (searchParams.createdFrom) {
      filters.createdAt = {
        operation: FilterOperationType.GREATER_THAN_OR_EQUAL,
        value: searchParams.createdFrom,
      };
    } else if (searchParams.createdTo) {
      filters.createdAt = {
        operation: FilterOperationType.LESS_THAN_OR_EQUAL,
        value: searchParams.createdTo,
      };
    }

    // Convert to generic filter input
    const filterInput: IGenericFilterInput = {
      search: searchParams.search,
      filters,
      pagination: {
        page: searchParams.page || 1,
        limit: searchParams.limit || 10,
      },
      sort: {
        field: searchParams.sortBy || 'createdAt',
        order: searchParams.sortOrder || 'ASC',
      },
    };

    // Use the generic filtering system
    return this.userFilterRepo.findWithFilters(filterInput);
  }

  /**
   * Example: Complex search combining multiple filters
   */
  async findActiveAdmins() {
    return this.userFilterRepo.findWithFilters({
      filters: {
        role: { operation: FilterOperationType.EQUAL, value: 'ADMIN' },
        verifiedAt: { operation: FilterOperationType.IS_NOT_NULL, value: null },
      },
      pagination: { page: 1, limit: 20 },
      sort: { field: 'name', order: 'ASC' },
    });
  }

  /**
   * Example: Global search with date range
   */
  async searchRecentUsers(searchTerm: string, days: number = 30) {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    return this.userFilterRepo.findWithFilters({
      search: searchTerm, // Will search across name and email fields
      filters: {
        createdAt: {
          operation: FilterOperationType.GREATER_THAN_OR_EQUAL,
          value: fromDate,
        },
      },
      pagination: { page: 1, limit: 10 },
      sort: { field: 'createdAt', order: 'DESC' },
    });
  }

  /**
   * Validate filter input before processing
   */
  async validateAndSearch(filterInput: IGenericFilterInput) {
    // Validate input against configuration
    const errors = this.userFilterRepo.validateFilterInput(filterInput);

    if (errors.length > 0) {
      throw new Error(`Filter validation failed: ${errors.join(', ')}`);
    }

    return this.userFilterRepo.findWithFilters(filterInput);
  }
}
