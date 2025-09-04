import { timestamp } from 'drizzle-orm/pg-core';
import { pgEnum } from 'drizzle-orm/pg-core';
import { uuid } from 'drizzle-orm/pg-core';
import { pgTable, varchar } from 'drizzle-orm/pg-core';

// Define enum
export const userRoleEnum = pgEnum('user_role', ['admin', 'user']);
export const UserTable = pgTable('users', {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  role: userRoleEnum('role').notNull().default('user'),
  verifiedAt: timestamp('verified_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
