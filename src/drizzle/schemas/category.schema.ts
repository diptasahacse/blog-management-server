import { timestamp } from 'drizzle-orm/pg-core';
import { uuid } from 'drizzle-orm/pg-core';
import { pgTable, varchar } from 'drizzle-orm/pg-core';
export const CategoryTable = pgTable('categories', {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar('name', { length: 500 }).notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
