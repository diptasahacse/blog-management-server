import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { sql, eq } from 'drizzle-orm';
import * as schema from 'src/core/database/schemas';
import { DrizzleProvider } from 'src/core/database';
import { CategoryTable } from 'src/core/database/schemas/category.schema';
import { BaseRepository } from '../base/base.repository';

export interface IFindOptions {
  page?: number;
  limit?: number;
  orderBy?: 'asc' | 'desc';
  orderField?: string;
}

export interface IPaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
  };
}

@Injectable()
export class CategoryRepository extends BaseRepository<typeof CategoryTable> {
  protected table = CategoryTable;

  constructor(
    @Inject(DrizzleProvider)
    db: NodePgDatabase<typeof schema>,
  ) {
    super(db);
  }

  // async findAll(
  //   options: IFindOptions = {},
  // ): Promise<IPaginatedResult<typeof CategoryTable.$inferSelect>> {
  //   const {
  //     page = 1,
  //     limit = 10,
  //     orderBy = 'desc',
  //     orderField = 'createdAt',
  //   } = options;
  //   const offset = (Number(page) - 1) * Number(limit);

  //   // Get total count
  //   const totalResult = await this.db
  //     .select({ count: sql<number>`count(*)` })
  //     .from(CategoryTable);
  //   const total = Number(totalResult[0]?.count ?? 0);

  //   // Build order clause
  //   const orderClause = (() => {
  //     if (orderField === 'name') {
  //       return orderBy === 'asc' ? asc(CategoryTable.name) : desc(CategoryTable.name);
  //     } else if (orderField === 'slug') {
  //       return orderBy === 'asc' ? asc(CategoryTable.slug) : desc(CategoryTable.slug);
  //     } else {
  //       return orderBy === 'asc'
  //         ? asc(CategoryTable.createdAt)
  //         : desc(CategoryTable.createdAt);
  //     }
  //   })();

  //   // Execute main query
  //   const results = await this.db
  //     .select()
  //     .from(CategoryTable)
  //     .orderBy(orderClause)
  //     .limit(Number(limit))
  //     .offset(offset);

  //   return {
  //     data: results,
  //     pagination: {
  //       total,
  //       totalPages: Math.ceil(total / Number(limit)),
  //       currentPage: Number(page),
  //       itemsPerPage: Number(limit),
  //     },
  //   };
  // }

  async findOne(id: string) {
    const [result] = await this.db
      .select()
      .from(CategoryTable)
      .where(eq(CategoryTable.id, id))
      .limit(1);
    return result || null;
  }

  async findByName(name: string) {
    const [result] = await this.db
      .select()
      .from(CategoryTable)
      .where(eq(CategoryTable.name, name))
      .limit(1);
    return result || null;
  }

  async update(id: string, data: Partial<typeof CategoryTable.$inferInsert>) {
    const [result] = await this.db
      .update(CategoryTable)
      .set(data)
      .where(eq(CategoryTable.id, id))
      .returning();
    return result;
  }

  async deleteCategory(id: string): Promise<boolean> {
    const result = await this.db
      .delete(CategoryTable)
      .where(eq(CategoryTable.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async exists(id: string): Promise<boolean> {
    const [result] = await this.db
      .select({ exists: sql<boolean>`1` })
      .from(CategoryTable)
      .where(eq(CategoryTable.id, id))
      .limit(1);
    return !!result;
  }

  async count(): Promise<number> {
    const [result] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(CategoryTable);
    return Number(result?.count ?? 0);
  }
}
