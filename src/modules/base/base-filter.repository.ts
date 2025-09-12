import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { PgTable } from 'drizzle-orm/pg-core';
import { count } from 'drizzle-orm';
import { DrizzleProvider } from 'src/core/database';
import * as schema from 'src/core/database/schemas';
import { IGenericFilterInput } from 'src/common/dto/dynamic-filter.dto';
import { ICommonResponse, IPagination } from 'src/shared/types';

@Injectable()
export abstract class BaseFilterRepository<TTable extends PgTable> {
  protected db: NodePgDatabase<typeof schema>;
  protected table: TTable;

  constructor(
    @Inject(DrizzleProvider)
    db: NodePgDatabase<typeof schema>,
    table: TTable,
  ) {
    this.db = db;
    this.table = table;
  }

  /**
   * Generic find with filters method - basic implementation
   */
  async findWithFilters<TResult = any>(
    filterInput: IGenericFilterInput,
  ): Promise<ICommonResponse<TResult[]>> {
    // Calculate pagination
    const page: number = filterInput.pagination?.page || 1;
    const limit: number = filterInput.pagination?.limit || 10;
    const offset: number = (page - 1) * limit;

    try {
      // Simple count query
      const countResult = await this.db
        .select({ totalCount: count() })
        .from(this.table as any);

      const totalCount: number = Number(countResult[0]?.totalCount || 0);

      // Simple main query
      const results = await this.db
        .select()
        .from(this.table as any)
        .limit(limit)
        .offset(offset);

      // Calculate pagination metadata
      const totalPages: number = Math.ceil(totalCount / limit);
      const pagination: IPagination = {
        totalItems: totalCount,
        itemCount: results.length,
        itemsPerPage: limit,
        totalPages,
        currentPage: page,
      };

      return {
        data: results as TResult[],
        pagination,
      };
    } catch (error) {
      throw new Error(`Failed to execute query: ${String(error)}`);
    }
  }

  /**
   * Basic validation
   */
  validateFilterInput(filterInput: IGenericFilterInput): string[] {
    const errors: string[] = [];

    if (
      filterInput.pagination?.page !== undefined &&
      filterInput.pagination.page < 1
    ) {
      errors.push('Page must be greater than 0');
    }

    if (
      filterInput.pagination?.limit !== undefined &&
      filterInput.pagination.limit > 100
    ) {
      errors.push('Limit cannot exceed 100');
    }

    return errors;
  }
}
