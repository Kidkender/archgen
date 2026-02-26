import { PrismaClient } from '@prisma/client';
import { PaginationParams, PaginationMeta } from '../types';
import { buildPaginationMeta, calculateOffset } from '../utils/pagination.util';

export abstract class BaseRepository<T> {
  protected prisma: PrismaClient;
  protected modelName: string;

  constructor(prisma: PrismaClient, modelName: string) {
    this.prisma = prisma;
    this.modelName = modelName;
  }

  /**
   * Find by ID
   */
  async findById(id: number | string): Promise<T | null> {
    const model = this.getModel();
    return await model.findUnique({
      where: { id },
    });
  }

  /**
   * Find one by condition
   */
  async findOne(where: any): Promise<T | null> {
    const model = this.getModel();
    return await model.findFirst({
      where,
    });
  }

  /**
   * Find many with pagination
   */
  async findMany(
    params: {
      where?: any;
      orderBy?: any;
      select?: any;
    } & PaginationParams
  ): Promise<{ data: T[]; meta: PaginationMeta }> {
    const { where, orderBy, select, page, limit } = params;
    const model = this.getModel();

    const [data, total] = await Promise.all([
      model.findMany({
        where,
        orderBy,
        select,
        skip: calculateOffset(page, limit),
        take: limit,
      }),
      model.count({ where }),
    ]);

    return {
      data,
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  /**
   * Find all (no pagination)
   */
  async findAll(where?: any, orderBy?: any): Promise<T[]> {
    const model = this.getModel();
    return await model.findMany({
      where,
      orderBy,
    });
  }

  /**
   * Create
   */
  async create(data: any): Promise<T> {
    const model = this.getModel();
    return await model.create({
      data,
    });
  }

  /**
   * Update
   */
  async update(id: number | string, data: any): Promise<T> {
    const model = this.getModel();
    return await model.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete
   */
  async delete(id: number | string): Promise<T> {
    const model = this.getModel();
    return await model.delete({
      where: { id },
    });
  }

  /**
   * Count
   */
  async count(where?: any): Promise<number> {
    const model = this.getModel();
    return await model.count({ where });
  }

  /**
   * Exists
   */
  async exists(where: any): Promise<boolean> {
    const count = await this.count(where);
    return count > 0;
  }

  /**
   * Get Prisma model
   */
  protected getModel(): any {
    return (this.prisma as any)[this.modelName];
  }

  /**
   * Start transaction
   */
  async transaction<R>(fn: (tx: PrismaClient) => Promise<R>): Promise<R> {
    return await this.prisma.$transaction(fn);
  }
}
