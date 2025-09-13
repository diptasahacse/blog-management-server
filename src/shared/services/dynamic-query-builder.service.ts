import { Injectable } from '@nestjs/common';
import {
  eq,
  and,
  or,
  gte,
  lte,
  ilike,
  desc,
  asc,
  like,
  ne,
  inArray,
  notInArray,
  isNull,
  isNotNull,
  between,
  SQL,
} from 'drizzle-orm';
import { PgTable, PgColumn } from 'drizzle-orm/pg-core';
import {
  FilterConfig,
  FieldConfig,
  FilterOperationType,
  FieldDataType,
  QueryBuilderContext,
} from '../interfaces/filter.interface';
import { IGenericFilterInput } from '../dto/dynamic-filter.dto';

// Safe type definitions to avoid any usage
interface SafeFilterInput {
  search?: string;
  filters?: Record<string, { operation: FilterOperationType; value: unknown }>;
  relations?: Record<string, SafeFilterInput>;
  pagination?: { page: number; limit: number };
  sort?: { field: string; order: string };
}

interface SafeTableAccess {
  [key: string]: PgColumn;
}

@Injectable()
export class DynamicQueryBuilderService {
  /**
   * Build where conditions and order by clauses separately
   * This approach works better with Drizzle's complex typing
   */
  buildQueryComponents<TTable extends PgTable>(
    config: FilterConfig<TTable>,
    filterInput: IGenericFilterInput,
  ) {
    const context = this.initializeContext();

    // Build where conditions
    const whereConditions = this.buildWhereConditions(config, filterInput);

    // Build order by clauses
    const orderByClause = this.buildOrderByClause(config, filterInput);

    return {
      whereConditions,
      orderByClause,
      context,
    };
  }

  /**
   * Initialize query builder context
   */
  private initializeContext(): QueryBuilderContext {
    return {
      mainAlias: 'main',
      relationAliases: {},
      joins: [],
      conditions: [],
      orderBy: [],
    };
  }

  /**
   * Build where conditions based on filters
   */
  private buildWhereConditions<TTable extends PgTable>(
    config: FilterConfig<TTable>,
    filterInput: IGenericFilterInput,
  ): SQL | undefined {
    const conditions: SQL[] = [];
    const safeInput = filterInput as unknown as SafeFilterInput;

    // Handle global search
    const searchTerm = safeInput.search;
    if (searchTerm) {
      const searchConditions = this.buildSearchConditions(config, searchTerm);
      if (searchConditions) {
        conditions.push(searchConditions);
      }
    }

    // Handle field-specific filters
    const filters = safeInput.filters;
    if (filters) {
      Object.entries(filters).forEach(([fieldName, filterOperation]) => {
        const fieldConfig = config.fields[fieldName];
        if (fieldConfig) {
          const condition = this.buildFieldCondition(
            config.table,
            fieldName,
            fieldConfig,
            filterOperation.operation,
            filterOperation.value,
          );
          if (condition) {
            conditions.push(condition);
          }
        }
      });
    }

    // Handle relation filters (simplified for now)
    const relations = safeInput.relations;
    if (relations) {
      // TODO: Implement relation filtering
      // This would require building joins and nested conditions
    }

    // Combine all conditions
    if (conditions.length === 0) {
      return undefined;
    }

    if (conditions.length === 1) {
      return conditions[0];
    }

    return and(...conditions);
  }

  /**
   * Build search conditions for global search
   */
  private buildSearchConditions<TTable extends PgTable>(
    config: FilterConfig<TTable>,
    searchTerm: string,
  ): SQL | undefined {
    const searchableFields = Object.entries(config.fields)
      .filter(([, fieldConfig]) => fieldConfig.searchable)
      .map(([fieldName, fieldConfig]) => {
        const tableFields = config.table as unknown as SafeTableAccess;
        const column = tableFields[fieldName];
        if (column && fieldConfig.type === FieldDataType.STRING) {
          return ilike(column, `%${searchTerm}%`);
        }
        return null;
      })
      .filter((condition): condition is SQL => condition !== null);

    if (searchableFields.length === 0) {
      return undefined;
    }

    if (searchableFields.length === 1) {
      return searchableFields[0];
    }

    return or(...searchableFields);
  }

  /**
   * Build condition for a specific field
   */
  private buildFieldCondition<TTable extends PgTable>(
    table: TTable,
    fieldName: string,
    fieldConfig: FieldConfig,
    operation: FilterOperationType,
    value: unknown,
  ): SQL | undefined {
    const tableFields = table as unknown as SafeTableAccess;
    const column = tableFields[fieldName];
    if (!column) {
      return undefined;
    }

    // Transform value if needed
    const transformedValue = fieldConfig.transform
      ? fieldConfig.transform(value)
      : value;

    // Build condition based on operation type
    switch (operation) {
      case FilterOperationType.EQUAL:
        return eq(column, transformedValue);

      case FilterOperationType.NOT_EQUAL:
        return ne(column, transformedValue);

      case FilterOperationType.LIKE:
        if (typeof transformedValue === 'string') {
          return like(column, `%${transformedValue}%`);
        }
        break;

      case FilterOperationType.ILIKE:
        if (typeof transformedValue === 'string') {
          return ilike(column, `%${transformedValue}%`);
        }
        break;

      case FilterOperationType.IN:
        if (Array.isArray(transformedValue)) {
          return inArray(column, transformedValue);
        }
        break;

      case FilterOperationType.NOT_IN:
        if (Array.isArray(transformedValue)) {
          return notInArray(column, transformedValue);
        }
        break;

      case FilterOperationType.GREATER_THAN:
        return gte(column, transformedValue);

      case FilterOperationType.GREATER_THAN_OR_EQUAL:
        return gte(column, transformedValue);

      case FilterOperationType.LESS_THAN:
        return lte(column, transformedValue);

      case FilterOperationType.LESS_THAN_OR_EQUAL:
        return lte(column, transformedValue);

      case FilterOperationType.BETWEEN:
        if (Array.isArray(transformedValue) && transformedValue.length === 2) {
          return between(column, transformedValue[0], transformedValue[1]);
        }
        break;

      case FilterOperationType.IS_NULL:
        return isNull(column);

      case FilterOperationType.IS_NOT_NULL:
        return isNotNull(column);

      default:
        return undefined;
    }

    return undefined;
  }

  /**
   * Build order by clause
   */
  private buildOrderByClause<TTable extends PgTable>(
    config: FilterConfig<TTable>,
    filterInput: IGenericFilterInput,
  ): SQL | undefined {
    const safeInput = filterInput as unknown as SafeFilterInput;
    const sortInfo = safeInput.sort;
    const sortField = sortInfo?.field;
    const sortOrder = sortInfo?.order;

    // Check if field exists and is sortable
    if (!sortField) return undefined;

    const fieldConfig = config.fields[sortField];
    if (!fieldConfig || !fieldConfig.sortable) {
      // Use default sort if specified
      if (config.defaultSort) {
        const defaultFieldName = config.defaultSort.field;
        const defaultFieldConfig = config.fields[defaultFieldName];
        if (defaultFieldConfig && defaultFieldConfig.sortable) {
          const tableFields = config.table as unknown as SafeTableAccess;
          const column = tableFields[defaultFieldName];
          return config.defaultSort.order === 'DESC'
            ? desc(column)
            : asc(column);
        }
      }
      return undefined;
    }

    const tableFields = config.table as unknown as SafeTableAccess;
    const column = tableFields[sortField];
    if (!column) {
      return undefined;
    }

    return sortOrder === 'DESC' ? desc(column) : asc(column);
  }

  /**
   * Apply pagination to query
   */
  applyPagination<T>(query: T, pagination: { page: number; limit: number }): T {
    const offset = (pagination.page - 1) * pagination.limit;

    // Type assertion for query methods
    interface QueryWithPagination {
      limit(limit: number): QueryWithPagination;
      offset(offset: number): T;
    }

    const paginatedQuery = query as unknown as QueryWithPagination;
    return paginatedQuery.limit(pagination.limit).offset(offset);
  }

  /**
   * Validate filter input against configuration
   */
  validateFilterInput(
    config: FilterConfig,
    filterInput: IGenericFilterInput,
  ): string[] {
    const errors: string[] = [];
    const safeInput = filterInput as unknown as SafeFilterInput;

    // Validate field filters
    if (safeInput.filters) {
      Object.entries(safeInput.filters).forEach(
        ([fieldName, filterOperation]) => {
          const fieldConfig = config.fields[fieldName];
          if (!fieldConfig) {
            errors.push(`Field '${fieldName}' is not configured for filtering`);
            return;
          }

          // Check if operation is allowed for this field
          if (!fieldConfig.operations.includes(filterOperation.operation)) {
            errors.push(
              `Operation '${filterOperation.operation}' is not allowed for field '${fieldName}'`,
            );
          }

          // Validate field value type
          const validationError = this.validateFieldValue(
            fieldConfig,
            filterOperation.value,
          );
          if (validationError) {
            errors.push(`Field '${fieldName}': ${validationError}`);
          }
        },
      );
    }

    // Validate sort field
    if (safeInput.sort?.field) {
      const sortField = safeInput.sort.field;
      const fieldConfig = config.fields[sortField];
      if (!fieldConfig) {
        errors.push(`Sort field '${sortField}' is not configured`);
      } else if (!fieldConfig.sortable) {
        errors.push(`Field '${sortField}' is not sortable`);
      }
    }

    return errors;
  }

  /**
   * Validate field value against field configuration
   */
  private validateFieldValue(
    fieldConfig: FieldConfig,
    value: unknown,
  ): string | null {
    if (value === null || value === undefined) {
      return fieldConfig.validation?.required ? 'Value is required' : null;
    }

    switch (fieldConfig.type) {
      case FieldDataType.STRING:
        if (typeof value !== 'string') {
          return 'Value must be a string';
        }
        if (
          fieldConfig.validation?.min &&
          value.length < fieldConfig.validation.min
        ) {
          return `Value must be at least ${fieldConfig.validation.min} characters`;
        }
        if (
          fieldConfig.validation?.max &&
          value.length > fieldConfig.validation.max
        ) {
          return `Value must be at most ${fieldConfig.validation.max} characters`;
        }
        break;

      case FieldDataType.NUMBER:
        if (typeof value !== 'number') {
          return 'Value must be a number';
        }
        if (fieldConfig.validation?.min && value < fieldConfig.validation.min) {
          return `Value must be at least ${fieldConfig.validation.min}`;
        }
        if (fieldConfig.validation?.max && value > fieldConfig.validation.max) {
          return `Value must be at most ${fieldConfig.validation.max}`;
        }
        break;

      case FieldDataType.BOOLEAN:
        if (typeof value !== 'boolean') {
          return 'Value must be a boolean';
        }
        break;

      case FieldDataType.DATE:
        if (!(value instanceof Date) && typeof value !== 'string') {
          return 'Value must be a date';
        }
        break;

      case FieldDataType.ENUM:
        if (
          fieldConfig.validation?.enum &&
          !fieldConfig.validation.enum.includes(value as string)
        ) {
          return `Value must be one of: ${fieldConfig.validation.enum.join(', ')}`;
        }
        break;
    }

    return null;
  }
}
