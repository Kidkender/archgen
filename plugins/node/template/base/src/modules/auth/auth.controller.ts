import { FastifyReply, FastifyRequest } from "fastify";
import { AuthService } from "./auth.service";
import { LoginInput, RegisterInput } from "./auth.dto";


const authService = new AuthService();

export class AuthController {
  async register(
    request: FastifyRequest<{ Body: RegisterInput }>,
    reply: FastifyReply
  ) {
    await authService.register(request.body);

    return reply.status(201).send({
      success: true
    })
  }

  async login(
    request: FastifyRequest<{ Body: LoginInput }>,
    reply: FastifyReply
  ) {
    const result = await authService.login(request.body);

    return reply.status(200).send({
      success: true,
      data: result
    })
  }
}
