import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, inArray } from 'drizzle-orm';
import * as schema from 'src/core/database/schemas';
import { DrizzleProvider } from 'src/core/database';
import {
  ExtendedTable,
  IBaseRepository,
  ID,
} from './interfaces/repository.interface';

@Injectable()
export abstract class BaseRepository<TTable extends ExtendedTable>
  implements IBaseRepository<TTable>
{
  protected abstract table: TTable;

  constructor(
    @Inject(DrizzleProvider)
    protected readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(data: TTable['$inferInsert']): Promise<TTable['$inferSelect']> {
    const records = await this.db.insert(this.table).values(data).returning();
    return records[0];
  }

  async createMany(
    data: TTable['$inferInsert'][],
  ): Promise<TTable['$inferSelect'][]> {
    const results = await this.db.insert(this.table).values(data).returning();
    return results;
  }

  //   async findAll(
  //     options: IFindOptions = {},
  //   ): Promise<IPaginatedResult<TTable['$inferSelect']>> {
  //     const { page = 1, limit = 10, orderBy = 'desc', orderField } = options;
  //     const offset = (Number(page) - 1) * Number(limit);

  //     const totalResult = await this.db
  //       .select({ count: sql<number>`count(*)` })
  //       .from(this.table);
  //     const total = Number(totalResult[0]?.count ?? 0);

  //     // Resolve ordering column
  //     let orderColumn: keyof TEntity & string;
  //     if (orderField && orderField in this.table) {
  //       orderColumn = orderField as keyof TEntity & string;
  //     } else if ('createdAt' in this.table) {
  //       orderColumn = 'createdAt' as keyof TEntity & string;
  //     } else {
  //       orderColumn = this.primaryKey;
  //     }

  //     const orderClause =
  //       orderBy === 'asc'
  //         ? asc(this.table[orderColumn])
  //         : desc(this.table[orderColumn]);

  //     const results = await this.db
  //       .select()
  //       .from(this.table)
  //       .orderBy(orderClause)
  //       .limit(Number(limit))
  //       .offset(offset);

  //     return {
  //       data: results as TEntity[],
  //       pagination: {
  //         total,
  //         totalPages: Math.ceil(total / Number(limit)),
  //         currentPage: Number(page),
  //         itemsPerPage: Number(limit),
  //       },
  //     };
  //   }

  //   async findOne(id: string | number): Promise<TTable['$inferSelect'] | null> {
  //     const [result] = await this.db
  //       .select()
  //       .from(this.table)
  //       .where(eq(this.table.id, id))
  //       .execute();
  //     return result;
  //   }

  //   async findOneBy(where: SQL): Promise<TTable['$inferSelect'] | null> {
  //     const [result] = await this.db
  //       .select()
  //       .from(this.table)
  //       .where(where)
  //       .limit(1);
  //     return (result as TEntity) || null;
  //   }

  //   async findBy(where: SQL, options: IFindOptions = {}): Promise<TEntity[]> {
  //     const { limit, orderBy = 'desc', orderField } = options;

  //     let query = this.db.select().from(this.table).where(where);

  //     if (orderField && orderField in this.table) {
  //       const orderClause =
  //         orderBy === 'asc'
  //           ? asc(this.table[orderField as keyof TEntity & string])
  //           : desc(this.table[orderField as keyof TEntity & string]);
  //       query = query.orderBy(orderClause);
  //     }

  //     if (limit) {
  //       query = query.limit(Number(limit));
  //     }

  //     const results = await query;
  //     return results as TEntity[];
  //   }

  //   async update(id: string, data: TUpdate): Promise<TEntity> {
  //     const [result] = await this.db
  //       .update(this.table)
  //       .set(data)
  //       .where(eq(this.table[this.primaryKey], id))
  //       .returning();
  //     return result as TEntity;
  //   }

  //   async updateBy(where: SQL, data: TUpdate): Promise<TEntity[]> {
  //     const results = await this.db
  //       .update(this.table)
  //       .set(data)
  //       .where(where)
  //       .returning();
  //     return results as TEntity[];
  //   }

  async delete(id: ID): Promise<void> {
    await this.db.delete(this.table).where(eq(this.table.id, id));
  }
  async deleteMany(ids: ID[]): Promise<void> {
    await this.db.delete(this.table).where(inArray(this.table.id, ids));
  }
}
