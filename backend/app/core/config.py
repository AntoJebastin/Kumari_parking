"""Application configuration loaded from environment variables."""

from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "Kumari Parking API"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api"
    FRONTEND_URL: str = "http://localhost:5173"
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    # Database (Neon Lakebase Postgres via .env.local; falls back to SQLite if unset)
    DATABASE_URL: str = "sqlite:///./kumari_parking_dev.db"
    DATABASE_URL_UNPOOLED: str = ""
    NEON_BRANCH: str = ""
    NEON_BRANCH_ID: str = ""

    # Supabase Auth
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""

    # Local JWT fallback (used when Supabase Auth keys are not configured in local dev)
    JWT_SECRET_KEY: str = "kumari-parking-dev-jwt-secret-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440

    # Razorpay Payment Gateway (INR only)
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    RAZORPAY_WEBHOOK_SECRET: str = ""

    # Resend Email API
    RESEND_API_KEY: str = ""
    RESEND_FROM_EMAIL: str = "Kumari Parking <onboarding@resend.dev>"
    ADMIN_EMAIL: str = "admin@kumariparking.in"

    # Optional Gmail / SMTP fallback (lets you send to ANY driver email without a custom domain)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_APP_PASSWORD: str = ""

    # Booking & Ticket Security
    BOOKING_EXPIRY_MINUTES: int = 15
    TICKET_SIGNING_SECRET: str = "kumari-parking-ticket-secret-change-in-production"
    RATE_LIMIT_DEFAULT: str = "100/minute"

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env.local"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origin_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def has_supabase(self) -> bool:
        return bool(self.SUPABASE_URL and self.SUPABASE_ANON_KEY)

    @property
    def has_razorpay(self) -> bool:
        return bool(
            self.RAZORPAY_KEY_ID
            and self.RAZORPAY_KEY_SECRET
            and not self.RAZORPAY_KEY_ID.endswith("your_key_id")
        )

    @property
    def has_resend(self) -> bool:
        return bool(
            self.RESEND_API_KEY
            and not self.RESEND_API_KEY.endswith("your_resend_api_key")
        )

    @property
    def has_smtp(self) -> bool:
        return bool(self.SMTP_USER and self.SMTP_APP_PASSWORD)


settings = Settings()
