import { Inject, Injectable } from '@nestjs/common';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { DrizzleProvider } from 'src/core/database';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from 'src/core/database/schemas';

@Injectable()
export class ProfileService {
  constructor(
    @Inject(DrizzleProvider) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(createProfileDto: CreateProfileDto) {
    const [newProfile] = await this.db
      .insert(schema.ProfileTable)
      .values(createProfileDto)
      .returning();

    return newProfile;
  }

  findAll() {
    return `This action returns all profile`;
  }

  findOne(id: number) {
    return `This action returns a #${id} profile`;
  }

  update(id: number, _updateProfileDto: UpdateProfileDto) {
    return `This action updates a #${id} profile`;
  }

  remove(id: number) {
    return `This action removes a #${id} profile`;
  }
}
