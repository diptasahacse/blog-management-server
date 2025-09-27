import { relations } from 'drizzle-orm';
import { ProfileTable } from './profile.schema';
import { UserTable } from './user.schema';

// User <-> Profile
export const userProfileRelation = relations(UserTable, ({ one }) => ({
  profile: one(ProfileTable, {
    fields: [UserTable.id],
    references: [ProfileTable.userId],
  }),
}));

// Profile <-> User
export const profileUserRelation = relations(ProfileTable, ({ one }) => ({
  user: one(UserTable, {
    fields: [ProfileTable.userId],
    references: [UserTable.id],
  }),
}));
