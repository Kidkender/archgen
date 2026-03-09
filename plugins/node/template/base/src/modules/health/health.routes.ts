import { FastifyInstance } from "fastify";
import { HealthController } from "./health.controller";

const controller = new HealthController()

export default async function healthRoutes(app: FastifyInstance) {
  app.get("/", {
    schema: {
    }
  }, controller.health)
}
