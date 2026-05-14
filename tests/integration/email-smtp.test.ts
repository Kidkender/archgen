import { describe, it, expect, beforeAll } from "vitest";
import nodemailer, { Transporter } from "nodemailer";
import { config } from "dotenv";

config();

const REQUIRED_VARS = ["MAIL_HOST", "MAIL_PORT", "MAIL_USERNAME", "MAIL_PASSWORD", "MAIL_FROM_ADDRESS"];

const missingVars = REQUIRED_VARS.filter((v) => !process.env[v]);
const skip = missingVars.length > 0;

describe.skipIf(skip)("Email — Gmail SMTP integration", () => {
  let transporter: Transporter;

  beforeAll(() => {
    transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT ?? 587),
      secure: Number(process.env.MAIL_PORT) === 465,
      auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
      },
    });
  });

  it("verifies SMTP connection is reachable", async () => {
    await expect(transporter.verify()).resolves.toBe(true);
  });

  it("sends a plain text email", async () => {
    const info = await transporter.sendMail({
      from: `"archgen test" <${process.env.MAIL_FROM_ADDRESS}>`,
      to: process.env.MAIL_FROM_ADDRESS,
      subject: "[archgen] plain text test",
      text: "This is a plain text integration test from archgen.",
    });

    expect(info.accepted).toContain(process.env.MAIL_FROM_ADDRESS);
    expect(info.messageId).toBeTruthy();
    console.log("  messageId:", info.messageId);
  });

  it("sends an HTML email", async () => {
    const info = await transporter.sendMail({
      from: `"archgen test" <${process.env.MAIL_FROM_ADDRESS}>`,
      to: process.env.MAIL_FROM_ADDRESS,
      subject: "[archgen] HTML email test",
      html: `
        <h2>archgen email addon — integration test</h2>
        <p>Sent at <strong>${new Date().toISOString()}</strong></p>
        <ul>
          <li>SMTP host: ${process.env.MAIL_HOST}</li>
          <li>Port: ${process.env.MAIL_PORT}</li>
        </ul>
      `,
    });

    expect(info.accepted).toContain(process.env.MAIL_FROM_ADDRESS);
    expect(info.messageId).toBeTruthy();
    console.log("  messageId:", info.messageId);
  });

  it("sends welcome email template", async () => {
    const name = "Duck";
    const projectName = "my-api";

    const info = await transporter.sendMail({
      from: `"${projectName}" <${process.env.MAIL_FROM_ADDRESS}>`,
      to: process.env.MAIL_FROM_ADDRESS,
      subject: `Welcome to ${projectName}, ${name}!`,
      html: `
        <h1>Welcome, ${name}!</h1>
        <p>Thanks for joining ${projectName}. We're glad to have you.</p>
      `,
    });

    expect(info.accepted).toContain(process.env.MAIL_FROM_ADDRESS);
  });

  it("sends password reset email template", async () => {
    const resetLink = "https://example.com/reset?token=abc123";

    const info = await transporter.sendMail({
      from: `"archgen test" <${process.env.MAIL_FROM_ADDRESS}>`,
      to: process.env.MAIL_FROM_ADDRESS,
      subject: "Reset your password",
      html: `
        <h2>Password Reset Request</h2>
        <p>Click the link below to reset your password. This link expires in 1 hour.</p>
        <a href="${resetLink}">Reset Password</a>
      `,
    });

    expect(info.accepted).toContain(process.env.MAIL_FROM_ADDRESS);
  });

  it("rejects invalid recipient gracefully", async () => {
    await expect(
      transporter.sendMail({
        from: process.env.MAIL_FROM_ADDRESS,
        to: "not-a-valid-email",
        subject: "Should fail",
        text: "test",
      }),
    ).rejects.toThrow();
  });
});

if (skip) {
  describe("Email — skipped (missing env vars)", () => {
    it(`set ${missingVars.join(", ")} in .env to enable`, () => {
      console.warn(`  Skipped: missing env vars: ${missingVars.join(", ")}`);
    });
  });
}
