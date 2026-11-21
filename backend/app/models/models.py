"""SQLAlchemy ORM models for Kumari Parking (PostgreSQL & SQLite compatible)."""

import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    JSON,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from app.core.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    full_name = Column(String(150), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    phone = Column(String(25), nullable=True)
    password_hash = Column(String(255), nullable=True)
    role = Column(String(20), nullable=False, default="user", index=True)
    avatar_url = Column(Text, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)


class VehicleType(Base):
    __tablename__ = "vehicle_types"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(60), unique=True, nullable=False)
    code = Column(String(20), unique=True, nullable=False)
    rate_multiplier = Column(Numeric(5, 2), nullable=False, default=1.0)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)


class ParkingLocation(Base):
    __tablename__ = "parking_locations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    parking_code = Column(String(40), unique=True, nullable=False, index=True)
    name = Column(String(200), nullable=False)
    address = Column(Text, nullable=False)
    district = Column(String(80), nullable=False, default="Kanyakumari")
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    google_maps_url = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    images = Column(JSON, nullable=False, default=list)
    vehicle_types = Column(JSON, nullable=False, default=lambda: ["Two Wheeler", "Four Wheeler", "Truck"])
    total_slots = Column(Integer, nullable=False, default=0)
    available_slots = Column(Integer, nullable=False, default=0)
    opening_time = Column(String(10), nullable=False, default="05:00")
    closing_time = Column(String(10), nullable=False, default="22:00")
    price_per_hour = Column(Numeric(10, 2), nullable=False, default=30.0)
    status = Column(String(40), nullable=False, default="Available")
    is_verified = Column(Boolean, nullable=False, default=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_by = Column(String(36), ForeignKey("profiles.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    slots = relationship("ParkingSlot", back_populates="location", cascade="all, delete-orphan")
    pricing_rules = relationship("PricingRule", back_populates="location", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="location", cascade="all, delete-orphan")


class ParkingSlot(Base):
    __tablename__ = "parking_slots"
    __table_args__ = (UniqueConstraint("parking_location_id", "slot_number", name="uq_location_slot"),)

    id = Column(String(36), primary_key=True, default=generate_uuid)
    parking_location_id = Column(String(36), ForeignKey("parking_locations.id"), nullable=False, index=True)
    slot_number = Column(String(30), nullable=False)
    vehicle_type = Column(String(40), nullable=False, default="Four Wheeler")
    floor_level = Column(String(40), nullable=True, default="Ground")
    status = Column(String(30), nullable=False, default="Available")
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    location = relationship("ParkingLocation", back_populates="slots")


class PricingRule(Base):
    __tablename__ = "pricing_rules"
    __table_args__ = (UniqueConstraint("parking_location_id", "vehicle_type", name="uq_location_vehicle_rule"),)

    id = Column(String(36), primary_key=True, default=generate_uuid)
    parking_location_id = Column(String(36), ForeignKey("parking_locations.id"), nullable=False, index=True)
    vehicle_type = Column(String(40), nullable=False)
    hourly_rate = Column(Numeric(10, 2), nullable=False)
    base_fee = Column(Numeric(10, 2), nullable=False, default=0.0)
    weekend_multiplier = Column(Numeric(4, 2), nullable=False, default=1.0)
    peak_surcharge = Column(Numeric(10, 2), nullable=False, default=0.0)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    location = relationship("ParkingLocation", back_populates="pricing_rules")


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    booking_reference = Column(String(40), unique=True, nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("profiles.id"), nullable=False, index=True)
    parking_location_id = Column(String(36), ForeignKey("parking_locations.id"), nullable=False, index=True)
    slot_id = Column(String(36), ForeignKey("parking_slots.id"), nullable=False, index=True)
    customer_name = Column(String(150), nullable=False)
    customer_email = Column(String(255), nullable=False)
    customer_phone = Column(String(25), nullable=False)
    vehicle_number = Column(String(30), nullable=False)
    vehicle_type = Column(String(40), nullable=False)
    booking_date = Column(Date, nullable=False)
    entry_time = Column(DateTime(timezone=True), nullable=False)
    exit_time = Column(DateTime(timezone=True), nullable=False)
    duration_hours = Column(Numeric(6, 2), nullable=False)
    hourly_rate = Column(Numeric(10, 2), nullable=False)
    base_fee = Column(Numeric(10, 2), nullable=False, default=0.0)
    surcharge_amount = Column(Numeric(10, 2), nullable=False, default=0.0)
    total_amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(3), nullable=False, default="INR")
    status = Column(String(30), nullable=False, default="Pending Payment", index=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    location = relationship("ParkingLocation")
    slot = relationship("ParkingSlot")
    ticket = relationship("Ticket", back_populates="booking", uselist=False)


class Payment(Base):
    __tablename__ = "payments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    booking_id = Column(String(36), ForeignKey("bookings.id"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("profiles.id"), nullable=False, index=True)
    razorpay_order_id = Column(String(100), unique=True, nullable=False)
    razorpay_payment_id = Column(String(100), unique=True, nullable=True)
    razorpay_signature = Column(String(255), nullable=True)
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(3), nullable=False, default="INR")
    status = Column(String(30), nullable=False, default="created")
    method = Column(String(40), nullable=True)
    webhook_event_id = Column(String(120), unique=True, nullable=True)
    payment_metadata = Column("metadata", JSON, nullable=False, default=dict)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    booking_id = Column(String(36), ForeignKey("bookings.id"), unique=True, nullable=False)
    booking_reference = Column(String(40), unique=True, nullable=False)
    verification_token = Column(String(128), unique=True, nullable=False, index=True)
    qr_payload = Column(Text, nullable=False)
    is_used = Column(Boolean, nullable=False, default=False)
    checked_in_at = Column(DateTime(timezone=True), nullable=True)
    checked_out_at = Column(DateTime(timezone=True), nullable=True)
    verified_by = Column(String(36), ForeignKey("profiles.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    booking = relationship("Booking", back_populates="ticket")


class Review(Base):
    __tablename__ = "reviews"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    booking_id = Column(String(36), ForeignKey("bookings.id"), unique=True, nullable=False)
    user_id = Column(String(36), ForeignKey("profiles.id"), nullable=False, index=True)
    parking_location_id = Column(String(36), ForeignKey("parking_locations.id"), nullable=False, index=True)
    rating = Column(Integer, nullable=False)
    title = Column(String(160), nullable=False)
    description = Column(Text, nullable=False)
    images = Column(JSON, nullable=False, default=list)
    is_visible = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    location = relationship("ParkingLocation", back_populates="reviews")
    user = relationship("Profile")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("profiles.id"), nullable=True)
    recipient_email = Column(String(255), nullable=False)
    notification_type = Column(String(60), nullable=False)
    subject = Column(String(255), nullable=False)
    status = Column(String(20), nullable=False, default="queued")
    provider_message_id = Column(String(120), nullable=True)
    error_message = Column(Text, nullable=True)
    payload = Column(JSON, nullable=False, default=dict)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)


class AdminSetting(Base):
    __tablename__ = "admin_settings"

    key = Column(String(80), primary_key=True)
    value = Column(JSON, nullable=False)
    description = Column(Text, nullable=True)
    updated_by = Column(String(36), ForeignKey("profiles.id"), nullable=True)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    admin_id = Column(String(36), ForeignKey("profiles.id"), nullable=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(60), nullable=False)
    entity_id = Column(String(60), nullable=True)
    details = Column(JSON, nullable=False, default=dict)
    ip_address = Column(String(60), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
