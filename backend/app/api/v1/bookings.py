"""Parking Booking & Dynamic INR Pricing Endpoints."""

import secrets
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.parking import expire_stale_bookings
from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import Booking, ParkingLocation, ParkingSlot, Payment, Profile, Review, Ticket
from app.schemas.schemas import BookingCreateRequest, PriceEstimateRequest
from app.services.email_service import send_email_safe
from app.services.pricing_service import calculate_parking_price
from app.utils.responses import ok

router = APIRouter(prefix="/bookings", tags=["Bookings"])


def _serialize_booking(db: Session, b: Booking) -> dict:
    loc = db.query(ParkingLocation).filter(ParkingLocation.id == b.parking_location_id).first()
    slot = db.query(ParkingSlot).filter(ParkingSlot.id == b.slot_id).first()
    ticket = db.query(Ticket).filter(Ticket.booking_id == b.id).first()
    payment = (
        db.query(Payment)
        .filter(Payment.booking_id == b.id)
        .order_by(Payment.created_at.desc())
        .first()
    )
    nav_url = (
        f"https://www.google.com/maps/dir/?api=1&destination={loc.latitude},{loc.longitude}"
        if loc and loc.latitude is not None and loc.longitude is not None
        else (loc.google_maps_url if loc else None)
    )
    return {
        "id": b.id,
        "booking_reference": b.booking_reference,
        "user_id": b.user_id,
        "parking_location_id": b.parking_location_id,
        "parking_name": loc.name if loc else "",
        "parking_address": loc.address if loc else "",
        "parking_district": loc.district if loc else "Kanyakumari",
        "parking_latitude": loc.latitude if loc else None,
        "parking_longitude": loc.longitude if loc else None,
        "google_maps_url": loc.google_maps_url if loc else nav_url,
        "navigation_url": nav_url,
        "slot_id": b.slot_id,
        "slot_number": slot.slot_number if slot else "",
        "customer_name": b.customer_name,
        "customer_email": b.customer_email,
        "customer_phone": b.customer_phone,
        "vehicle_number": b.vehicle_number,
        "vehicle_type": b.vehicle_type,
        "booking_date": b.booking_date.isoformat(),
        "entry_time": b.entry_time.isoformat(),
        "exit_time": b.exit_time.isoformat(),
        "duration_hours": float(b.duration_hours),
        "hourly_rate": float(b.hourly_rate),
        "base_fee": float(b.base_fee),
        "surcharge_amount": float(b.surcharge_amount),
        "total_amount": float(b.total_amount),
        "currency": "INR",
        "status": b.status,
        "expires_at": b.expires_at.isoformat() if b.expires_at else None,
        "payment_status": payment.status if payment else "unpaid",
        "razorpay_payment_id": payment.razorpay_payment_id if payment else None,
        "ticket": {
            "verification_token": ticket.verification_token,
            "qr_payload": ticket.qr_payload,
            "is_used": ticket.is_used,
        }
        if ticket
        else None,
        "created_at": b.created_at.isoformat() if b.created_at else None,
    }


@router.post("/estimate")
def estimate_booking_price(payload: PriceEstimateRequest, db: Session = Depends(get_db)):
    loc = db.query(ParkingLocation).filter(ParkingLocation.id == payload.parking_location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Parking location not found")
    try:
        breakdown = calculate_parking_price(
            db, loc, payload.vehicle_type, payload.entry_time, payload.exit_time
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return ok(data=breakdown, message="Dynamic INR price breakdown calculated")


@router.post("", status_code=status.HTTP_201_CREATED)
def create_booking(
    payload: BookingCreateRequest,
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    expire_stale_bookings(db)

    loc = (
        db.query(ParkingLocation)
        .filter(
            ParkingLocation.id == payload.parking_location_id,
            ParkingLocation.is_verified == True,
            ParkingLocation.is_active == True,
        )
        .first()
    )
    if not loc:
        raise HTTPException(status_code=404, detail="Verified parking location not found")
    if loc.status != "Available":
        raise HTTPException(status_code=400, detail=f"Parking location is currently {loc.status}")

    slot = (
        db.query(ParkingSlot)
        .filter(
            ParkingSlot.id == payload.slot_id,
            ParkingSlot.parking_location_id == loc.id,
            ParkingSlot.is_active == True,
        )
        .first()
    )
    if not slot:
        raise HTTPException(status_code=404, detail="Selected parking slot not found")
    if slot.status != "Available":
        raise HTTPException(status_code=409, detail="Selected parking slot is currently unavailable")

    if payload.exit_time <= payload.entry_time:
        raise HTTPException(status_code=400, detail="Exit time must be after entry time")

    # Prevent double booking & overlapping reservations on the same slot
    overlap = (
        db.query(Booking)
        .filter(
            Booking.slot_id == slot.id,
            Booking.status.in_(["Pending Payment", "Confirmed"]),
            Booking.entry_time < payload.exit_time,
            Booking.exit_time > payload.entry_time,
        )
        .first()
    )
    if overlap:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This parking slot is already reserved for the selected time range. Please choose another slot.",
        )

    # Calculate final price strictly on backend in INR
    breakdown = calculate_parking_price(
        db, loc, payload.vehicle_type, payload.entry_time, payload.exit_time
    )

    date_part = datetime.now(timezone.utc).strftime("%Y%m%d")
    booking_ref = f"KP-{date_part}-{secrets.token_hex(3).upper()}"
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.BOOKING_EXPIRY_MINUTES)

    booking = Booking(
        booking_reference=booking_ref,
        user_id=current_user.id,
        parking_location_id=loc.id,
        slot_id=slot.id,
        customer_name=payload.customer_name.strip(),
        customer_email=payload.customer_email.strip().lower(),
        customer_phone=payload.customer_phone.strip(),
        vehicle_number=payload.vehicle_number.strip().upper(),
        vehicle_type=payload.vehicle_type,
        booking_date=payload.booking_date,
        entry_time=payload.entry_time,
        exit_time=payload.exit_time,
        duration_hours=breakdown["duration_hours"],
        hourly_rate=breakdown["hourly_rate"],
        base_fee=breakdown["base_fee"],
        surcharge_amount=breakdown["surcharge_amount"],
        total_amount=breakdown["total_amount"],
        currency="INR",
        status="Pending Payment",
        expires_at=expires_at,
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)

    return ok(
        data=_serialize_booking(db, booking),
        message="Booking created successfully. Complete Razorpay payment to confirm your slot.",
    )


def _serialize_bookings_batch(db: Session, bookings: list) -> list:
    """Batch-load locations, slots, tickets, and payments in 4 queries total (zero N+1)."""
    if not bookings:
        return []
    loc_ids = list({b.parking_location_id for b in bookings})
    slot_ids = list({b.slot_id for b in bookings})
    booking_ids = [b.id for b in bookings]

    locs = {l.id: l for l in db.query(ParkingLocation).filter(ParkingLocation.id.in_(loc_ids)).all()}
    slots = {s.id: s for s in db.query(ParkingSlot).filter(ParkingSlot.id.in_(slot_ids)).all()}
    tickets = {t.booking_id: t for t in db.query(Ticket).filter(Ticket.booking_id.in_(booking_ids)).all()}

    payments_map = {}
    for p in (
        db.query(Payment)
        .filter(Payment.booking_id.in_(booking_ids))
        .order_by(Payment.created_at.desc())
        .all()
    ):
        if p.booking_id not in payments_map:
            payments_map[p.booking_id] = p

    out = []
    for b in bookings:
        loc = locs.get(b.parking_location_id)
        slot = slots.get(b.slot_id)
        ticket = tickets.get(b.id)
        payment = payments_map.get(b.id)
        nav_url = (
            f"https://www.google.com/maps/dir/?api=1&destination={loc.latitude},{loc.longitude}"
            if loc and loc.latitude is not None and loc.longitude is not None
            else (loc.google_maps_url if loc else None)
        )
        out.append({
            "id": b.id,
            "booking_reference": b.booking_reference,
            "user_id": b.user_id,
            "parking_location_id": b.parking_location_id,
            "parking_name": loc.name if loc else "",
            "parking_address": loc.address if loc else "",
            "parking_district": loc.district if loc else "Kanyakumari",
            "parking_latitude": loc.latitude if loc else None,
            "parking_longitude": loc.longitude if loc else None,
            "google_maps_url": loc.google_maps_url if loc else nav_url,
            "navigation_url": nav_url,
            "slot_id": b.slot_id,
            "slot_number": slot.slot_number if slot else "",
            "customer_name": b.customer_name,
            "customer_email": b.customer_email,
            "customer_phone": b.customer_phone,
            "vehicle_number": b.vehicle_number,
            "vehicle_type": b.vehicle_type,
            "booking_date": b.booking_date.isoformat(),
            "entry_time": b.entry_time.isoformat(),
            "exit_time": b.exit_time.isoformat(),
            "duration_hours": float(b.duration_hours),
            "hourly_rate": float(b.hourly_rate),
            "base_fee": float(b.base_fee),
            "surcharge_amount": float(b.surcharge_amount),
            "total_amount": float(b.total_amount),
            "currency": "INR",
            "status": b.status,
            "expires_at": b.expires_at.isoformat() if b.expires_at else None,
            "payment_status": payment.status if payment else "unpaid",
            "razorpay_payment_id": payment.razorpay_payment_id if payment else None,
            "ticket": {
                "verification_token": ticket.verification_token,
                "qr_payload": ticket.qr_payload,
                "is_used": ticket.is_used,
            }
            if ticket
            else None,
            "created_at": b.created_at.isoformat() if b.created_at else None,
        })
    return out


@router.get("/my")
def get_my_bookings(
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    expire_stale_bookings(db)
    bookings = (
        db.query(Booking)
        .filter(Booking.user_id == current_user.id)
        .order_by(Booking.created_at.desc())
        .all()
    )
    return ok(
        data=_serialize_bookings_batch(db, bookings),
        message="User bookings fetched successfully",
    )


@router.get("/{booking_id}")
def get_booking_detail(
    booking_id: str,
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="You are not authorized to view this booking")
    return ok(data=_serialize_booking(db, booking), message="Booking details fetched")


@router.post("/{booking_id}/cancel")
def cancel_booking(
    booking_id: str,
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Unauthorized cancellation request")
    if booking.status in ("Cancelled", "Completed", "Expired"):
        raise HTTPException(status_code=400, detail=f"Booking is already {booking.status}")

    booking.status = "Cancelled"
    db.commit()

    send_email_safe(
        db=db,
        recipient_email=booking.customer_email,
        subject=f"Booking Cancelled: {booking.booking_reference} — Kumari Parking",
        html_content=f"<p>Hello {booking.customer_name},</p><p>Your booking <strong>{booking.booking_reference}</strong> has been cancelled.</p>",
        notification_type="booking_cancelled",
        user_id=booking.user_id,
    )
    return ok(data=_serialize_booking(db, booking), message="Booking cancelled successfully")


@router.delete("/{booking_id}")
def permanently_delete_booking(
    booking_id: str,
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Unauthorized delete request")

    ref = booking.booking_reference
    db.query(Ticket).filter(Ticket.booking_id == booking.id).delete()
    db.query(Payment).filter(Payment.booking_id == booking.id).delete()
    db.query(Review).filter(Review.booking_id == booking.id).delete()
    db.delete(booking)
    db.commit()

    return ok(
        data={"deleted_booking_id": booking_id, "booking_reference": ref},
        message=f"Booking {ref} and its ticket have been permanently deleted.",
    )
