"""Razorpay Payment Gateway integration (INR only) with HMAC-SHA256 verification."""

import hashlib
import hmac
import secrets
from typing import Dict
from app.core.config import settings


def create_razorpay_order(amount_inr: float, receipt: str, notes: Dict[str, str]) -> dict:
    """
    Create a Razorpay order in INR paise.
    Uses official Razorpay SDK when configured; in local development without keys,
    returns a clearly marked test-mode order structure so the checkout flow can be
    inspected while still enforcing HMAC-SHA256 signature verification.
    """
    amount_paise = int(round(amount_inr * 100))

    if settings.has_razorpay:
        import razorpay
        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
        order = client.order.create({
            "amount": amount_paise,
            "currency": "INR",
            "receipt": receipt,
            "notes": notes,
            "payment_capture": 1,
        })
        return {
            "order_id": order["id"],
            "amount": amount_paise,
            "amount_inr": amount_inr,
            "currency": "INR",
            "key_id": settings.RAZORPAY_KEY_ID,
            "mode": "razorpay_live_or_test",
        }

    # Unconfigured local development test-mode order (never allowed when APP_ENV=production)
    if settings.APP_ENV == "production":
        raise RuntimeError("Razorpay credentials are not configured in production environment.")

    order_id = f"order_dev_{secrets.token_hex(8)}"
    return {
        "order_id": order_id,
        "amount": amount_paise,
        "amount_inr": amount_inr,
        "currency": "INR",
        "key_id": "rzp_test_dev_mode",
        "mode": "local_sandbox",
    }


def verify_razorpay_signature(order_id: str, payment_id: str, signature: str) -> bool:
    """Cryptographically verify Razorpay payment signature using HMAC-SHA256."""
    secret = settings.RAZORPAY_KEY_SECRET if settings.has_razorpay else settings.TICKET_SIGNING_SECRET
    message = f"{order_id}|{payment_id}".encode("utf-8")
    expected = hmac.new(secret.encode("utf-8"), message, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


def generate_dev_sandbox_signature(order_id: str, payment_id: str) -> str:
    """Only used by the local dev sandbox endpoint when APP_ENV != production and Razorpay keys are absent."""
    if settings.APP_ENV == "production" or settings.has_razorpay:
        raise RuntimeError("Sandbox signature helper is disabled when Razorpay is configured or in production.")
    message = f"{order_id}|{payment_id}".encode("utf-8")
    return hmac.new(settings.TICKET_SIGNING_SECRET.encode("utf-8"), message, hashlib.sha256).hexdigest()


def verify_webhook_signature(raw_body: bytes, received_signature: str) -> bool:
    """Verify Razorpay webhook X-Razorpay-Signature header."""
    if not settings.RAZORPAY_WEBHOOK_SECRET or not received_signature:
        return False
    expected = hmac.new(
        settings.RAZORPAY_WEBHOOK_SECRET.encode("utf-8"),
        raw_body,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, received_signature)
