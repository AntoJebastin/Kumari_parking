"""Razorpay INR Payment Order, Verification & Idempotent Webhook Endpoints."""

import json
import secrets
from fastapi import APIRouter, BackgroundTasks, Depends, Header, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import SessionLocal, get_db
from app.core.security import get_current_user
from app.models.models import Booking, ParkingLocation, ParkingSlot, Payment, Profile
from app.schemas.schemas import CreateOrderRequest, VerifyPaymentRequest
from app.services.email_service import send_booking_confirmation_emails
from app.services.payment_service import (
    create_razorpay_order,
    generate_dev_sandbox_signature,
    verify_razorpay_signature,
    verify_webhook_signature,
)
from app.services.ticket_service import create_ticket_for_booking
from app.utils.responses import ok

router = APIRouter(tags=["Payments"])


@router.post("/payments/create-order")
def create_order(
    payload: CreateOrderRequest,
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == payload.booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized booking access")
    if booking.status != "Pending Payment":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot create payment order for booking with status '{booking.status}'",
        )

    order = create_razorpay_order(
        amount_inr=float(booking.total_amount),
        receipt=booking.booking_reference,
        notes={
            "booking_id": booking.id,
            "booking_reference": booking.booking_reference,
            "vehicle_number": booking.vehicle_number,
        },
    )

    payment = Payment(
        booking_id=booking.id,
        user_id=current_user.id,
        razorpay_order_id=order["order_id"],
        amount=booking.total_amount,
        currency="INR",
        status="created",
        payment_metadata={"mode": order["mode"]},
    )
    db.add(payment)
    db.commit()

    return ok(
        data={
            **order,
            "booking_id": booking.id,
            "booking_reference": booking.booking_reference,
            "customer_name": booking.customer_name,
            "customer_email": booking.customer_email,
            "customer_phone": booking.customer_phone,
        },
        message="Razorpay INR order created successfully",
    )


@router.post("/payments/dev-sandbox-sign")
def dev_sandbox_sign(
    payload: dict,
    current_user: Profile = Depends(get_current_user),
):
    """
    Development-only helper to generate a valid HMAC-SHA256 test signature
    when Razorpay Test Keys are not yet configured in backend/.env.
    Automatically disabled in production or whenever real Razorpay keys are set.
    """
    if settings.APP_ENV == "production" or settings.has_razorpay:
        raise HTTPException(status_code=403, detail="Sandbox signing is disabled.")

    order_id = payload.get("razorpay_order_id")
    if not order_id:
        raise HTTPException(status_code=400, detail="razorpay_order_id is required")

    payment_id = f"pay_dev_{secrets.token_hex(8)}"
    signature = generate_dev_sandbox_signature(order_id, payment_id)
    return ok(
        data={
            "razorpay_order_id": order_id,
            "razorpay_payment_id": payment_id,
            "razorpay_signature": signature,
        },
        message="Local sandbox test signature generated",
    )


def _bg_send_booking_emails(booking_id: str, payment_id: str) -> None:
    db = SessionLocal()
    try:
        from app.models.models import Ticket
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if not booking:
            return
        loc = db.query(ParkingLocation).filter(ParkingLocation.id == booking.parking_location_id).first()
        slot = db.query(ParkingSlot).filter(ParkingSlot.id == booking.slot_id).first()
        ticket = db.query(Ticket).filter(Ticket.booking_id == booking.id).first()
        if ticket:
            send_booking_confirmation_emails(
                db=db,
                booking=booking,
                location=loc,
                slot=slot,
                ticket=ticket,
                payment_id=payment_id,
            )
    finally:
        db.close()


@router.post("/payments/verify")
def verify_payment(
    payload: VerifyPaymentRequest,
    background_tasks: BackgroundTasks,
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == payload.booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Unauthorized payment verification")

    payment = (
        db.query(Payment)
        .filter(
            Payment.booking_id == booking.id,
            Payment.razorpay_order_id == payload.razorpay_order_id,
        )
        .first()
    )
    if not payment:
        raise HTTPException(status_code=404, detail="Matching Razorpay order record not found")

    # Never trust frontend success alone — verify cryptographic signature on backend
    is_valid = verify_razorpay_signature(
        payload.razorpay_order_id,
        payload.razorpay_payment_id,
        payload.razorpay_signature,
    )
    if not is_valid:
        payment.status = "failed"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Razorpay payment signature. Payment verification failed.",
        )

    payment.razorpay_payment_id = payload.razorpay_payment_id
    payment.razorpay_signature = payload.razorpay_signature
    payment.status = "paid"
    payment.method = "razorpay_inr"

    booking.status = "Confirmed"
    db.commit()

    # Generate digital QR ticket
    ticket = create_ticket_for_booking(db, booking)

    # Dispatch ticket confirmation emails in background so user sees QR ticket immediately
    background_tasks.add_task(_bg_send_booking_emails, booking.id, payload.razorpay_payment_id)

    return ok(
        data={
            "booking_id": booking.id,
            "booking_reference": booking.booking_reference,
            "status": booking.status,
            "amount_paid": float(booking.total_amount),
            "currency": "INR",
            "razorpay_payment_id": payload.razorpay_payment_id,
            "ticket": {
                "id": ticket.id,
                "booking_reference": ticket.booking_reference,
                "verification_token": ticket.verification_token,
                "qr_payload": ticket.qr_payload,
            },
        },
        message="Payment verified and booking confirmed!",
    )


@router.get("/payments/my")
def get_my_payments(
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(Payment)
        .filter(Payment.user_id == current_user.id)
        .order_by(Payment.created_at.desc())
        .all()
    )
    return ok(
        data=[
            {
                "id": p.id,
                "booking_id": p.booking_id,
                "razorpay_order_id": p.razorpay_order_id,
                "razorpay_payment_id": p.razorpay_payment_id,
                "amount": float(p.amount),
                "currency": p.currency,
                "status": p.status,
                "method": p.method,
                "created_at": p.created_at.isoformat() if p.created_at else None,
            }
            for p in rows
        ],
        message="Payment history fetched",
    )


@router.post("/webhooks/razorpay")
async def razorpay_webhook(
    request: Request,
    x_razorpay_signature: str = Header(default=""),
    x_razorpay_event_id: str = Header(default=""),
    db: Session = Depends(get_db),
):
    raw_body = await request.body()
    if not verify_webhook_signature(raw_body, x_razorpay_signature):
        raise HTTPException(status_code=400, detail="Invalid Razorpay webhook signature")

    event = json.loads(raw_body.decode("utf-8"))
    event_type = event.get("event", "")
    event_id = x_razorpay_event_id or event.get("id")

    # Idempotency check
    if event_id:
        already_processed = db.query(Payment).filter(Payment.webhook_event_id == event_id).first()
        if already_processed:
            return ok(message="Duplicate webhook event ignored idempotently")

    entity = event.get("payload", {}).get("payment", {}).get("entity", {})
    order_id = entity.get("order_id")
    payment_id = entity.get("id")

    if order_id:
        payment = db.query(Payment).filter(Payment.razorpay_order_id == order_id).first()
        if payment:
            payment.webhook_event_id = event_id
            if event_type == "payment.captured":
                payment.status = "paid"
                payment.razorpay_payment_id = payment_id
                booking = db.query(Booking).filter(Booking.id == payment.booking_id).first()
                if booking and booking.status != "Confirmed":
                    booking.status = "Confirmed"
                    db.commit()
                    create_ticket_for_booking(db, booking)
            elif event_type == "payment.failed":
                payment.status = "failed"
                db.commit()

    return ok(message="Webhook processed")
