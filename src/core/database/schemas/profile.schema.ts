import { timestamp } from 'drizzle-orm/pg-core';
import { uuid } from 'drizzle-orm/pg-core';
import { pgTable } from 'drizzle-orm/pg-core';
import { UserTable } from './user.schema';
import { varchar } from 'drizzle-orm/pg-core';
import { text } from 'drizzle-orm/pg-core';

export const ProfileTable = pgTable('profiles', {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => UserTable.id, {
      onDelete: 'cascade',
    })
    .notNull()
    .unique(), // Ensure one-to-one relationship
  avatar: varchar('avatar', { length: 255 }),
  bio: text('bio'),
  createdAt: timestamp('created_at', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(), // Creation timestamp
  updatedAt: timestamp('updated_at', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(), // Last update timestamp
});
