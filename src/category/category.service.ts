import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { DrizzleProvider } from 'src/drizzle/drizzle.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from 'src/drizzle/schemas';
import { asc, eq, sql } from 'drizzle-orm';
import { type IQueryOptions } from 'src/types/common';
import { CategoryFilterEnum } from './category.filter.enum';
import { desc } from 'drizzle-orm';

@Injectable()
export class CategoryService {
  constructor(
    @Inject(DrizzleProvider) private readonly db: NodePgDatabase<typeof schema>,
  ) {}
  async create(createCategoryDto: CreateCategoryDto) {
    const isExist = await this.db
      .select()
      .from(schema.CategoryTable)
      .where(sql`${schema.CategoryTable.name} = ${createCategoryDto.name}`);

    if (isExist.length) {
      throw new BadRequestException({
        message: 'Provided Category already exists',
        errors: {
          name: `${createCategoryDto.name} already exists`,
        },
      });
    }

    return await this.db
      .insert(schema.CategoryTable)
      .values(createCategoryDto)
      .returning();
  }

  async findAll(queryData?: IQueryOptions) {
    const { page = 1, limit = 10, ...query } = queryData ?? {};
    const offset = (Number(page) - 1) * Number(limit);
    // get total count
    const totalResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.CategoryTable);
    const total = Number(totalResult[0]?.count ?? 0);

    return {
      data: await this.db
        .select()
        .from(schema.CategoryTable)
        .orderBy(desc(schema.CategoryTable.createdAt))
        .limit(Number(limit))
        .offset(offset),
      pagination: {
        total: total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  async findOne(id: string) {
    const [result] = await this.db
      .select()
      .from(schema.CategoryTable)
      .where(sql`${schema.CategoryTable.id} = ${id}`)
      .limit(1);
    console.log(result);

    if (!result) {
      throw new NotFoundException({
        message: 'Category not found',
      });
    }
    return {
      data: result,
      message: 'Category fetched successfully',
    };
  }

  update(id: number, updateCategoryDto: UpdateCategoryDto) {
    return `This action updates a #${id} category`;
  }

  remove(id: number) {
    return `This action removes a #${id} category`;
  }
}
