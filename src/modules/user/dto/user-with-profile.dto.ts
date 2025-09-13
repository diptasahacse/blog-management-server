import { ProfileTable } from 'src/core/database/schemas';

export class ProfileResponseDto {
  id: string;
  avatar?: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(profile: typeof ProfileTable.$inferSelect) {
    this.id = profile.id;
    this.avatar = profile.avatar ?? undefined;
    this.bio = profile.bio ?? undefined;
    this.createdAt = profile.createdAt;
    this.updatedAt = profile.updatedAt;
  }
}

export class UserWithProfileResponseDto {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  profile: ProfileResponseDto | null = null;

  constructor(
    user: {
      id: string;
      name: string;
      email: string;
      role: 'admin' | 'user';
      verifiedAt?: Date;
      createdAt: Date;
      updatedAt: Date;
    },
    profile?: typeof ProfileTable.$inferSelect,
  ) {
    this.id = user.id;
    this.name = user.name;
    this.email = user.email;
    this.role = user.role;
    this.verifiedAt = user.verifiedAt;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
    this.profile = profile ? new ProfileResponseDto(profile) : null;
  }
}
