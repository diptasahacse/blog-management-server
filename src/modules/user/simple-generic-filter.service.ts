import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { DrizzleProvider } from 'src/core/database';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from 'src/core/database/schemas';
import { eq, and, or, gte, lte, count, ilike, desc, asc } from 'drizzle-orm';
import { ICommonResponse, IPagination } from 'src/shared/types';

/**
 * WARNING: This service demonstrates a simplified approach but has type safety issues
 * with Drizzle ORM's strict typing system. For production use, prefer the
 * BaseFilterRepository and DynamicQueryBuilderService which provide full type safety.
 *
 * This service is kept as an example of direct table operations but should not be
 * used in production without proper type handling.
 */

// Simplified filter input interface
export interface SimpleFilterInput {
  search?: string;
  fields?: Record<
    string,
    {
      operation: 'eq' | 'ne' | 'like' | 'ilike' | 'gte' | 'lte' | 'in';
      value: any;
    }
  >;
  pagination?: {
    page: number;
    limit: number;
  };
  sort?: {
    field: string;
    order: 'ASC' | 'DESC';
  };
}

// Configuration interface
export interface SimpleFilterConfig {
  tableName: string;
  searchableFields: string[];
  filterableFields: string[];
  sortableFields: string[];
}

@Injectable()
export class SimpleGenericFilterService {
  constructor(
    @Inject(DrizzleProvider)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  /**
   * Type-safe User filtering method
   */
  async filterUsers(input: SimpleFilterInput): Promise<ICommonResponse<any[]>> {
    const conditions: any[] = [];

    // Global search
    if (input.search) {
      const searchConditions = [
        ilike(schema.UserTable.name, `%${input.search}%`),
        ilike(schema.UserTable.email, `%${input.search}%`),
      ];
      conditions.push(or(...searchConditions));
    }

    // Field-specific filters
    if (input.fields) {
      Object.entries(input.fields).forEach(([fieldName, filter]) => {
        switch (fieldName) {
          case 'name':
            if (filter.operation === 'eq') {
              conditions.push(
                eq(schema.UserTable.name, filter.value as string),
              );
            } else if (filter.operation === 'ilike') {
              conditions.push(
                ilike(schema.UserTable.name, filter.value as string),
              );
            }
            break;
          case 'email':
            if (filter.operation === 'eq') {
              conditions.push(
                eq(schema.UserTable.email, filter.value as string),
              );
            } else if (filter.operation === 'ilike') {
              conditions.push(
                ilike(schema.UserTable.email, filter.value as string),
              );
            }
            break;
          case 'role':
            if (filter.operation === 'eq') {
              conditions.push(eq(schema.UserTable.role, filter.value as any));
            }
            break;
          case 'createdAt':
            if (filter.operation === 'gte') {
              conditions.push(
                gte(schema.UserTable.createdAt, filter.value as Date),
              );
            } else if (filter.operation === 'lte') {
              conditions.push(
                lte(schema.UserTable.createdAt, filter.value as Date),
              );
            }
            break;
          case 'updatedAt':
            if (filter.operation === 'gte') {
              conditions.push(
                gte(schema.UserTable.updatedAt, filter.value as Date),
              );
            } else if (filter.operation === 'lte') {
              conditions.push(
                lte(schema.UserTable.updatedAt, filter.value as Date),
              );
            }
            break;
        }
      });
    }

    // Pagination
    const page = input.pagination?.page || 1;
    const limit = input.pagination?.limit || 10;
    const offset = (page - 1) * limit;

    // Count query
    let countQuery = this.db
      .select({ totalCount: count() })
      .from(schema.UserTable);
    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions)) as any;
    }
    const [{ totalCount }] = await countQuery;

    // Main query
    let mainQuery = this.db.select().from(schema.UserTable);
    if (conditions.length > 0) {
      mainQuery = mainQuery.where(and(...conditions)) as any;
    }

    // Sorting
    if (input.sort) {
      const sortFn = input.sort.order === 'DESC' ? desc : asc;
      switch (input.sort.field) {
        case 'name':
          mainQuery = mainQuery.orderBy(sortFn(schema.UserTable.name)) as any;
          break;
        case 'email':
          mainQuery = mainQuery.orderBy(sortFn(schema.UserTable.email)) as any;
          break;
        case 'role':
          mainQuery = mainQuery.orderBy(sortFn(schema.UserTable.role)) as any;
          break;
        case 'createdAt':
          mainQuery = mainQuery.orderBy(
            sortFn(schema.UserTable.createdAt),
          ) as any;
          break;
        case 'updatedAt':
          mainQuery = mainQuery.orderBy(
            sortFn(schema.UserTable.updatedAt),
          ) as any;
          break;
      }
    }

    // Execute with pagination
    const results = await mainQuery.limit(limit).offset(offset);

    // Pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const pagination: IPagination = {
      totalItems: totalCount,
      itemCount: results.length,
      itemsPerPage: limit,
      totalPages,
      currentPage: page,
    };

    return {
      data: results,
      pagination,
    };
  }

  /**
   * Example: Search users with role filter
   */
  async searchAdminUsers(searchTerm?: string) {
    return this.filterUsers({
      search: searchTerm,
      fields: {
        role: { operation: 'eq', value: 'ADMIN' },
      },
      pagination: { page: 1, limit: 10 },
      sort: { field: 'createdAt', order: 'DESC' },
    });
  }

  /**
   * Example: Date range filtering
   */
  async getUsersCreatedAfter(date: Date) {
    return this.filterUsers({
      fields: {
        createdAt: { operation: 'gte', value: date },
      },
      pagination: { page: 1, limit: 20 },
      sort: { field: 'createdAt', order: 'DESC' },
    });
  }

  /**
   * Example: Complex filtering
   */
  async getActiveUsersWithNameFilter(nameFilter: string) {
    return this.filterUsers({
      fields: {
        name: { operation: 'ilike', value: `%${nameFilter}%` },
        // Add verified filter when we have the field
        // verifiedAt: { operation: 'is_not_null', value: null },
      },
      pagination: { page: 1, limit: 15 },
      sort: { field: 'name', order: 'ASC' },
    });
  }
}
