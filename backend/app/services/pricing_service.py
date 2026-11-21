"""Dynamic INR (₹) parking price calculator — strictly server-side."""

import math
from datetime import datetime
from typing import Dict
from sqlalchemy.orm import Session
from app.models.models import ParkingLocation, PricingRule, VehicleType


def calculate_parking_price(
    db: Session,
    location: ParkingLocation,
    vehicle_type: str,
    entry_time: datetime,
    exit_time: datetime,
) -> Dict[str, float]:
    """
    Calculate parking fee securely on the backend in INR (₹).
    Never trusts any client-supplied amount.
    """
    delta_seconds = (exit_time - entry_time).total_seconds()
    if delta_seconds <= 0:
        raise ValueError("Exit time must be after entry time")

    # Minimum billable duration: 1 hour; rounded up to nearest 0.5 hr
    raw_hours = delta_seconds / 3600.0
    duration_hours = max(1.0, math.ceil(raw_hours * 2) / 2.0)

    rule = (
        db.query(PricingRule)
        .filter(
            PricingRule.parking_location_id == location.id,
            PricingRule.vehicle_type == vehicle_type,
            PricingRule.is_active == True,
        )
        .first()
    )

    if rule:
        hourly_rate = float(rule.hourly_rate)
        base_fee = float(rule.base_fee)
        weekend_mult = float(rule.weekend_multiplier)
        peak_surcharge = float(rule.peak_surcharge)
    else:
        vt = db.query(VehicleType).filter(VehicleType.name == vehicle_type).first()
        multiplier = float(vt.rate_multiplier) if vt else 1.0
        hourly_rate = round(float(location.price_per_hour) * multiplier, 2)
        base_fee = 0.0
        weekend_mult = 1.0
        peak_surcharge = 0.0

    is_weekend = entry_time.weekday() >= 5
    parking_subtotal = round(hourly_rate * duration_hours, 2)
    weekend_extra = round(parking_subtotal * (weekend_mult - 1.0), 2) if is_weekend and weekend_mult > 1.0 else 0.0
    surcharge_amount = round(weekend_extra + peak_surcharge, 2)
    total_amount = round(parking_subtotal + base_fee + surcharge_amount, 2)

    return {
        "currency": "INR",
        "duration_hours": duration_hours,
        "hourly_rate": hourly_rate,
        "parking_subtotal": parking_subtotal,
        "base_fee": base_fee,
        "surcharge_amount": surcharge_amount,
        "is_weekend": is_weekend,
        "total_amount": total_amount,
    }
