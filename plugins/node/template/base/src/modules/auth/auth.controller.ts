
import { FastifyReply, FastifyRequest } from "fastify";
import { AuthService } from "./auth.service";
import { LoginInput, RegisterInput } from "./auth.schema";


export class AuthController {

  constructor(private authService: AuthService) { }

  async register(
    request: FastifyRequest<{ Body: RegisterInput }>,
    reply: FastifyReply
  ) {
    await this.authService.register(request.body);

    return reply.created();
  }

  async login(
    request: FastifyRequest<{ Body: LoginInput }>,
    reply: FastifyReply
  ) {
    const result = await this.authService.login(request.body);
    return reply.success(result);
  }
}
