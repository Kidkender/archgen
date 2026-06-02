import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Union

from app.core.email import email_settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class EmailService:
    def __init__(self) -> None:
        self.settings = email_settings

    def _create_connection(self) -> smtplib.SMTP:
        if self.settings.MAIL_USE_SSL:
            smtp: smtplib.SMTP = smtplib.SMTP_SSL(self.settings.MAIL_HOST, self.settings.MAIL_PORT)
        else:
            smtp = smtplib.SMTP(self.settings.MAIL_HOST, self.settings.MAIL_PORT)
            if self.settings.MAIL_USE_TLS:
                smtp.starttls()
        smtp.login(self.settings.MAIL_USERNAME, self.settings.MAIL_PASSWORD)
        return smtp

    def send(
        self,
        to: Union[str, list[str]],
        subject: str,
        html: str,
        text: str | None = None,
    ) -> bool:
        recipients = [to] if isinstance(to, str) else to
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{self.settings.MAIL_FROM_NAME} <{self.settings.MAIL_FROM_ADDRESS}>"
        msg["To"] = ", ".join(recipients)
        if text:
            msg.attach(MIMEText(text, "plain"))
        msg.attach(MIMEText(html, "html"))
        try:
            with self._create_connection() as smtp:
                smtp.sendmail(self.settings.MAIL_FROM_ADDRESS, recipients, msg.as_string())
            logger.info(f"Email sent to {recipients}")
            return True
        except Exception as exc:
            logger.error(f"Failed to send email: {exc}")
            return False

    def send_welcome(self, to: str, name: str) -> bool:
        return self.send(
            to=to,
            subject=f"Welcome to {{PROJECT_NAME}}, {name}!",
            html=f"<h1>Welcome, {name}!</h1><p>Thanks for joining {{PROJECT_NAME}}. We're glad to have you.</p>",
        )

    def send_password_reset(self, to: str, reset_link: str) -> bool:
        return self.send(
            to=to,
            subject="Reset your password",
            html=f"""
                <h2>Password Reset Request</h2>
                <p>Click the link below to reset your password. This link expires in 1 hour.</p>
                <a href="{reset_link}">Reset Password</a>
                <p>If you didn't request this, you can safely ignore this email.</p>
            """,
        )

    def send_notification(self, to: Union[str, list[str]], subject: str, message: str) -> bool:
        return self.send(to=to, subject=subject, html=f"<p>{message}</p>")


email_service = EmailService()
