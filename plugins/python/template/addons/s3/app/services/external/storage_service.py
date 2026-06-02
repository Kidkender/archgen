from typing import Any

import boto3
from botocore.exceptions import ClientError

from app.core.logging import get_logger
from app.core.storage import storage_settings

logger = get_logger(__name__)


class StorageService:
    def __init__(self) -> None:
        self.settings = storage_settings
        kwargs: dict[str, Any] = {
            "region_name": self.settings.S3_REGION,
            "aws_access_key_id": self.settings.AWS_ACCESS_KEY_ID,
            "aws_secret_access_key": self.settings.AWS_SECRET_ACCESS_KEY,
        }
        if self.settings.S3_ENDPOINT:
            kwargs["endpoint_url"] = self.settings.S3_ENDPOINT
        self.client = boto3.client("s3", **kwargs)

    def upload(self, key: str, body: bytes, content_type: str = "application/octet-stream") -> str:
        self.client.put_object(
            Bucket=self.settings.S3_BUCKET,
            Key=key,
            Body=body,
            ContentType=content_type,
        )
        if self.settings.S3_ENDPOINT:
            url = f"{self.settings.S3_ENDPOINT}/{self.settings.S3_BUCKET}/{key}"
        else:
            url = f"https://{self.settings.S3_BUCKET}.s3.{self.settings.S3_REGION}.amazonaws.com/{key}"
        logger.info(f"Uploaded {key} to S3")
        return url

    def get_presigned_url(self, key: str, expires_in: int = 3600) -> str:
        return self.client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.settings.S3_BUCKET, "Key": key},
            ExpiresIn=expires_in,
        )

    def delete(self, key: str) -> None:
        self.client.delete_object(Bucket=self.settings.S3_BUCKET, Key=key)
        logger.info(f"Deleted {key} from S3")

    def exists(self, key: str) -> bool:
        try:
            self.client.head_object(Bucket=self.settings.S3_BUCKET, Key=key)
            return True
        except ClientError:
            return False


storage_service = StorageService()
