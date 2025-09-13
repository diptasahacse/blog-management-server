import { uuid } from 'drizzle-orm/pg-core';
import { pgTable } from 'drizzle-orm/pg-core';
import { PostTable } from './post.schema';
import { CategoryTable } from './category.schema';
import { primaryKey } from 'drizzle-orm/pg-core';
export const PostCategoryTable = pgTable(
  'post_categories',
  {
    postId: uuid('post_id').references(() => PostTable.id, {
      onDelete: 'cascade',
    }),
    categoryId: uuid('category_id').references(() => CategoryTable.id, {
      onDelete: 'cascade',
    }),
  },
  (table) => [primaryKey({ columns: [table.postId, table.categoryId] })],
);
