import { FastifyReply, FastifyRequest } from "fastify";


export interface IController {

  /**
   * Handle HTTP request
   */
  handle(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<any>;
}

export interface ICrudController<T> {
  /**
   * Create resource
   */
  create(request: FastifyRequest, reply: FastifyReply): Promise<T>;

  /**
   * Get resource by ID
   */
  getById(request: FastifyRequest, reply: FastifyReply): Promise<T | null>;

  /**
   * List resources
   */
  list(request: FastifyRequest, reply: FastifyReply): Promise<T[]>;

  /**
   * Update resource
   */
  update(request: FastifyRequest, reply: FastifyReply): Promise<T>;

  /**
   * Delete resource
   */
  delete(request: FastifyRequest, reply: FastifyReply): Promise<void>;
}
