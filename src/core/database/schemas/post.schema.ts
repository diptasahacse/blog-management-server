import { timestamp } from 'drizzle-orm/pg-core';
import { text } from 'drizzle-orm/pg-core';
import { pgEnum } from 'drizzle-orm/pg-core';
import { uuid } from 'drizzle-orm/pg-core';
import { pgTable, varchar } from 'drizzle-orm/pg-core';
import { UserTable } from './user.schema';

// Define enum
export const postStatusEnum = pgEnum('status', ['draft', 'published']);
export const PostTable = pgTable('posts', {
  id: uuid().primaryKey().defaultRandom(),
  title: varchar('title', { length: 500 }).notNull(),
  content: text('content').notNull(),
  featureImage: varchar('feature_image', { length: 255 }),
  authorId: uuid('author_id').references(() => UserTable.id),
  status: postStatusEnum('status').notNull().default('draft'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
