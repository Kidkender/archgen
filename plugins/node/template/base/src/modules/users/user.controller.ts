
import fastify, { FastifyReply, FastifyRequest } from "fastify";
import { CreateUserInput, GetUserQuery, UpdateUserInput } from "./user.schema";
import { UserService } from "./user.service";

export class UserController {

  constructor(private userService: UserService) { }

  async create(
    request: FastifyRequest<{ Body: CreateUserInput }>,
    reply: FastifyReply
  ) {
    await this.userService.createUser(request.body);
    return reply.created();
  }


  async getById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const id = parseInt(request.params.id);
    const user = await this.userService.getUserById(id);
    return reply.success(user);
  }

  async list(
    request: FastifyRequest<{ Querystring: GetUserQuery }>,
    reply: FastifyReply
  ) {
    const { page, limit } = request.query;
    const result = await this.userService.listUsers(page, limit);

    return reply.paginated(result.data, result.meta)
  }

  async update(
    request: FastifyRequest<{ Params: { id: string }; Body: UpdateUserInput }>,
    reply: FastifyReply
  ) {
    const id = parseInt(request.params.id);
    const user = await this.userService.updateUser(id, request.body);

    return reply.success(user);
  }

  async delete(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const id = parseInt(request.params.id);
    await this.userService.deleteUser(id);

    return reply.noContent();
  }
}
