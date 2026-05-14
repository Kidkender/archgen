import { FastifyInstance } from "fastify";
import { emailEnv } from "../../config/email";
import { SendEmailOptions, EmailResult } from "./email.types";

export class EmailService {
  constructor(private readonly fastify: FastifyInstance) {}

  async send(options: SendEmailOptions): Promise<EmailResult> {
    const info = await this.fastify.mailer.sendMail({
      from: `"${emailEnv.MAIL_FROM_NAME}" <${emailEnv.MAIL_FROM_ADDRESS}>`,
      to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
      subject: options.subject,
      html: options.html,
      ...(options.text ? { text: options.text } : {}),
      ...(options.replyTo ? { replyTo: options.replyTo } : {}),
    });

    return { id: info.messageId };
  }

  async sendWelcome(to: string, name: string): Promise<EmailResult> {
    return this.send({
      to,
      subject: `Welcome to {{PROJECT_NAME}}, ${name}!`,
      html: `
        <h1>Welcome, ${name}!</h1>
        <p>Thanks for joining {{PROJECT_NAME}}. We're glad to have you.</p>
      `,
    });
  }

  async sendPasswordReset(to: string, resetLink: string): Promise<EmailResult> {
    return this.send({
      to,
      subject: "Reset your password",
      html: `
        <h2>Password Reset Request</h2>
        <p>Click the link below to reset your password. This link expires in 1 hour.</p>
        <a href="${resetLink}">Reset Password</a>
        <p>If you didn't request this, you can safely ignore this email.</p>
      `,
    });
  }

  async sendNotification(to: string | string[], subject: string, message: string): Promise<EmailResult> {
    return this.send({ to, subject, html: `<p>${message}</p>` });
  }
}
