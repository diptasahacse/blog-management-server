import { Inject, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FindUsersDto, UserSortField, SortOrder } from './dto/find-users.dto';
import { DrizzleProvider } from 'src/core/database';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, or, gte, lte, count, ilike, desc, asc } from 'drizzle-orm';
import * as schema from 'src/core/database/schemas';
import { LoggerService } from 'src/shared/services';
import { ICommonResponse, IPagination } from 'src/shared/types';
import {
  ResourceNotFoundException,
  BusinessLogicException,
} from 'src/shared/exceptions';

@Injectable()
export class UserService {
  constructor(
    @Inject(DrizzleProvider) private readonly db: NodePgDatabase<typeof schema>,
    private readonly logger: LoggerService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    try {
      this.logger.log('Creating new user', 'UserService');

      // Check if user already exists
      const existingUser = await this.db
        .select()
        .from(schema.UserTable)
        .where(eq(schema.UserTable.email, createUserDto.email))
        .limit(1);

      if (existingUser.length > 0) {
        throw new BusinessLogicException(
          `User with email '${createUserDto.email}' already exists`,
        );
      }

      const [newUser] = await this.db
        .insert(schema.UserTable)
        .values(createUserDto)
        .returning();

      this.logger.log(
        `User created successfully with ID: ${newUser.id}`,
        'UserService',
      );
      return newUser;
    } catch (error) {
      this.logger.error(
        'Failed to create user',
        (error as Error).stack,
        'UserService',
      );
      throw error; // Re-throw to let global handler manage it
    }
  }

  async findAll() {
    try {
      this.logger.log('Fetching all users', 'UserService');
      const users = await this.db.select().from(schema.UserTable);
      return users;
    } catch (error) {
      this.logger.error(
        'Failed to fetch users',
        (error as Error).stack,
        'UserService',
      );
      throw error;
    }
  }

  async findUsers(
    filters: FindUsersDto,
  ): Promise<
    ICommonResponse<Omit<typeof schema.UserTable.$inferSelect, 'password'>[]>
  > {
    try {
      this.logger.log('Fetching users with filters', 'UserService');

      // Build dynamic where conditions
      const whereConditions = this.buildWhereConditions(filters);

      // Build order by clause
      const orderByClause = this.buildOrderByClause(filters);

      // Calculate pagination
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const offset = (page - 1) * limit;

      // Get total count
      const countQuery = this.db
        .select({ totalCount: count() })
        .from(schema.UserTable);

      const [{ totalCount }] = whereConditions
        ? await countQuery.where(whereConditions)
        : await countQuery;

      // Get paginated results (exclude password)
      const usersQuery = this.db
        .select({
          id: schema.UserTable.id,
          name: schema.UserTable.name,
          email: schema.UserTable.email,
          role: schema.UserTable.role,
          verifiedAt: schema.UserTable.verifiedAt,
          createdAt: schema.UserTable.createdAt,
          updatedAt: schema.UserTable.updatedAt,
        })
        .from(schema.UserTable);

      const users = whereConditions
        ? await usersQuery
            .where(whereConditions)
            .orderBy(orderByClause)
            .limit(limit)
            .offset(offset)
        : await usersQuery.orderBy(orderByClause).limit(limit).offset(offset);

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalCount / limit);
      const pagination: IPagination = {
        totalItems: totalCount,
        itemCount: users.length,
        itemsPerPage: limit,
        totalPages,
        currentPage: page,
      };

      this.logger.log(
        `Found ${users.length} users (page ${page}/${totalPages})`,
        'UserService',
      );

      return {
        data: users,
        pagination,
      };
    } catch (error) {
      this.logger.error(
        'Failed to fetch users with filters',
        (error as Error).stack,
        'UserService',
      );
      throw error;
    }
  }

  private buildWhereConditions(filters: FindUsersDto) {
    const conditions: any[] = [];

    // Global search across name and email
    if (filters.search) {
      conditions.push(
        or(
          ilike(schema.UserTable.name, `%${filters.search}%`),
          ilike(schema.UserTable.email, `%${filters.search}%`),
        ),
      );
    }

    // Specific field filters
    if (filters.id) {
      conditions.push(eq(schema.UserTable.id, filters.id));
    }

    if (filters.name) {
      conditions.push(ilike(schema.UserTable.name, `%${filters.name}%`));
    }

    if (filters.email) {
      conditions.push(ilike(schema.UserTable.email, `%${filters.email}%`));
    }

    if (filters.role) {
      conditions.push(eq(schema.UserTable.role, filters.role));
    }

    // Date range filters
    if (filters.createdFrom) {
      conditions.push(
        gte(schema.UserTable.createdAt, new Date(filters.createdFrom)),
      );
    }

    if (filters.createdTo) {
      conditions.push(
        lte(schema.UserTable.createdAt, new Date(filters.createdTo)),
      );
    }

    if (filters.updatedFrom) {
      conditions.push(
        gte(schema.UserTable.updatedAt, new Date(filters.updatedFrom)),
      );
    }

    if (filters.updatedTo) {
      conditions.push(
        lte(schema.UserTable.updatedAt, new Date(filters.updatedTo)),
      );
    }

    // Return combined conditions or undefined if no conditions
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return conditions.length > 0 ? and(...conditions) : undefined;
  }

  private buildOrderByClause(filters: FindUsersDto) {
    const sortField = filters.sortBy || UserSortField.CREATED_AT;
    const sortOrder = filters.sortOrder || SortOrder.DESC;

    // Map enum values to actual column references
    const fieldMap = {
      [UserSortField.ID]: schema.UserTable.id,
      [UserSortField.NAME]: schema.UserTable.name,
      [UserSortField.EMAIL]: schema.UserTable.email,
      [UserSortField.ROLE]: schema.UserTable.role,
      [UserSortField.CREATED_AT]: schema.UserTable.createdAt,
      [UserSortField.UPDATED_AT]: schema.UserTable.updatedAt,
    };

    const column = fieldMap[sortField];
    return sortOrder === SortOrder.ASC ? asc(column) : desc(column);
  }

  async findOne(id: string) {
    try {
      this.logger.log(`Fetching user with ID: ${id}`, 'UserService');

      const [user] = await this.db
        .select()
        .from(schema.UserTable)
        .where(eq(schema.UserTable.id, id))
        .limit(1);

      if (!user) {
        throw new ResourceNotFoundException('User', id);
      }

      return user;
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error; // Re-throw custom exceptions as-is
      }
      this.logger.error(
        `Failed to fetch user with ID: ${id}`,
        (error as Error).stack,
        'UserService',
      );
      throw error;
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      this.logger.log(`Updating user with ID: ${id}`, 'UserService');

      // First check if user exists
      await this.findOne(id);

      // Check for email conflicts if email is being updated
      if (updateUserDto.email) {
        const existingUser = await this.db
          .select()
          .from(schema.UserTable)
          .where(eq(schema.UserTable.email, updateUserDto.email))
          .limit(1);

        if (existingUser.length > 0 && existingUser[0].id !== id) {
          throw new BusinessLogicException(
            `Email '${updateUserDto.email}' is already in use by another user`,
          );
        }
      }

      const [updatedUser] = await this.db
        .update(schema.UserTable)
        .set(updateUserDto)
        .where(eq(schema.UserTable.id, id))
        .returning();

      this.logger.log(
        `User updated successfully with ID: ${id}`,
        'UserService',
      );
      return updatedUser;
    } catch (error) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof BusinessLogicException
      ) {
        throw error;
      }
      this.logger.error(
        `Failed to update user with ID: ${id}`,
        (error as Error).stack,
        'UserService',
      );
      throw error;
    }
  }

  async remove(id: string) {
    try {
      this.logger.log(`Removing user with ID: ${id}`, 'UserService');

      // First check if user exists
      await this.findOne(id);

      await this.db.delete(schema.UserTable).where(eq(schema.UserTable.id, id));

      this.logger.log(
        `User removed successfully with ID: ${id}`,
        'UserService',
      );
      return { message: `User with ID ${id} has been removed successfully` };
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to remove user with ID: ${id}`,
        (error as Error).stack,
        'UserService',
      );
      throw error;
    }
  }

  async findByEmail(email: string) {
    try {
      this.logger.log(`Fetching user with email: ${email}`, 'UserService');

      const [user] = await this.db
        .select()
        .from(schema.UserTable)
        .where(eq(schema.UserTable.email, email))
        .limit(1);

      return user || null;
    } catch (error) {
      this.logger.error(
        `Failed to fetch user with email: ${email}`,
        (error as Error).stack,
        'UserService',
      );
      throw error;
    }
  }

  async findById(id: string) {
    return this.findOne(id);
  }

  async updatePassword(id: string, hashedPassword: string) {
    try {
      this.logger.log(
        `Updating password for user with ID: ${id}`,
        'UserService',
      );

      // First check if user exists
      await this.findOne(id);

      await this.db
        .update(schema.UserTable)
        .set({ password: hashedPassword, updatedAt: new Date() })
        .where(eq(schema.UserTable.id, id));

      this.logger.log(
        `Password updated successfully for user with ID: ${id}`,
        'UserService',
      );
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to update password for user with ID: ${id}`,
        (error as Error).stack,
        'UserService',
      );
      throw error;
    }
  }
}
