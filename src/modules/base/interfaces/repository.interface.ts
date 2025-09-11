import { SQLWrapper } from 'drizzle-orm';
import { PgTable } from 'drizzle-orm/pg-core';
export type ExtendedTable = PgTable & { id: SQLWrapper };
export type ID = string | number;
export interface IBaseRepository<TTable extends ExtendedTable> {
  // Basic CRUD operations
  create(data: TTable['$inferInsert']): Promise<TTable['$inferSelect']>;
  createMany(data: TTable['$inferInsert'][]): Promise<TTable['$inferSelect'][]>;

  //   findAll(
  //     options?: IFindOptions,
  //   ): Promise<IPaginatedResult<TTable['$inferSelect']>>;
  //   findOne(id: ID): Promise<TTable['$inferSelect'] | null>;
  //   findOneBy(where: SQL): Promise<TEntity | null>;
  //   findBy(where: SQL, options?: IFindOptions): Promise<TEntity[]>;

  //   update(id: string, data: TUpdate): Promise<TEntity>;
  //   updateBy(where: SQL, data: TUpdate): Promise<TEntity[]>;

  delete(id: ID): Promise<void>;
  deleteMany(ids: ID[]): Promise<void>;
  // Utility methods
  //   exists(id: string): Promise<boolean>;
  //   existsBy(where: SQL): Promise<boolean>;
  //   count(where?: SQL): Promise<number>;
}

export interface IFindOptions {
  page?: number;
  limit?: number;
  orderBy?: 'asc' | 'desc';
  orderField?: string;
  select?: string[];
  include?: string[];
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
