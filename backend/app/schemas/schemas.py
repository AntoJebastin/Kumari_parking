"""Pydantic schemas for request validation and response serialization."""

from datetime import date, datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field


# --- Auth ---
class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150)
    email: EmailStr
    phone: str = Field(..., min_length=8, max_length=20)
    password: str = Field(..., min_length=6, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=150)
    phone: Optional[str] = Field(None, min_length=8, max_length=20)


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=6, max_length=128)


# --- Parking Location & Slots ---
class ParkingLocationCreate(BaseModel):
    parking_code: str = Field(..., min_length=3, max_length=40)
    name: str = Field(..., min_length=3, max_length=200)
    address: str = Field(..., min_length=5)
    district: str = Field(default="Kanyakumari")
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    google_maps_url: Optional[str] = None
    description: Optional[str] = None
    images: List[str] = Field(default_factory=list)
    vehicle_types: List[str] = Field(default_factory=lambda: ["Two Wheeler", "Four Wheeler", "Truck"])
    total_slots: int = Field(..., ge=1, le=2000)
    opening_time: str = Field(default="05:00")
    closing_time: str = Field(default="22:00")
    price_per_hour: float = Field(..., ge=0)
    status: str = Field(default="Available")


class ParkingLocationUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    district: Optional[str] = None
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    google_maps_url: Optional[str] = None
    description: Optional[str] = None
    images: Optional[List[str]] = None
    vehicle_types: Optional[List[str]] = None
    total_slots: Optional[int] = Field(None, ge=0)
    available_slots: Optional[int] = Field(None, ge=0)
    opening_time: Optional[str] = None
    closing_time: Optional[str] = None
    price_per_hour: Optional[float] = Field(None, ge=0)
    status: Optional[str] = None
    is_active: Optional[bool] = None


class ParkingSlotCreate(BaseModel):
    slot_number: str = Field(..., min_length=1, max_length=30)
    vehicle_type: str = Field(default="Four Wheeler")
    floor_level: str = Field(default="Ground")
    status: str = Field(default="Available")


# --- Booking & Pricing ---
class PriceEstimateRequest(BaseModel):
    parking_location_id: str
    vehicle_type: str
    entry_time: datetime
    exit_time: datetime


class BookingCreateRequest(BaseModel):
    parking_location_id: str
    slot_id: str
    customer_name: str = Field(..., min_length=2, max_length=150)
    customer_email: EmailStr
    customer_phone: str = Field(..., min_length=8, max_length=20)
    vehicle_number: str = Field(..., min_length=4, max_length=30)
    vehicle_type: str
    booking_date: date
    entry_time: datetime
    exit_time: datetime


# --- Payments ---
class CreateOrderRequest(BaseModel):
    booking_id: str


class VerifyPaymentRequest(BaseModel):
    booking_id: str
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


# --- Reviews ---
class ReviewCreateRequest(BaseModel):
    booking_id: str
    rating: int = Field(..., ge=1, le=5)
    title: str = Field(..., min_length=3, max_length=160)
    description: str = Field(..., min_length=5, max_length=2000)
    images: List[str] = Field(default_factory=list)


# --- Admin Settings ---
class AdminSettingUpdate(BaseModel):
    value: Any
    description: Optional[str] = None
