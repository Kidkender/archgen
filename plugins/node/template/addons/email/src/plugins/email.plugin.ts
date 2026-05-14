import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import nodemailer, { Transporter } from "nodemailer";
import { emailEnv } from "../config/email";

declare module "fastify" {
  interface FastifyInstance {
    mailer: Transporter;
  }
}

const emailPlugin: FastifyPluginAsync = fp(async (fastify) => {
  const transporter = nodemailer.createTransport({
    host: emailEnv.MAIL_HOST,
    port: emailEnv.MAIL_PORT,
    secure: emailEnv.MAIL_PORT === 465,
    auth: {
      user: emailEnv.MAIL_USERNAME,
      pass: emailEnv.MAIL_PASSWORD,
    },
  });

  await transporter.verify();
  fastify.decorate("mailer", transporter);

  fastify.addHook("onClose", async () => {
    transporter.close();
  });
});

export default emailPlugin;
