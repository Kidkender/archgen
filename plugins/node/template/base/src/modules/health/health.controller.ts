import { FastifyReply, FastifyRequest } from "fastify";


export class HealthController {
  async health(request: FastifyRequest, reply: FastifyReply) {
    return reply.send({ status: 'ok', message: "Service is health" })
  }


}
