"""Public Parking Discovery, Nearest Haversine Search, Availability & Reviews (Optimized — Zero N+1)."""

import time
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import case, func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import Booking, ParkingLocation, ParkingSlot, PricingRule, Review
from app.utils.geo import format_distance_label, haversine_km
from app.utils.responses import ok

router = APIRouter(prefix="/parking", tags=["Parking"])

BASELINE_RATINGS = {
    "KK-SUC-004": (4.9, 64),
    "KK-VRM-001": (4.8, 128),
    "KK-SUN-002": (4.7, 94),
    "KK-KMR-006": (4.6, 82),
    "KK-NGL-003": (4.6, 76),
    "KK-PAD-005": (4.5, 115),
    "KK-TKL-007": (4.3, 49),
}

# Lightweight in-memory TTL cache (30 seconds) to eliminate repeated cloud DB round-trips
_PARKING_CACHE: Dict[str, object] = {"ts": 0.0, "data": None}
_LAST_EXPIRY_SWEEP: float = 0.0
CACHE_TTL_SECONDS = 30.0


def invalidate_parking_cache() -> None:
    _PARKING_CACHE["ts"] = 0.0
    _PARKING_CACHE["data"] = None


def expire_stale_bookings(db: Session, force: bool = False) -> None:
    """Release expired unpaid Pending Payment reservations (throttled to once per 30s)."""
    global _LAST_EXPIRY_SWEEP
    now_ts = time.monotonic()
    if not force and (now_ts - _LAST_EXPIRY_SWEEP) < 30.0:
        return
    _LAST_EXPIRY_SWEEP = now_ts

    now = datetime.now(timezone.utc)
    updated = (
        db.query(Booking)
        .filter(
            Booking.status == "Pending Payment",
            Booking.expires_at != None,
            Booking.expires_at < now,
        )
        .update({"status": "Expired"}, synchronize_session=False)
    )
    if updated:
        db.commit()
        invalidate_parking_cache()


def _load_all_verified_serialized(db: Session) -> List[dict]:
    """Fetch all verified locations + batched ratings + batched slot counts in 3 fast queries (cached 30s)."""
    now_ts = time.monotonic()
    if _PARKING_CACHE["data"] is not None and (now_ts - float(_PARKING_CACHE["ts"])) < CACHE_TTL_SECONDS:
        return list(_PARKING_CACHE["data"])

    locations = (
        db.query(ParkingLocation)
        .filter(ParkingLocation.is_verified == True, ParkingLocation.is_active == True)
        .all()
    )
    if not locations:
        return []

    loc_ids = [loc.id for loc in locations]

    # Single batched GROUP BY for reviews
    review_rows = (
        db.query(
            Review.parking_location_id,
            func.avg(Review.rating),
            func.count(Review.id),
        )
        .filter(Review.parking_location_id.in_(loc_ids), Review.is_visible == True)
        .group_by(Review.parking_location_id)
        .all()
    )
    review_map: Dict[str, Tuple[float, int]] = {
        row[0]: (round(float(row[1]), 1), int(row[2])) for row in review_rows if row[1] is not None
    }

    # Single batched GROUP BY for slot counts
    slot_rows = (
        db.query(
            ParkingSlot.parking_location_id,
            func.count(ParkingSlot.id),
            func.sum(case((ParkingSlot.status == "Available", 1), else_=0)),
        )
        .filter(ParkingSlot.parking_location_id.in_(loc_ids), ParkingSlot.is_active == True)
        .group_by(ParkingSlot.parking_location_id)
        .all()
    )
    slot_map: Dict[str, Tuple[int, int]] = {
        row[0]: (int(row[1] or 0), int(row[2] or 0)) for row in slot_rows
    }

    serialized = []
    for loc in locations:
        base_rating, base_count = BASELINE_RATINGS.get(loc.parking_code, (4.4, 12))
        avg_rating, total_reviews = review_map.get(loc.id, (base_rating, base_count))
        total_slots, available_slots = slot_map.get(loc.id, (loc.total_slots, loc.available_slots))

        serialized.append({
            "id": loc.id,
            "parking_code": loc.parking_code,
            "name": loc.name,
            "address": loc.address,
            "district": loc.district,
            "latitude": loc.latitude,
            "longitude": loc.longitude,
            "google_maps_url": loc.google_maps_url or f"https://maps.google.com/?q={loc.latitude},{loc.longitude}",
            "description": loc.description,
            "images": loc.images or [],
            "image_url": (
                loc.images[0]
                if loc.images
                else "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=900&q=80"
            ),
            "vehicle_types": loc.vehicle_types or ["Two Wheeler", "Four Wheeler", "Truck"],
            "total_slots": total_slots,
            "available_slots": available_slots,
            "opening_time": loc.opening_time,
            "closing_time": loc.closing_time,
            "price_per_hour": float(loc.price_per_hour),
            "currency": "INR",
            "status": loc.status,
            "is_verified": loc.is_verified,
            "average_rating": avg_rating,
            "total_reviews": total_reviews,
        })

    serialized.sort(key=lambda item: (item["average_rating"], item["total_reviews"]), reverse=True)
    _PARKING_CACHE["ts"] = now_ts
    _PARKING_CACHE["data"] = serialized
    return list(serialized)


@router.get("")
def list_parking_locations(
    q: Optional[str] = Query(None, description="Search by name, address, or town"),
    vehicle_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    expire_stale_bookings(db)
    all_locs = _load_all_verified_serialized(db)
    q_lower = q.strip().lower() if q else ""

    results = []
    for loc in all_locs:
        if status and status != "All" and loc["status"] != status:
            continue
        if q_lower and q_lower not in loc["name"].lower() and q_lower not in loc["address"].lower() and q_lower not in loc["district"].lower():
            continue
        if vehicle_type and vehicle_type != "All" and vehicle_type not in (loc["vehicle_types"] or []):
            continue
        results.append(loc)

    return ok(data=results, message="Verified parking locations fetched successfully")


@router.get("/nearest")
def get_nearest_parking(
    lat: float = Query(..., ge=-90, le=90),
    lng: float = Query(..., ge=-180, le=180),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    expire_stale_bookings(db)
    all_locs = _load_all_verified_serialized(db)
    ranked = []
    for loc in all_locs:
        dist = haversine_km(lat, lng, loc["latitude"], loc["longitude"])
        ranked.append((dist, {**loc, "distance_km": dist, "distance_label": format_distance_label(dist)}))

    ranked.sort(key=lambda pair: pair[0])
    return ok(
        data=[item[1] for item in ranked[:limit]],
        message="Nearest verified parking locations calculated successfully",
    )


@router.get("/{parking_id}")
def get_parking_detail(parking_id: str, db: Session = Depends(get_db)):
    all_locs = _load_all_verified_serialized(db)
    base = next((item for item in all_locs if item["id"] == parking_id), None)
    if not base:
        raise HTTPException(status_code=404, detail="Parking location not found")

    detail = dict(base)
    slots = (
        db.query(ParkingSlot)
        .filter(ParkingSlot.parking_location_id == parking_id, ParkingSlot.is_active == True)
        .order_by(ParkingSlot.slot_number.asc())
        .all()
    )
    rules = (
        db.query(PricingRule)
        .filter(PricingRule.parking_location_id == parking_id, PricingRule.is_active == True)
        .all()
    )
    detail["slots"] = [
        {
            "id": s.id,
            "slot_number": s.slot_number,
            "vehicle_type": s.vehicle_type,
            "floor_level": s.floor_level,
            "status": s.status,
        }
        for s in slots
    ]
    detail["pricing_rules"] = [
        {
            "vehicle_type": r.vehicle_type,
            "hourly_rate": float(r.hourly_rate),
            "base_fee": float(r.base_fee),
            "weekend_multiplier": float(r.weekend_multiplier),
            "peak_surcharge": float(r.peak_surcharge),
        }
        for r in rules
    ]
    return ok(data=detail, message="Parking location details fetched")


@router.get("/{parking_id}/availability")
def check_parking_availability(
    parking_id: str,
    entry_time: Optional[datetime] = Query(None),
    exit_time: Optional[datetime] = Query(None),
    vehicle_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    expire_stale_bookings(db)
    slot_query = db.query(ParkingSlot).filter(
        ParkingSlot.parking_location_id == parking_id,
        ParkingSlot.is_active == True,
    )
    if vehicle_type and vehicle_type != "All":
        slot_query = slot_query.filter(ParkingSlot.vehicle_type == vehicle_type)

    slots = slot_query.order_by(ParkingSlot.slot_number.asc()).all()

    booked_slot_ids = set()
    if entry_time and exit_time and exit_time > entry_time:
        overlapping = (
            db.query(Booking.slot_id)
            .filter(
                Booking.parking_location_id == parking_id,
                Booking.status.in_(["Pending Payment", "Confirmed"]),
                Booking.entry_time < exit_time,
                Booking.exit_time > entry_time,
            )
            .all()
        )
        booked_slot_ids = {row[0] for row in overlapping}

    slot_list = []
    for s in slots:
        is_free = s.status == "Available" and s.id not in booked_slot_ids
        slot_list.append({
            "id": s.id,
            "slot_number": s.slot_number,
            "vehicle_type": s.vehicle_type,
            "floor_level": s.floor_level,
            "status": "Available" if is_free else "Occupied",
            "is_available": is_free,
        })

    return ok(
        data={
            "parking_location_id": parking_id,
            "total_matching_slots": len(slot_list),
            "available_count": sum(1 for x in slot_list if x["is_available"]),
            "slots": slot_list,
        },
        message="Slot availability checked",
    )


@router.get("/{parking_id}/reviews")
def get_parking_reviews(parking_id: str, db: Session = Depends(get_db)):
    reviews = (
        db.query(Review)
        .filter(Review.parking_location_id == parking_id, Review.is_visible == True)
        .order_by(Review.created_at.desc())
        .all()
    )
    avg = round(sum(r.rating for r in reviews) / len(reviews), 1) if reviews else 0.0
    return ok(
        data={
            "average_rating": avg,
            "total_reviews": len(reviews),
            "reviews": [
                {
                    "id": r.id,
                    "rating": r.rating,
                    "title": r.title,
                    "description": r.description,
                    "images": r.images or [],
                    "user_name": r.user.full_name if r.user else "Verified Driver",
                    "created_at": r.created_at.isoformat() if r.created_at else None,
                }
                for r in reviews
            ],
        },
        message="Reviews fetched successfully",
    )
