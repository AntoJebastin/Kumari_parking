"""Role-Protected Admin Dashboard & Management Endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.v1.parking import invalidate_parking_cache
from app.core.database import get_db
from app.core.security import require_admin
from app.models.models import (
    AdminSetting,
    AuditLog,
    Booking,
    Notification,
    ParkingLocation,
    ParkingSlot,
    Payment,
    PricingRule,
    Profile,
    Review,
    VehicleType,
)
from app.schemas.schemas import (
    AdminSettingUpdate,
    ParkingLocationCreate,
    ParkingLocationUpdate,
    ParkingSlotCreate,
)
from app.utils.responses import ok

router = APIRouter(prefix="/admin", tags=["Admin"], dependencies=[Depends(require_admin)])


def _log_admin_action(db: Session, admin: Profile, action: str, entity_type: str, entity_id: str, details: dict, request: Request) -> None:
    db.add(
        AuditLog(
            admin_id=admin.id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details,
            ip_address=request.client.host if request.client else None,
        )
    )
    db.commit()


@router.get("/dashboard")
def get_admin_dashboard(db: Session = Depends(get_db)):
    total_users = db.query(Profile).filter(Profile.role == "user").count()
    total_locations = db.query(ParkingLocation).filter(ParkingLocation.is_active == True).count()
    total_slots = db.query(ParkingSlot).filter(ParkingSlot.is_active == True).count()
    available_slots = (
        db.query(ParkingSlot)
        .filter(ParkingSlot.is_active == True, ParkingSlot.status == "Available")
        .count()
    )
    total_bookings = db.query(Booking).count()
    confirmed_bookings = db.query(Booking).filter(Booking.status == "Confirmed").count()
    pending_payments = db.query(Booking).filter(Booking.status == "Pending Payment").count()
    total_revenue = (
        db.query(func.coalesce(func.sum(Payment.amount), 0))
        .filter(Payment.status == "paid")
        .scalar()
    )

    recent = db.query(Booking).order_by(Booking.created_at.desc()).limit(10).all()
    recent_loc_ids = list({b.parking_location_id for b in recent})
    loc_map = (
        {l.id: l.name for l in db.query(ParkingLocation).filter(ParkingLocation.id.in_(recent_loc_ids)).all()}
        if recent_loc_ids
        else {}
    )
    recent_list = [
        {
            "id": b.id,
            "booking_reference": b.booking_reference,
            "customer_name": b.customer_name,
            "vehicle_number": b.vehicle_number,
            "parking_name": loc_map.get(b.parking_location_id, ""),
            "total_amount": float(b.total_amount),
            "currency": "INR",
            "status": b.status,
            "created_at": b.created_at.isoformat() if b.created_at else None,
        }
        for b in recent
    ]

    return ok(
        data={
            "total_users": total_users,
            "total_locations": total_locations,
            "total_slots": total_slots,
            "available_slots": available_slots,
            "total_bookings": total_bookings,
            "confirmed_bookings": confirmed_bookings,
            "pending_payments": pending_payments,
            "total_revenue": float(total_revenue or 0),
            "currency": "INR",
            "recent_bookings": recent_list,
        },
        message="Admin dashboard metrics retrieved",
    )


@router.get("/parking")
def admin_list_parking(db: Session = Depends(get_db)):
    locs = db.query(ParkingLocation).order_by(ParkingLocation.created_at.desc()).all()
    return ok(
        data=[
            {
                "id": l.id,
                "parking_code": l.parking_code,
                "name": l.name,
                "address": l.address,
                "district": l.district,
                "latitude": l.latitude,
                "longitude": l.longitude,
                "google_maps_url": l.google_maps_url,
                "description": l.description,
                "images": l.images or [],
                "vehicle_types": l.vehicle_types or [],
                "total_slots": l.total_slots,
                "available_slots": l.available_slots,
                "opening_time": l.opening_time,
                "closing_time": l.closing_time,
                "price_per_hour": float(l.price_per_hour),
                "status": l.status,
                "is_verified": l.is_verified,
                "is_active": l.is_active,
            }
            for l in locs
        ],
        message="All parking locations fetched",
    )


@router.post("/parking", status_code=status.HTTP_201_CREATED)
def admin_create_parking(
    payload: ParkingLocationCreate,
    request: Request,
    admin: Profile = Depends(require_admin),
    db: Session = Depends(get_db),
):
    if db.query(ParkingLocation).filter(ParkingLocation.parking_code == payload.parking_code).first():
        raise HTTPException(status_code=409, detail="Parking ID / code already exists")

    loc = ParkingLocation(
        parking_code=payload.parking_code.strip().upper(),
        name=payload.name.strip(),
        address=payload.address.strip(),
        district=payload.district.strip(),
        latitude=payload.latitude,
        longitude=payload.longitude,
        google_maps_url=payload.google_maps_url or f"https://maps.google.com/?q={payload.latitude},{payload.longitude}",
        description=payload.description,
        images=payload.images or ["https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=900&q=80"],
        vehicle_types=payload.vehicle_types,
        total_slots=payload.total_slots,
        available_slots=payload.total_slots,
        opening_time=payload.opening_time,
        closing_time=payload.closing_time,
        price_per_hour=payload.price_per_hour,
        status=payload.status,
        is_verified=True,
        is_active=True,
        created_by=admin.id,
    )
    db.add(loc)
    db.flush()

    # Auto-provision initial slots
    vtypes = payload.vehicle_types or ["Four Wheeler"]
    for idx in range(1, min(payload.total_slots, 100) + 1):
        vt = vtypes[(idx - 1) % len(vtypes)]
        db.add(
            ParkingSlot(
                parking_location_id=loc.id,
                slot_number=f"S-{idx:02d}",
                vehicle_type=vt,
                floor_level="Ground",
                status="Available",
            )
        )

    # Auto-provision INR pricing rules
    for vt_row in db.query(VehicleType).all():
        db.add(
            PricingRule(
                parking_location_id=loc.id,
                vehicle_type=vt_row.name,
                hourly_rate=round(float(payload.price_per_hour) * float(vt_row.rate_multiplier), 2),
                base_fee=10.0,
                weekend_multiplier=1.15,
            )
        )

    db.commit()
    db.refresh(loc)
    invalidate_parking_cache()
    _log_admin_action(db, admin, "CREATE_PARKING", "parking_location", loc.id, {"name": loc.name}, request)
    return ok(data={"id": loc.id, "parking_code": loc.parking_code, "name": loc.name}, message="Verified parking location created")


@router.put("/parking/{parking_id}")
def admin_update_parking(
    parking_id: str,
    payload: ParkingLocationUpdate,
    request: Request,
    admin: Profile = Depends(require_admin),
    db: Session = Depends(get_db),
):
    loc = db.query(ParkingLocation).filter(ParkingLocation.id == parking_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Parking location not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(loc, field, val)
    db.commit()
    _log_admin_action(db, admin, "UPDATE_PARKING", "parking_location", loc.id, update_data, request)
    return ok(data={"id": loc.id, "status": loc.status}, message="Parking location updated")


@router.delete("/parking/{parking_id}")
def admin_delete_parking(
    parking_id: str,
    request: Request,
    admin: Profile = Depends(require_admin),
    db: Session = Depends(get_db),
):
    loc = db.query(ParkingLocation).filter(ParkingLocation.id == parking_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Parking location not found")
    loc.is_active = False
    loc.status = "Closed"
    db.commit()
    _log_admin_action(db, admin, "DEACTIVATE_PARKING", "parking_location", loc.id, {"name": loc.name}, request)
    return ok(message="Parking location deactivated successfully")


@router.post("/parking/{parking_id}/slots", status_code=status.HTTP_201_CREATED)
def admin_add_slot(
    parking_id: str,
    payload: ParkingSlotCreate,
    db: Session = Depends(get_db),
):
    loc = db.query(ParkingLocation).filter(ParkingLocation.id == parking_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Parking location not found")
    slot = ParkingSlot(
        parking_location_id=parking_id,
        slot_number=payload.slot_number.strip().upper(),
        vehicle_type=payload.vehicle_type,
        floor_level=payload.floor_level,
        status=payload.status,
    )
    db.add(slot)
    loc.total_slots += 1
    if payload.status == "Available":
        loc.available_slots += 1
    db.commit()
    db.refresh(slot)
    return ok(data={"id": slot.id, "slot_number": slot.slot_number}, message="Parking slot added")


@router.get("/bookings")
def admin_list_bookings(db: Session = Depends(get_db)):
    rows = db.query(Booking).order_by(Booking.created_at.desc()).limit(200).all()
    if not rows:
        return ok(data=[], message="Bookings list retrieved")
    loc_ids = list({b.parking_location_id for b in rows})
    slot_ids = list({b.slot_id for b in rows})
    loc_map = {l.id: l.name for l in db.query(ParkingLocation).filter(ParkingLocation.id.in_(loc_ids)).all()}
    slot_map = {s.id: s.slot_number for s in db.query(ParkingSlot).filter(ParkingSlot.id.in_(slot_ids)).all()}
    data = [
        {
            "id": b.id,
            "booking_reference": b.booking_reference,
            "customer_name": b.customer_name,
            "customer_email": b.customer_email,
            "customer_phone": b.customer_phone,
            "vehicle_number": b.vehicle_number,
            "vehicle_type": b.vehicle_type,
            "parking_name": loc_map.get(b.parking_location_id, ""),
            "slot_number": slot_map.get(b.slot_id, ""),
            "entry_time": b.entry_time.isoformat(),
            "exit_time": b.exit_time.isoformat(),
            "total_amount": float(b.total_amount),
            "currency": "INR",
            "status": b.status,
            "created_at": b.created_at.isoformat() if b.created_at else None,
        }
        for b in rows
    ]
    return ok(data=data, message="Bookings list retrieved")


@router.get("/payments")
def admin_list_payments(db: Session = Depends(get_db)):
    rows = db.query(Payment).order_by(Payment.created_at.desc()).limit(200).all()
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
        message="Payment transactions retrieved",
    )


@router.get("/users")
def admin_list_users(db: Session = Depends(get_db)):
    users = db.query(Profile).order_by(Profile.created_at.desc()).all()
    return ok(
        data=[
            {
                "id": u.id,
                "full_name": u.full_name,
                "email": u.email,
                "phone": u.phone,
                "role": u.role,
                "is_active": u.is_active,
                "created_at": u.created_at.isoformat() if u.created_at else None,
            }
            for u in users
        ],
        message="Users list retrieved",
    )


@router.get("/reviews")
def admin_list_reviews(db: Session = Depends(get_db)):
    reviews = db.query(Review).order_by(Review.created_at.desc()).all()
    return ok(
        data=[
            {
                "id": r.id,
                "parking_name": r.location.name if r.location else "",
                "user_name": r.user.full_name if r.user else "",
                "rating": r.rating,
                "title": r.title,
                "description": r.description,
                "is_visible": r.is_visible,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in reviews
        ],
        message="Reviews retrieved",
    )


@router.get("/notifications")
def admin_list_notifications(db: Session = Depends(get_db)):
    notes = db.query(Notification).order_by(Notification.created_at.desc()).limit(100).all()
    return ok(
        data=[
            {
                "id": n.id,
                "recipient_email": n.recipient_email,
                "notification_type": n.notification_type,
                "subject": n.subject,
                "status": n.status,
                "error_message": n.error_message,
                "created_at": n.created_at.isoformat() if n.created_at else None,
            }
            for n in notes
        ],
        message="Email notification logs retrieved",
    )


@router.put("/settings/{key}")
def admin_update_setting(
    key: str,
    payload: AdminSettingUpdate,
    admin: Profile = Depends(require_admin),
    db: Session = Depends(get_db),
):
    setting = db.query(AdminSetting).filter(AdminSetting.key == key).first()
    if setting:
        setting.value = payload.value
        if payload.description:
            setting.description = payload.description
        setting.updated_by = admin.id
    else:
        setting = AdminSetting(
            key=key,
            value=payload.value,
            description=payload.description,
            updated_by=admin.id,
        )
        db.add(setting)
    db.commit()
    return ok(data={"key": key, "value": payload.value}, message="Setting saved")
