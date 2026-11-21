"""Kumari Parking FastAPI Production Application Entrypoint."""

import logging
from contextlib import asynccontextmanager
from fastapi import BackgroundTasks, FastAPI, HTTPException, Request
from pydantic import BaseModel, EmailStr, Field
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.api.v1 import admin, auth, bookings, parking, payments, reviews, tickets
from app.core.config import settings
from app.services.seed_service import init_and_seed_db

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)

limiter = Limiter(key_func=get_remote_address, default_limits=[settings.RATE_LIMIT_DEFAULT])


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_and_seed_db()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    description="Smart Parking Slot Reservation and Management Platform for Kanyakumari District, Tamil Nadu, India. All amounts in INR (₹).",
    version="1.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(HTTPException)
async def http_exception_handler(_request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "message": str(exc.detail), "data": {}},
    )


@app.get("/api/health", tags=["Health"])
def health_check():
    from sqlalchemy import text
    from app.core.database import engine

    db_ok = False
    db_version = None
    try:
        with engine.connect() as conn:
            row = conn.execute(text("SELECT 1")).scalar()
            db_ok = row == 1
            if not settings.DATABASE_URL.startswith("sqlite"):
                db_version = conn.execute(text("SELECT version()")).scalar()
    except Exception:
        db_ok = False

    db_backend = (
        "neon_postgres"
        if "neon.tech" in settings.DATABASE_URL
        else ("postgres" if settings.DATABASE_URL.startswith("postgres") else "sqlite")
    )

    return {
        "success": True,
        "message": "Kumari Parking API is running",
        "data": {
            "service": "kumari-parking-api",
            "status": "healthy" if db_ok else "degraded",
            "database_backend": db_backend,
            "database_connected": db_ok,
            "neon_branch": settings.NEON_BRANCH or None,
            "database_version": db_version,
            "currency": "INR",
            "region": "Kanyakumari District, Tamil Nadu, India",
            "razorpay_configured": settings.has_razorpay,
            "resend_configured": settings.has_resend,
            "supabase_configured": settings.has_supabase,
        },
    }


class ContactMessageRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    message: str = Field(..., min_length=5, max_length=2000)


def _bg_send_contact_email(name: str, email: str, message: str) -> None:
    from app.core.database import SessionLocal
    from app.services.email_service import _wrap_html, send_email_safe

    db = SessionLocal()
    try:
        html = _wrap_html(
            f"New Contact Inquiry from {name}",
            f"""
            <p><strong>Sender Name:</strong> {name}</p>
            <p><strong>Sender Email:</strong> {email}</p>
            <p style="margin-top:12px;"><strong>Message:</strong></p>
            <div style="background:#F4F8FB;padding:14px;border-radius:10px;border:1px solid #E2E8F0;">{message}</div>
            """,
        )
        send_email_safe(
            db=db,
            recipient_email=settings.ADMIN_EMAIL,
            subject=f"Contact Inquiry from {name} — Kumari Parking",
            html_content=html,
            notification_type="contact_inquiry",
        )
    finally:
        db.close()


@app.post("/api/contact", tags=["Contact"])
def submit_contact_message(payload: ContactMessageRequest, background_tasks: BackgroundTasks):
    background_tasks.add_task(
        _bg_send_contact_email,
        payload.name.strip(),
        payload.email.strip(),
        payload.message.strip(),
    )
    return {
        "success": True,
        "message": "Your message has been sent to Kumari Parking District Support!",
        "data": {},
    }


# Register all API routers under /api
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(parking.router, prefix=settings.API_V1_PREFIX)
app.include_router(bookings.router, prefix=settings.API_V1_PREFIX)
app.include_router(payments.router, prefix=settings.API_V1_PREFIX)
app.include_router(tickets.router, prefix=settings.API_V1_PREFIX)
app.include_router(reviews.router, prefix=settings.API_V1_PREFIX)
app.include_router(admin.router, prefix=settings.API_V1_PREFIX)
