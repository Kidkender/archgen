export interface IService {
  /**
   * Execute service logic
   */
  execute(...args: any[]): Promise<any>;
}

export interface ICrudService<T, CreateDTO, UpdateDTO> {
  /**
   * Create new entity
   */
  create(data: CreateDTO): Promise<T>;

  /**
   * Find entity by ID
   */
  findById(id: number | string): Promise<T | null>;

  /**
   * Find all entities
   */
  findAll(filters?: any): Promise<T[]>;

  /**
   * Update entity
   */
  update(id: number | string, data: UpdateDTO): Promise<T>;

  /**
   * Delete entity
   */
  delete(id: number | string): Promise<void>;
}
