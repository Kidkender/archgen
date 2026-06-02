from pydantic_settings import BaseSettings, SettingsConfigDict


class EmailSettings(BaseSettings):
    MAIL_HOST: str = "smtp.gmail.com"
    MAIL_PORT: int = 587
    MAIL_USERNAME: str = ""
    MAIL_PASSWORD: str = ""
    MAIL_FROM_ADDRESS: str = ""
    MAIL_FROM_NAME: str = "{{PROJECT_NAME}}"
    MAIL_USE_TLS: bool = True
    MAIL_USE_SSL: bool = False

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")


email_settings = EmailSettings()
