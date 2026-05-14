import { FastifyInstance } from "fastify";
import {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { storageEnv } from "../../config/storage";
import { UploadFileOptions, PresignedUrlOptions, DeleteFileOptions, StorageResult } from "./storage.types";

export class StorageService {
  constructor(private readonly fastify: FastifyInstance) {}

  async upload(options: UploadFileOptions): Promise<StorageResult> {
    const command = new PutObjectCommand({
      Bucket: storageEnv.S3_BUCKET,
      Key: options.key,
      Body: options.body,
      ContentType: options.contentType,
      ...(options.acl ? { ACL: options.acl } : {}),
    });

    await this.fastify.s3.send(command);

    const url = storageEnv.S3_ENDPOINT
      ? `${storageEnv.S3_ENDPOINT}/${storageEnv.S3_BUCKET}/${options.key}`
      : `https://${storageEnv.S3_BUCKET}.s3.${storageEnv.S3_REGION}.amazonaws.com/${options.key}`;

    return { key: options.key, url };
  }

  async getPresignedUrl(options: PresignedUrlOptions): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: storageEnv.S3_BUCKET,
      Key: options.key,
    });

    return getSignedUrl(this.fastify.s3, command, {
      expiresIn: options.expiresIn ?? 3600,
    });
  }

  async delete(options: DeleteFileOptions): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: storageEnv.S3_BUCKET,
      Key: options.key,
    });

    await this.fastify.s3.send(command);
  }

  async exists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: storageEnv.S3_BUCKET,
        Key: key,
      });
      await this.fastify.s3.send(command);
      return true;
    } catch {
      return false;
    }
  }
}
