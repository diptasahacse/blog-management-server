import { IFindOptions, IPaginatedResult } from './repository.interface';

export interface IBaseService<TEntity, TCreateDto, TUpdateDto> {
  // Standard CRUD operations
  create(createDto: TCreateDto): Promise<IServiceResponse<TEntity>>;
  findAll(
    options?: IFindOptions,
  ): Promise<IServiceResponse<IPaginatedResult<TEntity>>>;
  findOne(id: string): Promise<IServiceResponse<TEntity>>;
  update(id: string, updateDto: TUpdateDto): Promise<IServiceResponse<TEntity>>;
  remove(id: string): Promise<IServiceResponse<boolean>>;

  // Business logic hooks (can be overridden)
  beforeCreate?(createDto: TCreateDto): Promise<void> | void;
  afterCreate?(entity: TEntity, createDto: TCreateDto): Promise<void> | void;

  beforeUpdate?(id: string, updateDto: TUpdateDto): Promise<void> | void;
  afterUpdate?(entity: TEntity, updateDto: TUpdateDto): Promise<void> | void;

  beforeDelete?(id: string): Promise<void> | void;
  afterDelete?(id: string): Promise<void> | void;
}

export interface IServiceResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface IServiceError {
  message: string;
  errors?: Record<string, string>;
  statusCode?: number;
}
