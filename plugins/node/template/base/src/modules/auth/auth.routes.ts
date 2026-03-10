import { AuthController } from "./auth.controller";
import { FastifyInstance } from "fastify";
import { loginSchema, registerSchema } from "./auth.schema";
import { AuthService } from "./auth.service";


export default async function authRoutes(app: FastifyInstance) {
  const service = new AuthService(app.prisma);
  const controller = new AuthController(service);
  app.post("/register", {
    schema: {
      body: registerSchema,
      tags: ["Auth"],
      description: "Register a new user"
    }
  },
    controller.register)


  app.post("/login", {
    schema: {
      body: loginSchema,
      tags: ["Auth"],
      description: "Login a user"
    }
  },
    controller.login)
}
