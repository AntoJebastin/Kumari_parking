"""Digital Parking Ticket & Staff QR Verification Endpoints."""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_admin
from app.models.models import Booking, ParkingLocation, ParkingSlot, Payment, Profile, Ticket
from app.services.email_service import send_booking_confirmation_emails
from app.utils.responses import ok

router = APIRouter(prefix="/tickets", tags=["Tickets"])


@router.get("/{booking_id}")
def get_ticket_by_booking(
    booking_id: str,
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Unauthorized ticket access")

    ticket = db.query(Ticket).filter(Ticket.booking_id == booking.id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Digital ticket not generated yet (payment pending)")

    loc = db.query(ParkingLocation).filter(ParkingLocation.id == booking.parking_location_id).first()
    slot = db.query(ParkingSlot).filter(ParkingSlot.id == booking.slot_id).first()
    payment = db.query(Payment).filter(Payment.booking_id == booking.id, Payment.status == "paid").first()

    nav_url = (
        f"https://www.google.com/maps/dir/?api=1&destination={loc.latitude},{loc.longitude}"
        if loc and loc.latitude is not None and loc.longitude is not None
        else (loc.google_maps_url if loc else None)
    )

    return ok(
        data={
            "ticket_id": ticket.id,
            "booking_id": booking.id,
            "booking_reference": booking.booking_reference,
            "customer_name": booking.customer_name,
            "customer_email": booking.customer_email,
            "customer_phone": booking.customer_phone,
            "vehicle_number": booking.vehicle_number,
            "vehicle_type": booking.vehicle_type,
            "parking_name": loc.name if loc else "",
            "parking_address": loc.address if loc else "",
            "parking_district": loc.district if loc else "Kanyakumari",
            "parking_latitude": loc.latitude if loc else None,
            "parking_longitude": loc.longitude if loc else None,
            "google_maps_url": loc.google_maps_url if loc else nav_url,
            "navigation_url": nav_url,
            "slot_number": slot.slot_number if slot else "",
            "booking_date": booking.booking_date.isoformat(),
            "entry_time": booking.entry_time.isoformat(),
            "exit_time": booking.exit_time.isoformat(),
            "duration_hours": float(booking.duration_hours),
            "total_amount": float(booking.total_amount),
            "currency": "INR",
            "payment_status": payment.status if payment else "paid",
            "razorpay_payment_id": payment.razorpay_payment_id if payment else None,
            "booking_status": booking.status,
            "verification_token": ticket.verification_token,
            "qr_payload": ticket.qr_payload,
            "is_used": ticket.is_used,
        },
        message="Digital parking ticket retrieved",
    )


@router.get("/verify/{token}")
def verify_ticket_qr(token: str, db: Session = Depends(get_db)):
    """Public/Staff QR verification endpoint — never exposes sensitive customer PII."""
    ticket = db.query(Ticket).filter(Ticket.verification_token == token).first()
    if not ticket:
        return ok(
            data={"is_valid": False, "reason": "Ticket token not found or invalid."},
            message="Invalid parking ticket",
        )

    booking = db.query(Booking).filter(Booking.id == ticket.booking_id).first()
    loc = db.query(ParkingLocation).filter(ParkingLocation.id == booking.parking_location_id).first()
    slot = db.query(ParkingSlot).filter(ParkingSlot.id == booking.slot_id).first()

    is_valid = booking.status in ("Confirmed", "Completed")
    return ok(
        data={
            "is_valid": is_valid,
            "booking_reference": booking.booking_reference,
            "vehicle_number": booking.vehicle_number,
            "vehicle_type": booking.vehicle_type,
            "parking_location": loc.name if loc else "",
            "slot_number": slot.slot_number if slot else "",
            "entry_time": booking.entry_time.isoformat(),
            "exit_time": booking.exit_time.isoformat(),
            "booking_status": booking.status,
            "is_used": ticket.is_used,
            "checked_in_at": ticket.checked_in_at.isoformat() if ticket.checked_in_at else None,
        },
        message="Valid Parking Ticket" if is_valid else "Ticket is not active",
    )


@router.post("/verify/{token}/checkin")
def staff_checkin_ticket(
    token: str,
    admin: Profile = Depends(require_admin),
    db: Session = Depends(get_db),
):
    ticket = db.query(Ticket).filter(Ticket.verification_token == token).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    ticket.is_used = True
    ticket.checked_in_at = datetime.now(timezone.utc)
    ticket.verified_by = admin.id
    db.commit()
    return ok(data={"booking_reference": ticket.booking_reference, "checked_in_at": ticket.checked_in_at.isoformat()}, message="Vehicle checked in successfully")


@router.post("/{booking_id}/resend-email")
def resend_ticket_email(
    booking_id: str,
    current_user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Unauthorized ticket access")

    ticket = db.query(Ticket).filter(Ticket.booking_id == booking.id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Digital ticket not generated yet")

    loc = db.query(ParkingLocation).filter(ParkingLocation.id == booking.parking_location_id).first()
    slot = db.query(ParkingSlot).filter(ParkingSlot.id == booking.slot_id).first()
    payment = db.query(Payment).filter(Payment.booking_id == booking.id, Payment.status == "paid").first()

    result = send_booking_confirmation_emails(
        db=db,
        booking=booking,
        location=loc,
        slot=slot,
        ticket=ticket,
        payment_id=payment.razorpay_payment_id if payment and payment.razorpay_payment_id else "verified",
    )
    driver_res = result.get("driver", {})
    if driver_res.get("delivered"):
        return ok(data=result, message=f"Ticket emailed to {booking.customer_email}")
    return ok(
        data=result,
        message=driver_res.get("error") or "Ticket email attempted (check SMTP/Resend configuration).",
    )
