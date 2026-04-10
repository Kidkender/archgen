import { FastifyInstance } from "fastify";
import scalar from "@scalar/fastify-api-reference";

export default async function docsPlugin(fastify: FastifyInstance) {
  await fastify.register(scalar, {
    routePrefix: "/reference",
    configuration: {
      theme: "purple",
      layout: "modern",
      defaultHttpClient: {
        targetKey: "javascript",
        clientKey: "fetch",
      },
    },
  });
}
