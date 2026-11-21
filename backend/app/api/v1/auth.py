"""Authentication and User Profile endpoints."""

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import SessionLocal, get_db
from app.core.security import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.models.models import Profile
from app.schemas.schemas import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    RegisterRequest,
    UpdateProfileRequest,
)
from app.services.email_service import send_email_safe, send_welcome_emails
from app.utils.responses import ok

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _serialize_profile(user: Profile) -> dict:
    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "phone": user.phone,
        "role": user.role,
        "avatar_url": user.avatar_url,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


def _bg_send_welcome(user_id: str, full_name: str, email: str, phone: str) -> None:
    db = SessionLocal()
    try:
        send_welcome_emails(db, user_id, full_name, email, phone)
    finally:
        db.close()


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    email_lower = payload.email.strip().lower()
    existing = db.query(Profile).filter(Profile.email == email_lower).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    user = Profile(
        full_name=payload.full_name.strip(),
        email=email_lower,
        phone=payload.phone.strip(),
        password_hash=hash_password(payload.password),
        role="user",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Send welcome emails asynchronously so registration responds immediately
    background_tasks.add_task(_bg_send_welcome, user.id, user.full_name, user.email, user.phone or "")

    token = create_access_token(user.id, user.email, user.role)
    return ok(
        data={"access_token": token, "token_type": "bearer", "user": _serialize_profile(user)},
        message="Account created successfully. Welcome to Kumari Parking!",
    )


@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    email_lower = payload.email.strip().lower()
    user = db.query(Profile).filter(Profile.email == email_lower).first()
    if not user or not verify_password(payload.password, user.password_hash or ""):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email address or password.",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact support.",
        )

    token = create_access_token(user.id, user.email, user.role)
    return ok(
        data={"access_token": token, "token_type": "bearer", "user": _serialize_profile(user)},
        message="Login successful",
    )


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    email_lower = payload.email.strip().lower()
    user = db.query(Profile).filter(Profile.email == email_lower).first()
    if user:
        send_email_safe(
            db=db,
            recipient_email=user.email,
            subject="Password Reset Request — Kumari Parking",
            html_content=f"<p>Hello {user.full_name},</p><p>We received a password reset request for your Kumari Parking account. If you did not request this, please ignore this email.</p>",
            notification_type="password_reset",
            user_id=user.id,
        )
    return ok(
        message="If an account exists for this email, a password reset link has been sent."
    )


@router.get("/me")
def get_me(current_user: Profile = Depends(get_current_user)):
    return ok(data=_serialize_profile(current_user), message="Profile fetched successfully")


@router.put("/me")
def update_me(
    payload: UpdateProfileRequest,
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.full_name is not None:
        current_user.full_name = payload.full_name.strip()
    if payload.phone is not None:
        current_user.phone = payload.phone.strip()
    db.commit()
    db.refresh(current_user)
    return ok(data=_serialize_profile(current_user), message="Profile updated successfully")


@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(payload.current_password, current_user.password_hash or ""):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect.",
        )
    current_user.password_hash = hash_password(payload.new_password)
    db.commit()
    return ok(message="Password updated successfully")
