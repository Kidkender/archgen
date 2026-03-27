import { FastifyReply, FastifyRequest } from 'fastify';
import { CreateUserInput, GetUserQuery, UpdateUserInput } from './user.schema';
import { UserService } from './user.service';

export class UserController {
  constructor(private userService: UserService) {}

  create = async (request: FastifyRequest, reply: FastifyReply) => {
    await this.userService.createUser(request.body as CreateUserInput);
    return reply.created();
  };

  getById = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const user = await this.userService.getUserById(parseInt(id));
    return reply.success(user);
  };

  list = async (request: FastifyRequest, reply: FastifyReply) => {
    const { page, limit } = request.query as GetUserQuery;
    const result = await this.userService.listUsers(page, limit);
    return reply.paginated(result.data, result.meta);
  };

  update = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const user = await this.userService.updateUser(parseInt(id), request.body as UpdateUserInput);
    return reply.success(user);
  };

  delete = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    await this.userService.deleteUser(parseInt(id));
    return reply.noContent();
  };
}
