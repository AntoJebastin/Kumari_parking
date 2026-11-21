"""Digital parking ticket & secure QR verification token service."""

import secrets
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.models import Booking, Ticket


def create_ticket_for_booking(db: Session, booking: Booking) -> Ticket:
    """Create or return an existing digital ticket for a confirmed booking."""
    existing = db.query(Ticket).filter(Ticket.booking_id == booking.id).first()
    if existing:
        return existing

    token = secrets.token_urlsafe(32)
    # QR payload contains ONLY the secure verification URL/token — never sensitive PII
    qr_payload = f"{settings.FRONTEND_URL}/verify-ticket/{token}"

    ticket = Ticket(
        booking_id=booking.id,
        booking_reference=booking.booking_reference,
        verification_token=token,
        qr_payload=qr_payload,
        is_used=False,
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket
