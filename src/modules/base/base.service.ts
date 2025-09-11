import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { ExtendedTable, ID } from './interfaces/repository.interface';

@Injectable()
export abstract class BaseService<
  TTable extends ExtendedTable,
  TRepository extends BaseRepository<TTable> = BaseRepository<TTable>,
> {
  constructor(protected readonly repository: TRepository) {}

  async create(data: TTable['$inferInsert']) {
    return await this.repository.create(data);
  }
  async createMany(data: TTable['$inferInsert'][]) {
    return await this.repository.createMany(data);
  }

  async delete(id: ID): Promise<void> {
    return this.repository.delete(id);
  }

  async deleteMany(ids: ID[]): Promise<void> {
    return this.repository.deleteMany(ids);
  }
}
