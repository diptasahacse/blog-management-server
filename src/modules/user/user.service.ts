import { Inject, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { DrizzleProvider } from 'src/drizzle/drizzle.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import * as schema from 'src/drizzle/schemas';
import { LoggerService } from 'src/common/services/logger.service';
import {
  ResourceNotFoundException,
  BusinessLogicException,
} from 'src/common/exceptions/custom.exceptions';

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
