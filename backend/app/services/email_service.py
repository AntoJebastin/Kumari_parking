"""Resend Email API + Optional Gmail SMTP Fallback with Kanyakumari-branded HTML & QR Tickets."""

import base64
import io
import logging
import smtplib
from email.mime.image import MIMEImage
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.models import Notification, Profile

logger = logging.getLogger("kumari_parking.email")


def _generate_qr_png_bytes(data: str) -> bytes:
    """Generate a crisp PNG QR code in memory for ticket emails."""
    import qrcode

    qr = qrcode.QRCode(version=1, box_size=8, border=3)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#073B5C", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def _wrap_html(title: str, body_html: str) -> str:
    return f"""
    <!DOCTYPE html>
    <html>
      <body style="margin:0;padding:0;background:#F4F8FB;font-family:Inter,Arial,sans-serif;color:#102A43;">
        <div style="max-width:600px;margin:24px auto;background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #E2E8F0;">
          <div style="background:linear-gradient(135deg,#073B5C,#087CA7,#16A34A);padding:28px 24px;color:#FFFFFF;">
            <h1 style="margin:0;font-size:22px;letter-spacing:-0.3px;">Kumari <span style="color:#F59E0B;">Parking</span></h1>
            <p style="margin:4px 0 0;font-size:12px;color:#E0F2FE;">Find Your Spot. Park with Confidence. • Kanyakumari District, Tamil Nadu</p>
          </div>
          <div style="padding:28px 24px;">
            <h2 style="margin:0 0 14px;color:#073B5C;font-size:19px;">{title}</h2>
            {body_html}
          </div>
          <div style="background:#F8FAFC;padding:16px 24px;border-top:1px solid #E2E8F0;font-size:12px;color:#64748B;">
            © Kumari Parking • Villukuri, Kanyakumari District, Tamil Nadu 629702 • +91 9500977950 • All amounts in INR (₹)
          </div>
        </div>
      </body>
    </html>
    """


def _send_via_smtp(
    recipient_email: str,
    subject: str,
    html_content: str,
    qr_png: Optional[bytes] = None,
    qr_filename: str = "parking-ticket-qr.png",
) -> None:
    msg = MIMEMultipart("related")
    msg["From"] = f"Kumari Parking <{settings.SMTP_USER}>"
    msg["To"] = recipient_email
    msg["Subject"] = subject

    msg.attach(MIMEText(html_content, "html", "utf-8"))

    if qr_png:
        img = MIMEImage(qr_png, _subtype="png")
        img.add_header("Content-ID", "<ticket_qr>")
        img.add_header("Content-Disposition", "inline", filename=qr_filename)
        msg.attach(img)

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_APP_PASSWORD)
        server.sendmail(settings.SMTP_USER, [recipient_email], msg.as_string())


def send_email_safe(
    db: Session,
    recipient_email: str,
    subject: str,
    html_content: str,
    notification_type: str,
    user_id: Optional[str] = None,
    payload: Optional[dict] = None,
    qr_png: Optional[bytes] = None,
    qr_filename: str = "parking-ticket-qr.png",
) -> dict:
    """
    Send email via Resend API (with automatic Gmail SMTP fallback if configured).
    Never raises an unhandled exception so a failed email NEVER marks a paid booking as failed.
    """
    record = Notification(
        user_id=user_id,
        recipient_email=recipient_email,
        notification_type=notification_type,
        subject=subject,
        status="queued",
        payload=payload or {},
    )

    if not settings.has_resend and not settings.has_smtp:
        record.status = "sent"
        record.provider_message_id = "dev-log-only"
        record.error_message = "No email provider configured; logged locally."
        db.add(record)
        db.commit()
        logger.info("[DEV EMAIL] To=%s | Subject=%s | Type=%s", recipient_email, subject, notification_type)
        return {"delivered": False, "mode": "dev_logged", "message": record.error_message}

    resend_error = None

    # 1. Try Resend API first when configured
    if settings.has_resend:
        try:
            import resend

            resend.api_key = settings.RESEND_API_KEY
            email_params = {
                "from": settings.RESEND_FROM_EMAIL,
                "to": [recipient_email],
                "subject": subject,
                "html": html_content,
            }
            if qr_png:
                email_params["attachments"] = [
                    {
                        "filename": qr_filename,
                        "content": base64.b64encode(qr_png).decode("utf-8"),
                    }
                ]
            response = resend.Emails.send(email_params)
            record.status = "sent"
            record.provider_message_id = str(response.get("id", "")) if isinstance(response, dict) else str(response)
            db.add(record)
            db.commit()
            return {"delivered": True, "mode": "resend", "id": record.provider_message_id}
        except Exception as exc:
            resend_error = str(exc)
            logger.warning("Resend failed for %s (%s); checking SMTP fallback...", recipient_email, resend_error)

    # 2. Fallback to Gmail / SMTP when configured (works for ANY driver email without a verified custom domain)
    if settings.has_smtp:
        try:
            _send_via_smtp(recipient_email, subject, html_content, qr_png=qr_png, qr_filename=qr_filename)
            record.status = "sent"
            record.provider_message_id = "smtp-delivered"
            record.error_message = None
            db.add(record)
            db.commit()
            return {"delivered": True, "mode": "smtp"}
        except Exception as smtp_exc:
            err_msg = f"SMTP failed: {smtp_exc}" + (f" | Resend: {resend_error}" if resend_error else "")
            logger.error("Email delivery failed for %s: %s", recipient_email, err_msg)
            record.status = "failed"
            record.error_message = err_msg
            db.add(record)
            db.commit()
            return {"delivered": False, "mode": "error", "error": err_msg}

    record.status = "failed"
    record.error_message = resend_error or "Email delivery failed"
    db.add(record)
    db.commit()
    return {"delivered": False, "mode": "error", "error": record.error_message}


def send_welcome_emails(db: Session, user_id: str, full_name: str, email: str, phone: str) -> None:
    user_html = _wrap_html(
        f"Welcome to Kumari Parking, {full_name}!",
        f"""
        <p style="line-height:1.6;">Thank you for creating your account with <strong>Kumari Parking</strong>.</p>
        <p style="line-height:1.6;">You can now discover admin-verified parking locations across Kanyakumari District, reserve slots in advance, pay securely in INR (₹), and receive instant QR code parking tickets.</p>
        <p style="margin-top:20px;"><a href="{settings.FRONTEND_URL}" style="display:inline-block;background:#F59E0B;color:#FFFFFF;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600;">Explore Kanyakumari Parking</a></p>
        """,
    )
    send_email_safe(
        db=db,
        recipient_email=email,
        subject="Welcome to Kumari Parking!",
        html_content=user_html,
        notification_type="welcome_user",
        user_id=user_id,
    )

    admin_html = _wrap_html(
        "New User Registration — Kumari Parking",
        f"""
        <p>A new user has registered on Kumari Parking:</p>
        <ul style="line-height:1.8;">
          <li><strong>Name:</strong> {full_name}</li>
          <li><strong>Email:</strong> {email}</li>
          <li><strong>Mobile:</strong> {phone or 'N/A'}</li>
        </ul>
        """,
    )
    send_email_safe(
        db=db,
        recipient_email=settings.ADMIN_EMAIL,
        subject=f"New Registration: {full_name} — Kumari Parking",
        html_content=admin_html,
        notification_type="welcome_admin",
        user_id=user_id,
    )


def send_booking_confirmation_emails(
    db: Session,
    booking,
    location,
    slot,
    ticket,
    payment_id: str,
) -> dict:
    ticket_url = f"{settings.FRONTEND_URL}/verify-ticket/{ticket.verification_token}"
    nav_url = (
        f"https://www.google.com/maps/dir/?api=1&destination={location.latitude},{location.longitude}"
        if location and location.latitude is not None and location.longitude is not None
        else (location.google_maps_url if location else settings.FRONTEND_URL)
    )

    qr_png = None
    try:
        qr_png = _generate_qr_png_bytes(ticket.qr_payload or ticket_url)
    except Exception as exc:
        logger.warning("QR PNG generation skipped: %s", exc)

    details_html = f"""
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0;">
      <tr><td style="padding:8px;border-bottom:1px solid #E2E8F0;color:#64748B;">Booking Ref</td><td style="padding:8px;border-bottom:1px solid #E2E8F0;font-weight:700;">{booking.booking_reference}</td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #E2E8F0;color:#64748B;">Driver</td><td style="padding:8px;border-bottom:1px solid #E2E8F0;">{booking.customer_name} ({booking.customer_phone})</td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #E2E8F0;color:#64748B;">Vehicle</td><td style="padding:8px;border-bottom:1px solid #E2E8F0;">{booking.vehicle_number} ({booking.vehicle_type})</td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #E2E8F0;color:#64748B;">Parking Location</td><td style="padding:8px;border-bottom:1px solid #E2E8F0;"><strong>{location.name if location else ''}</strong><br/><span style="font-size:12px;color:#475569;">{location.address if location else ''}</span></td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #E2E8F0;color:#64748B;">Slot Number</td><td style="padding:8px;border-bottom:1px solid #E2E8F0;font-weight:700;color:#073B5C;">{slot.slot_number if slot else ''}</td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #E2E8F0;color:#64748B;">Entry / Exit</td><td style="padding:8px;border-bottom:1px solid #E2E8F0;">{booking.entry_time.strftime('%d %b %Y, %I:%M %p')} – {booking.exit_time.strftime('%I:%M %p')}</td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #E2E8F0;color:#64748B;">Amount Paid</td><td style="padding:8px;border-bottom:1px solid #E2E8F0;font-weight:700;color:#16A34A;">₹{float(booking.total_amount):.2f} (INR)</td></tr>
      <tr><td style="padding:8px;color:#64748B;">Payment ID</td><td style="padding:8px;">{payment_id}</td></tr>
    </table>
    <p style="font-size:12px;color:#475569;">Your scannable QR code pass is attached to this email. Show it at the parking entrance gate.</p>
    <div style="margin-top:18px;">
      <a href="{ticket_url}" style="display:inline-block;background:#073B5C;color:#FFFFFF;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:600;margin-right:8px;">View Digital QR Ticket</a>
      <a href="{nav_url}" style="display:inline-block;background:#16A34A;color:#FFFFFF;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:600;">Navigate in Google Maps</a>
    </div>
    """

    qr_filename = f"Kumari-Parking-Ticket-{booking.booking_reference}.png"

    # 1. Send to Driver's email entered in the booking form
    driver_result = send_email_safe(
        db=db,
        recipient_email=booking.customer_email,
        subject=f"Your Parking Ticket: {booking.booking_reference} — Kumari Parking",
        html_content=_wrap_html("Your Digital Parking Ticket is Confirmed!", details_html),
        notification_type="booking_confirmed_user",
        user_id=booking.user_id,
        payload={"booking_id": booking.id, "booking_reference": booking.booking_reference},
        qr_png=qr_png,
        qr_filename=qr_filename,
    )

    # 2. If logged-in account email differs from driver email, send a copy there too
    account = db.query(Profile).filter(Profile.id == booking.user_id).first()
    if account and account.email and account.email.lower() != booking.customer_email.lower():
        send_email_safe(
            db=db,
            recipient_email=account.email,
            subject=f"Your Parking Ticket: {booking.booking_reference} — Kumari Parking",
            html_content=_wrap_html("Your Digital Parking Ticket is Confirmed!", details_html),
            notification_type="booking_confirmed_account",
            user_id=booking.user_id,
            payload={"booking_id": booking.id, "booking_reference": booking.booking_reference},
            qr_png=qr_png,
            qr_filename=qr_filename,
        )

    # 3. Send copy to Admin email
    admin_result = send_email_safe(
        db=db,
        recipient_email=settings.ADMIN_EMAIL,
        subject=f"New Confirmed Booking: {booking.booking_reference} (₹{float(booking.total_amount):.2f})",
        html_content=_wrap_html("New Paid Booking Notification", details_html),
        notification_type="booking_confirmed_admin",
        user_id=booking.user_id,
        payload={"booking_id": booking.id, "booking_reference": booking.booking_reference},
        qr_png=qr_png,
        qr_filename=qr_filename,
    )

    return {"driver": driver_result, "admin": admin_result}
