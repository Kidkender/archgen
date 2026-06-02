from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class StorageSettings(BaseSettings):
    S3_BUCKET: str = ""
    S3_REGION: str = "us-east-1"
    S3_ENDPOINT: Optional[str] = None
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")


storage_settings = StorageSettings()
