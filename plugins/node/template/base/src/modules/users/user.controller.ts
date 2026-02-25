import { FastifyReply, FastifyRequest } from "fastify";
import { UserService } from "./user.service";
import { CreateUserInput, GetUserQuery, UpdateUserInput } from "./user.dto";
import { ERROR_USER_NOT_FOUND } from "../../constants/error-codes";


const userService = new UserService()

export class UserController {
  async create(
    request: FastifyRequest<{ Body: CreateUserInput }>,
    reply: FastifyReply
  ) {
    await userService.createUser(request.body);

    return reply.status(201).send({ success: true })
  }


  async getById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const id = parseInt(request.params.id);
    const user = await userService.getUserById(id);

    if (!user) {
      return reply.status(404).send({
        success: false,
        message: ERROR_USER_NOT_FOUND
      })
    }

    return reply.send({
      success: true,
      data: user
    })
  }


  async list(
    request: FastifyRequest<{ Querystring: GetUserQuery }>,
    reply: FastifyReply
  ) {
    const { page, limit } = request.query;
    const result = await userService.listUsers(page, limit);

    return reply.send({
      success: true,
      ...result,
    });
  }

  async update(
    request: FastifyRequest<{ Params: { id: string }; Body: UpdateUserInput }>,
    reply: FastifyReply
  ) {
    const id = parseInt(request.params.id);
    const user = await userService.updateUser(id, request.body);

    return reply.send({
      success: true,
      data: user,
    });
  }

  async delete(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const id = parseInt(request.params.id);
    await userService.deleteUser(id);

    return reply.status(204).send();
  }
}
