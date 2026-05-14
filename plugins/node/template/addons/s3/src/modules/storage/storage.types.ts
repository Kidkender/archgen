export interface UploadFileOptions {
  key: string;
  body: Buffer | Uint8Array | string;
  contentType: string;
  acl?: "private" | "public-read";
}

export interface PresignedUrlOptions {
  key: string;
  expiresIn?: number;
}

export interface DeleteFileOptions {
  key: string;
}

export interface StorageResult {
  key: string;
  url: string;
}
