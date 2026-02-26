import { PaginationParams, PaginationMeta } from '../types';

export interface IRepository<T> {
  /**
   * Find by ID
   */
  findById(id: number | string): Promise<T | null>;

  /**
   * Find one by condition
   */
  findOne(where: any): Promise<T | null>;

  /**
   * Find many with pagination
   */
  findMany(params: {
    where?: any;
    orderBy?: any;
  } & PaginationParams): Promise<{ data: T[]; meta: PaginationMeta }>;

  /**
   * Find all
   */
  findAll(where?: any, orderBy?: any): Promise<T[]>;

  /**
   * Create
   */
  create(data: any): Promise<T>;

  /**
   * Update
   */
  update(id: number | string, data: any): Promise<T>;

  /**
   * Delete
   */
  delete(id: number | string): Promise<T>;

  /**
   * Count
   */
  count(where?: any): Promise<number>;

  /**
   * Exists
   */
  exists(where: any): Promise<boolean>;
}
