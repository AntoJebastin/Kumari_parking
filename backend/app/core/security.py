"""Authentication, password hashing, JWT verification, and RBAC dependencies."""

from datetime import datetime, timedelta, timezone
from typing import Optional
import jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.models import Profile

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
bearer_scheme = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password:
        return False
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(user_id: str, email: str, role: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "iat": now,
        "exp": now + timedelta(minutes=settings.JWT_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    """Verify Supabase JWT first if configured, otherwise verify local JWT."""
    secrets_to_try = []
    if settings.SUPABASE_JWT_SECRET:
        secrets_to_try.append((settings.SUPABASE_JWT_SECRET, {"verify_aud": False}))
    secrets_to_try.append((settings.JWT_SECRET_KEY, {"verify_aud": False}))

    last_err = None
    for secret, options in secrets_to_try:
        try:
            return jwt.decode(
                token,
                secret,
                algorithms=[settings.JWT_ALGORITHM],
                options=options,
            )
        except jwt.PyJWTError as exc:
            last_err = exc
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired authentication token",
    ) from last_err


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Profile:
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
        )

    payload = decode_token(credentials.credentials)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed authentication token",
        )

    user = db.query(Profile).filter(Profile.id == str(user_id)).first()
    if not user:
        # Auto-provision profile on first Supabase Auth login if JWT is valid
        email = payload.get("email")
        if email:
            user = db.query(Profile).filter(Profile.email == email).first()
        if not user and email:
            meta = payload.get("user_metadata") or {}
            user = Profile(
                id=str(user_id),
                full_name=meta.get("full_name") or email.split("@")[0],
                email=email,
                phone=meta.get("phone"),
                role="user",
            )
            db.add(user)
            db.commit()
            db.refresh(user)

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found or deactivated",
        )
    return user


def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Optional[Profile]:
    if not credentials or not credentials.credentials:
        return None
    try:
        return get_current_user(credentials=credentials, db=db)
    except HTTPException:
        return None


def require_admin(current_user: Profile = Depends(get_current_user)) -> Profile:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator privileges required",
        )
    return current_user
