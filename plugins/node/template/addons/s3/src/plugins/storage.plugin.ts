import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import { S3Client } from "@aws-sdk/client-s3";
import { storageEnv } from "../config/storage";

declare module "fastify" {
  interface FastifyInstance {
    s3: S3Client;
  }
}

const storagePlugin: FastifyPluginAsync = fp(async (fastify) => {
  const client = new S3Client({
    region: storageEnv.S3_REGION,
    ...(storageEnv.S3_ENDPOINT ? { endpoint: storageEnv.S3_ENDPOINT } : {}),
    credentials: {
      accessKeyId: storageEnv.AWS_ACCESS_KEY_ID,
      secretAccessKey: storageEnv.AWS_SECRET_ACCESS_KEY,
    },
  });

  fastify.decorate("s3", client);

  fastify.addHook("onClose", async () => {
    client.destroy();
  });
});

export default storagePlugin;
