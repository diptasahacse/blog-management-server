import { relations } from 'drizzle-orm';
import { UserTable } from './user.schema';
import { ProfileTable } from './profile.schema';

export const userRelations = relations(UserTable, ({ one }) => ({
  profile: one(ProfileTable, {
    fields: [UserTable.id],
    references: [ProfileTable.userId],
  }),
}));

export const profileRelations = relations(ProfileTable, ({ one }) => ({
  user: one(UserTable, {
    fields: [ProfileTable.userId],
    references: [UserTable.id],
  }),
}));
