
import "fastify";

declare module "fastify" {
  interface FastifyReply {
    success: (data?: any, message?: string) => FastifyReply;
    created: (data?: any) => FastifyReply;
    paginated: (data: any, meta?: any) => FastifyReply;
    noContent: () => FastifyReply;
  };
  interface FastifyInstance {
    prisma: PrismaClient
  }
}
