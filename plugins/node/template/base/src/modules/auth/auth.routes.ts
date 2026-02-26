import { AuthController } from "./auth.controller";
import { FastifyInstance } from "fastify";
import { loginSchema, registerSchema } from "./auth.dto";


const controller = new AuthController();

export default async function authRoutes(app: FastifyInstance) {
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
