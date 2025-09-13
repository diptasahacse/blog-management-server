import { PgTable } from 'drizzle-orm/pg-core';
import { SQL } from 'drizzle-orm';

/**
 * Supported filter operation types
 */
export enum FilterOperationType {
  EQUAL = 'eq',
  NOT_EQUAL = 'ne',
  LIKE = 'like',
  ILIKE = 'ilike',
  IN = 'in',
  NOT_IN = 'not_in',
  GREATER_THAN = 'gt',
  GREATER_THAN_OR_EQUAL = 'gte',
  LESS_THAN = 'lt',
  LESS_THAN_OR_EQUAL = 'lte',
  BETWEEN = 'between',
  IS_NULL = 'is_null',
  IS_NOT_NULL = 'is_not_null',
}

/**
 * Supported field data types for filtering
 */
export enum FieldDataType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  ENUM = 'enum',
  UUID = 'uuid',
}

/**
 * Configuration for a single filterable field
 */
export interface FieldConfig {
  /** Field name in the database table */
  name: string;
  /** Data type of the field */
  type: FieldDataType;
  /** Allowed filter operations for this field */
  operations: FilterOperationType[];
  /** Whether this field is included in global search */
  searchable?: boolean;
  /** Whether this field can be used for sorting */
  sortable?: boolean;
  /** Validation rules for the field */
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
    enum?: readonly string[];
  };
  /** Transform function for the field value before filtering */
  transform?: (value: unknown) => unknown;
}

/**
 * Configuration for table relationships
 */
export interface RelationConfig {
  /** Name of the relation (used in queries) */
  name: string;
  /** Target table for the relation */
  targetTable: PgTable;
  /** Join key in the source table */
  sourceKey: string;
  /** Join key in the target table */
  targetKey: string;
  /** Type of join (inner, left, right) */
  joinType?: 'inner' | 'left' | 'right';
  /** Fields from the related table that can be filtered */
  fields?: FieldConfig[];
  /** Nested relations (for deep filtering) */
  relations?: Record<string, RelationConfig>;
}

/**
 * Main configuration for entity filtering
 */
export interface FilterConfig<TTable extends PgTable = PgTable> {
  /** The main database table */
  table: TTable;
  /** Entity name (used for DTO generation) */
  entityName: string;
  /** Filterable fields configuration */
  fields: Record<string, FieldConfig>;
  /** Relations configuration */
  relations?: Record<string, RelationConfig>;
  /** Default pagination settings */
  pagination?: {
    defaultLimit: number;
    maxLimit: number;
  };
  /** Default sorting */
  defaultSort?: {
    field: string;
    order: 'ASC' | 'DESC';
  };
}

/**
 * Filter input structure
 */
export interface FilterInput {
  /** Global search across searchable fields */
  search?: string;
  /** Field-specific filters */
  filters?: Record<
    string,
    {
      operation: FilterOperationType;
      value: unknown;
    }
  >;
  /** Relation filters (nested) */
  relations?: Record<string, FilterInput>;
  /** Pagination */
  pagination?: {
    page: number;
    limit: number;
  };
  /** Sorting */
  sort?: {
    field: string;
    order: 'ASC' | 'DESC';
  };
}

/**
 * Query result structure
 */
export interface FilterResult<T = unknown> {
  /** Query data */
  data: T[];
  /** Pagination metadata */
  pagination: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  /** Applied filters information */
  appliedFilters: {
    search?: string;
    filters: Record<string, unknown>;
    relations: Record<string, unknown>;
    sort: {
      field: string;
      order: 'ASC' | 'DESC';
    };
  };
}

/**
 * Query builder context
 */
export interface QueryBuilderContext {
  /** Main table alias */
  mainAlias: string;
  /** Relation aliases mapping */
  relationAliases: Record<string, string>;
  /** Applied joins */
  joins: SQL[];
  /** Where conditions */
  conditions: SQL[];
  /** Order by clauses */
  orderBy: SQL[];
}
