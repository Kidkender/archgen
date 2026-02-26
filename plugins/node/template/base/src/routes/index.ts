import { FastifyInstance } from "fastify";
import healthRoutes from "../modules/health/health.routes";
import authRoutes from "../modules/auth/auth.routes";
import userRoutes from "../modules/users/user.routes";

export default async function routes(app: FastifyInstance) {
  await app.register(healthRoutes, { prefix: '/health' });

  await app.register(authRoutes, { prefix: '/auth' });

  await app.register(userRoutes, { prefix: '/users' });
}
