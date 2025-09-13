import {
  FilterConfig,
  FieldDataType,
  FilterOperationType,
} from '../../../shared/interfaces/filter.interface';
import * as schema from '../../../core/database/schemas';

export const userFilterConfig: FilterConfig = {
  table: schema.UserTable,
  entityName: 'User',
  fields: {
    id: {
      name: 'id',
      type: FieldDataType.UUID,
      operations: [FilterOperationType.EQUAL, FilterOperationType.IN],
      sortable: true,
    },
    name: {
      name: 'name',
      type: FieldDataType.STRING,
      operations: [
        FilterOperationType.EQUAL,
        FilterOperationType.LIKE,
        FilterOperationType.ILIKE,
      ],
      searchable: true,
      sortable: true,
    },
    email: {
      name: 'email',
      type: FieldDataType.STRING,
      operations: [
        FilterOperationType.EQUAL,
        FilterOperationType.LIKE,
        FilterOperationType.ILIKE,
      ],
      searchable: true,
      sortable: true,
    },
    role: {
      name: 'role',
      type: FieldDataType.ENUM,
      operations: [FilterOperationType.EQUAL, FilterOperationType.IN],
      sortable: true,
      validation: {
        enum: ['admin', 'user'],
      },
    },
    createdAt: {
      name: 'createdAt',
      type: FieldDataType.DATE,
      operations: [
        FilterOperationType.EQUAL,
        FilterOperationType.GREATER_THAN,
        FilterOperationType.GREATER_THAN_OR_EQUAL,
        FilterOperationType.LESS_THAN,
        FilterOperationType.LESS_THAN_OR_EQUAL,
        FilterOperationType.BETWEEN,
      ],
      sortable: true,
    },
    updatedAt: {
      name: 'updatedAt',
      type: FieldDataType.DATE,
      operations: [
        FilterOperationType.EQUAL,
        FilterOperationType.GREATER_THAN,
        FilterOperationType.GREATER_THAN_OR_EQUAL,
        FilterOperationType.LESS_THAN,
        FilterOperationType.LESS_THAN_OR_EQUAL,
        FilterOperationType.BETWEEN,
      ],
      sortable: true,
    },
  },
  pagination: {
    defaultLimit: 10,
    maxLimit: 100,
  },
  defaultSort: {
    field: 'createdAt',
    order: 'DESC',
  },
};
