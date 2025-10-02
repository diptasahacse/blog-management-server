import { Inject, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FindUsersDto, UserSortField } from './dto/find-users.dto';
import { UserWithProfileResponseDto } from './dto/user-with-profile.dto';
import { DrizzleProvider } from 'src/core/database';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, count, desc, asc, SQL } from 'drizzle-orm';
import * as schema from 'src/core/database/schemas';
import { LoggerService } from 'src/shared/services';
import { ICommonResponse, IPagination } from 'src/shared/types';
import {
  ResourceNotFoundException,
  BusinessLogicException,
} from 'src/shared/exceptions';
import {
  DynamicFilterBuilder,
  FilterCondition,
} from 'src/shared/utils/dynamic-filter-builder';
import { FilterOperatorEnum } from 'src/shared/enums/dynamic-filter-builder.enum';

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

  // async findAll() {
  //   try {
  //     this.logger.log('Fetching all users', 'UserService');
  //     const users = await this.db.select().from(schema.UserTable);
  //     return users;
  //   } catch (error) {
  //     this.logger.error(
  //       'Failed to fetch users',
  //       (error as Error).stack,
  //       'UserService',
  //     );
  //     throw error;
  //   }
  // }

  async findAll(
    filters: FindUsersDto,
  ): Promise<ICommonResponse<UserWithProfileResponseDto[]>> {
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

      // Get paginated results with profile data (exclude password)
      const usersWithProfilesQuery = this.db
        .select({
          user: {
            id: schema.UserTable.id,
            name: schema.UserTable.name,
            email: schema.UserTable.email,
            role: schema.UserTable.role,
            verifiedAt: schema.UserTable.verifiedAt,
            createdAt: schema.UserTable.createdAt,
            updatedAt: schema.UserTable.updatedAt,
          },
          profile: {
            id: schema.ProfileTable.id,
            userId: schema.ProfileTable.userId,
            avatar: schema.ProfileTable.avatar,
            bio: schema.ProfileTable.bio,
            createdAt: schema.ProfileTable.createdAt,
            updatedAt: schema.ProfileTable.updatedAt,
          },
        })
        .from(schema.UserTable)
        .leftJoin(
          schema.ProfileTable,
          eq(schema.UserTable.id, schema.ProfileTable.userId),
        );

      const usersWithProfiles = whereConditions
        ? await usersWithProfilesQuery
            .where(whereConditions)
            .orderBy(orderByClause)
            .limit(limit)
            .offset(offset)
        : await usersWithProfilesQuery
            .orderBy(orderByClause)
            .limit(limit)
            .offset(offset);

      // Transform results to DTOs
      const userDtos = usersWithProfiles.map(
        (row) =>
          new UserWithProfileResponseDto(
            {
              ...row.user,
              verifiedAt: row.user.verifiedAt ?? undefined,
            },
            row.profile?.id ? row.profile : undefined,
          ),
      );

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalCount / limit);
      const pagination: IPagination = {
        totalItems: totalCount,
        itemCount: userDtos.length,
        itemsPerPage: limit,
        totalPages,
        currentPage: page,
      };

      this.logger.log(
        `Found ${userDtos.length} users (page ${page}/${totalPages})`,
        'UserService',
      );

      return {
        data: userDtos,
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

  private buildWhereConditions(filters: FindUsersDto): SQL | undefined {
    const filterBuilder = new DynamicFilterBuilder();

    // Global search across name and email
    if (filters.search) {
      filterBuilder.addSearch({
        fields: [schema.UserTable.name, schema.UserTable.email],
        value: filters.search,
        operator: FilterOperatorEnum.ILIKE,
      });
    }

    // Build filter conditions array
    const conditions: FilterCondition[] = [
      {
        field: schema.UserTable.id,
        operator: FilterOperatorEnum.EQUAL,
        value: filters.id,
      },
      {
        field: schema.UserTable.name,
        operator: FilterOperatorEnum.ILIKE,
        value: filters.name,
        pattern: '%value%',
      },
      {
        field: schema.UserTable.email,
        operator: FilterOperatorEnum.ILIKE,
        value: filters.email,
        pattern: '%value%',
      },
      {
        field: schema.UserTable.role,
        operator: FilterOperatorEnum.EQUAL,
        value: filters.role,
      },
      {
        field: schema.UserTable.createdAt,
        operator: FilterOperatorEnum.GREATER_THAN_OR_EQUAL,
        value: filters.createdFrom ? new Date(filters.createdFrom) : undefined,
      },
      {
        field: schema.UserTable.createdAt,
        operator: FilterOperatorEnum.LESS_THAN_OR_EQUAL,
        value: filters.createdTo ? new Date(filters.createdTo) : undefined,
      },
      {
        field: schema.UserTable.updatedAt,
        operator: FilterOperatorEnum.GREATER_THAN_OR_EQUAL,
        value: filters.updatedFrom ? new Date(filters.updatedFrom) : undefined,
      },
      {
        field: schema.UserTable.updatedAt,
        operator: FilterOperatorEnum.LESS_THAN_OR_EQUAL,
        value: filters.updatedTo ? new Date(filters.updatedTo) : undefined,
      },
    ];

    // Add all conditions to the filter builder
    filterBuilder.addConditions(conditions);

    return filterBuilder.build();
  }

  private buildOrderByClause(filters: FindUsersDto) {
    const sortField =
      (filters.sortBy as UserSortField) || UserSortField.CREATED_AT;
    const sortOrder = filters.sortOrder || 'DESC';

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
    return sortOrder === 'ASC' ? asc(column) : desc(column);
  }

  async findOne(id: string): Promise<UserWithProfileResponseDto> {
    try {
      this.logger.log(`Fetching user with ID: ${id}`, 'UserService');

      const [result] = await this.db
        .select({
          user: {
            id: schema.UserTable.id,
            name: schema.UserTable.name,
            email: schema.UserTable.email,
            role: schema.UserTable.role,
            verifiedAt: schema.UserTable.verifiedAt,
            createdAt: schema.UserTable.createdAt,
            updatedAt: schema.UserTable.updatedAt,
          },
          profile: {
            id: schema.ProfileTable.id,
            userId: schema.ProfileTable.userId,
            avatar: schema.ProfileTable.avatar,
            bio: schema.ProfileTable.bio,
            createdAt: schema.ProfileTable.createdAt,
            updatedAt: schema.ProfileTable.updatedAt,
          },
        })
        .from(schema.UserTable)
        .leftJoin(
          schema.ProfileTable,
          eq(schema.UserTable.id, schema.ProfileTable.userId),
        )
        .where(eq(schema.UserTable.id, id))
        .limit(1);

      if (!result) {
        throw new ResourceNotFoundException('User', id);
      }

      return new UserWithProfileResponseDto(
        {
          ...result.user,
          verifiedAt: result.user.verifiedAt ?? undefined,
        },
        result.profile?.id ? result.profile : undefined,
      );
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

  // Internal method for getting user without profile for other operations
  private async findUserById(id: string) {
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

  // Method for auth service to get user with password
  async findUserWithPassword(id: string) {
    return this.findUserById(id);
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      this.logger.log(`Updating user with ID: ${id}`, 'UserService');

      // First check if user exists
      await this.findUserById(id);

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
      await this.findUserById(id);

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
  async markAsVerified(id: string) {
    try {
      this.logger.log(`Marking user with ID: ${id} as verified`, 'UserService');
      // First check if user exists
      await this.findUserById(id);
      await this.db
        .update(schema.UserTable)
        .set({ verifiedAt: new Date() })
        .where(eq(schema.UserTable.id, id));
      this.logger.log(
        `User marked as verified successfully with ID: ${id}`,
        'UserService',
      );
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to mark user with ID: ${id} as verified`,
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
      await this.findUserById(id);

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
