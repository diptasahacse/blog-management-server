import { Injectable } from '@nestjs/common';
import { BaseFilterRepository } from '../base/base-filter.repository';
import {
  FilterConfig,
  FieldDataType,
  FilterOperationType,
} from 'src/shared/interfaces/filter.interface';
import * as schema from 'src/core/database/schemas';

@Injectable()
export class UserFilterRepository extends BaseFilterRepository<
  typeof schema.UserTable
> {
  protected getFilterConfig(): FilterConfig<typeof schema.UserTable> {
    return {
      table: schema.UserTable,
      entityName: 'User',
      fields: {
        id: {
          name: 'id',
          type: FieldDataType.STRING,
          operations: [
            FilterOperationType.EQUAL,
            FilterOperationType.NOT_EQUAL,
            FilterOperationType.IN,
          ],
          validation: {
            required: false,
          },
        },
        name: {
          name: 'name',
          type: FieldDataType.STRING,
          operations: [
            FilterOperationType.EQUAL,
            FilterOperationType.NOT_EQUAL,
            FilterOperationType.ILIKE,
            FilterOperationType.LIKE,
          ],
          searchable: true,
          sortable: true,
          validation: {
            required: false,
            min: 1,
            max: 100,
          },
        },
        email: {
          name: 'email',
          type: FieldDataType.STRING,
          operations: [
            FilterOperationType.EQUAL,
            FilterOperationType.NOT_EQUAL,
            FilterOperationType.ILIKE,
            FilterOperationType.LIKE,
          ],
          searchable: true,
          sortable: true,
          validation: {
            required: false,
            pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
          },
        },
        role: {
          name: 'role',
          type: FieldDataType.ENUM,
          operations: [
            FilterOperationType.EQUAL,
            FilterOperationType.NOT_EQUAL,
            FilterOperationType.IN,
          ],
          sortable: true,
          validation: {
            required: false,
            enum: ['ADMIN', 'USER'],
          },
        },
        verifiedAt: {
          name: 'verifiedAt',
          type: FieldDataType.DATE,
          operations: [
            FilterOperationType.EQUAL,
            FilterOperationType.GREATER_THAN_OR_EQUAL,
            FilterOperationType.LESS_THAN_OR_EQUAL,
            FilterOperationType.BETWEEN,
            FilterOperationType.IS_NULL,
            FilterOperationType.IS_NOT_NULL,
          ],
          sortable: true,
          validation: {
            required: false,
          },
        },
        createdAt: {
          name: 'createdAt',
          type: FieldDataType.DATE,
          operations: [
            FilterOperationType.EQUAL,
            FilterOperationType.GREATER_THAN_OR_EQUAL,
            FilterOperationType.LESS_THAN_OR_EQUAL,
            FilterOperationType.BETWEEN,
          ],
          sortable: true,
          validation: {
            required: false,
          },
        },
        updatedAt: {
          name: 'updatedAt',
          type: FieldDataType.DATE,
          operations: [
            FilterOperationType.EQUAL,
            FilterOperationType.GREATER_THAN_OR_EQUAL,
            FilterOperationType.LESS_THAN_OR_EQUAL,
            FilterOperationType.BETWEEN,
          ],
          sortable: true,
          validation: {
            required: false,
          },
        },
      },
      relations: {},
      pagination: {
        defaultLimit: 10,
        maxLimit: 100,
      },
      defaultSort: {
        field: 'createdAt',
        order: 'DESC',
      },
    };
  }

  /**
   * Example: Search users by role and creation date
   */
  async findUsersByRoleAndDate(role: string, fromDate: Date, toDate: Date) {
    return this.findWithFilters({
      search: undefined,
      filters: {
        role: { operation: FilterOperationType.EQUAL, value: role },
        createdAt: {
          operation: FilterOperationType.BETWEEN,
          value: [fromDate, toDate],
        },
      },
      pagination: { page: 1, limit: 20 },
      sort: { field: 'createdAt', order: 'DESC' },
    });
  }

  /**
   * Example: Search verified users with name filter
   */
  async findVerifiedUsers(nameFilter?: string) {
    const filters: Record<
      string,
      { operation: FilterOperationType; value: any }
    > = {
      verifiedAt: { operation: FilterOperationType.IS_NOT_NULL, value: null },
    };

    if (nameFilter) {
      filters.name = {
        operation: FilterOperationType.ILIKE,
        value: `%${nameFilter}%`,
      };
    }

    return this.findWithFilters({
      search: undefined,
      filters,
      pagination: { page: 1, limit: 10 },
      sort: { field: 'name', order: 'ASC' },
    });
  }
}
