import { FastifyInstance } from "fastify";

export default async function routes(app: FastifyInstance) {
  await app.register(healthRoutes, { prefix: '/health' });

  await app.register(authRoutes, { prefix: '/auth' });

  await app.register(userRoutes, { prefix: '/users' });
}
