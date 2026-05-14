import { describe, it, expect, afterAll } from "vitest";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { config } from "dotenv";

config();

const REQUIRED_VARS = ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_BUCKET", "AWS_DEFAULT_REGION"];
const missingVars = REQUIRED_VARS.filter((v) => !process.env[v]);
const skip = missingVars.length > 0;

const TEST_KEY = `archgen-test/${Date.now()}-integration.txt`;
const TEST_CONTENT = `archgen S3 integration test — ${new Date().toISOString()}`;

describe.skipIf(skip)("Storage — AWS S3 integration", () => {
  let client: S3Client;
  const bucket = process.env.AWS_BUCKET!;

  client = new S3Client({
    region: process.env.AWS_DEFAULT_REGION ?? "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
    ...(process.env.S3_ENDPOINT ? { endpoint: process.env.S3_ENDPOINT } : {}),
  });

  afterAll(async () => {
    // cleanup test file
    try {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: TEST_KEY }));
    } catch {
      // best-effort cleanup
    }
  });

  it("uploads a text file", async () => {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: TEST_KEY,
      Body: TEST_CONTENT,
      ContentType: "text/plain",
    });

    const res = await client.send(command);
    expect(res.$metadata.httpStatusCode).toBe(200);
  });

  it("verifies uploaded file exists via HeadObject", async () => {
    const command = new HeadObjectCommand({ Bucket: bucket, Key: TEST_KEY });
    const res = await client.send(command);
    expect(res.$metadata.httpStatusCode).toBe(200);
    expect(res.ContentType).toBe("text/plain");
  });

  it("downloads and reads the uploaded file content", async () => {
    const command = new GetObjectCommand({ Bucket: bucket, Key: TEST_KEY });
    const res = await client.send(command);

    const body = await res.Body?.transformToString();
    expect(body).toBe(TEST_CONTENT);
  });

  it("generates a presigned URL (expires in 60s)", async () => {
    const command = new GetObjectCommand({ Bucket: bucket, Key: TEST_KEY });
    const url = await getSignedUrl(client, command, { expiresIn: 60 });

    expect(url).toContain(bucket);
    expect(url).toContain(encodeURIComponent(TEST_KEY).replace(/%2F/g, "/"));
  });

  it("presigned URL is accessible via fetch", async () => {
    const command = new GetObjectCommand({ Bucket: bucket, Key: TEST_KEY });
    const url = await getSignedUrl(client, command, { expiresIn: 60 });

    const res = await fetch(url);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toBe(TEST_CONTENT);
  });

  it("deletes the test file", async () => {
    const command = new DeleteObjectCommand({ Bucket: bucket, Key: TEST_KEY });
    const res = await client.send(command);
    expect(res.$metadata.httpStatusCode).toBe(204);
  });

  it("confirms deleted file no longer exists", async () => {
    const command = new HeadObjectCommand({ Bucket: bucket, Key: TEST_KEY });
    await expect(client.send(command)).rejects.toThrow();
  });
});

if (skip) {
  describe("Storage — skipped (missing env vars)", () => {
    it(`set ${missingVars.join(", ")} in .env to enable`, () => {
      console.warn(`  Skipped: missing env vars: ${missingVars.join(", ")}`);
    });
  });
}
