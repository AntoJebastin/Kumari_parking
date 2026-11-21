"""Development database initializer & sample Kanyakumari District seed data."""

from sqlalchemy.orm import Session
from app.core.database import Base, migration_engine, SessionLocal
from app.core.security import hash_password
from app.models.models import (
    AdminSetting,
    ParkingLocation,
    ParkingSlot,
    PricingRule,
    Profile,
    VehicleType,
)


def init_and_seed_db() -> None:
    """Create tables via direct connection (Neon DDL best practice) and insert sample dev records."""
    Base.metadata.create_all(bind=migration_engine)
    db: Session = SessionLocal()
    try:
        # 1. Vehicle Types
        if db.query(VehicleType).count() == 0:
            vtypes = [
                VehicleType(name="Two Wheeler", code="2W", rate_multiplier=0.50, description="Motorcycles & scooters"),
                VehicleType(name="Four Wheeler", code="4W", rate_multiplier=1.00, description="Hatchbacks & sedans"),
                VehicleType(name="Truck", code="TRK", rate_multiplier=1.75, description="Trucks, goods carriers & heavy vehicles"),
                VehicleType(name="Other", code="OTH", rate_multiplier=1.50, description="Tempo travellers & light vans"),
            ]
            db.add_all(vtypes)
            db.commit()
        else:
            # Migrate legacy SUV vehicle type -> Truck if present
            suv_vt = db.query(VehicleType).filter(VehicleType.name == "SUV").first()
            if suv_vt:
                suv_vt.name = "Truck"
                suv_vt.code = "TRK"
                suv_vt.rate_multiplier = 1.75
                suv_vt.description = "Trucks, goods carriers & heavy vehicles"
            for slot in db.query(ParkingSlot).filter(ParkingSlot.vehicle_type == "SUV").all():
                slot.vehicle_type = "Truck"
            for rule in db.query(PricingRule).filter(PricingRule.vehicle_type == "SUV").all():
                rule.vehicle_type = "Truck"
            for loc_row in db.query(ParkingLocation).all():
                if loc_row.vehicle_types and "SUV" in loc_row.vehicle_types:
                    loc_row.vehicle_types = ["Truck" if v == "SUV" else v for v in loc_row.vehicle_types]
            db.commit()

        # 2. Default Admin Settings
        if db.query(AdminSetting).count() == 0:
            db.add_all([
                AdminSetting(key="booking_expiry_minutes", value=15, description="Unpaid hold expiry in minutes"),
                AdminSetting(key="currency", value="INR", description="Currency strictly in Indian Rupees (₹)"),
                AdminSetting(key="district", value="Kanyakumari", description="Operating district"),
            ])
            db.commit()

        # 3. Dev Admin & Demo User (for local testing; Supabase Auth manages production users)
        admin = db.query(Profile).filter(Profile.email == "admin@kumariparking.in").first()
        if not admin:
            admin = Profile(
                full_name="Kumari Parking Admin",
                email="admin@kumariparking.in",
                phone="+91 98421 00001",
                password_hash=hash_password("Admin@123"),
                role="admin",
            )
            db.add(admin)

        demo_user = db.query(Profile).filter(Profile.email == "demo@kumariparking.in").first()
        if not demo_user:
            demo_user = Profile(
                full_name="Karthik Natarajan",
                email="demo@kumariparking.in",
                phone="+91 98421 12345",
                password_hash=hash_password("User@123"),
                role="user",
            )
            db.add(demo_user)
        db.commit()
        db.refresh(admin)

        # 4. Sample Kanyakumari District Verified Parking Locations (idempotent per parking_code)
        sample_locations = [
                {
                    "parking_code": "KK-VRM-001",
                    "name": "Vivekananda Ferry Terminal Smart Plaza",
                    "address": "Beach Road, Near Poompuhar Boat Jetty, Kanyakumari - 629702",
                    "district": "Kanyakumari",
                    "latitude": 8.0816,
                    "longitude": 77.5517,
                    "google_maps_url": "https://maps.google.com/?q=8.0816,77.5517",
                    "description": "24/7 CCTV-monitored parking just 120m from the Vivekananda Rock Memorial & Thiruvalluvar Statue ferry terminal.",
                    "images": ["https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=900&q=80"],
                    "vehicle_types": ["Two Wheeler", "Four Wheeler", "Truck"],
                    "total_slots": 12,
                    "available_slots": 12,
                    "opening_time": "05:00",
                    "closing_time": "22:00",
                    "price_per_hour": 40.0,
                    "status": "Available",
                },
                {
                    "parking_code": "KK-SUN-002",
                    "name": "Sunrise Point & Triveni Sangam Parking Hub",
                    "address": "Sannathi Street, Near Bhagavathy Amman Temple, Kanyakumari - 629702",
                    "district": "Kanyakumari",
                    "latitude": 8.0785,
                    "longitude": 77.5504,
                    "google_maps_url": "https://maps.google.com/?q=8.0785,77.5504",
                    "description": "Ideal for early-morning sunrise visitors and temple devotees. Shaded two-wheeler and four-wheeler bays.",
                    "images": ["https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=900&q=80"],
                    "vehicle_types": ["Two Wheeler", "Four Wheeler", "Truck"],
                    "total_slots": 10,
                    "available_slots": 10,
                    "opening_time": "04:30",
                    "closing_time": "23:00",
                    "price_per_hour": 35.0,
                    "status": "Available",
                },
                {
                    "parking_code": "KK-NGL-003",
                    "name": "Nagercoil Vadasery Central Park & Ride",
                    "address": "MS Road, Opposite Vadasery Bus Stand, Nagercoil - 629001",
                    "district": "Kanyakumari",
                    "latitude": 8.1833,
                    "longitude": 77.4119,
                    "google_maps_url": "https://maps.google.com/?q=8.1833,77.4119",
                    "description": "Convenient commuter and shopper parking right beside Vadasery Bus Stand and Nagercoil commercial hub.",
                    "images": ["https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=900&q=80"],
                    "vehicle_types": ["Two Wheeler", "Four Wheeler"],
                    "total_slots": 10,
                    "available_slots": 10,
                    "opening_time": "06:00",
                    "closing_time": "22:30",
                    "price_per_hour": 25.0,
                    "status": "Available",
                },
                {
                    "parking_code": "KK-SUC-004",
                    "name": "Suchindram Thanumalayan Heritage Parking",
                    "address": "Car Street, Near Suchindram Temple Gopuram, Suchindram - 629704",
                    "district": "Kanyakumari",
                    "latitude": 8.1558,
                    "longitude": 77.4648,
                    "google_maps_url": "https://maps.google.com/?q=8.1558,77.4648",
                    "description": "Safe heritage zone parking for pilgrims visiting Arulmigu Thanumalayan Swamy Temple.",
                    "images": ["https://images.unsplash.com/photo-1470224114660-3f6686c562eb?auto=format&fit=crop&w=900&q=80"],
                    "vehicle_types": ["Two Wheeler", "Four Wheeler", "Truck"],
                    "total_slots": 8,
                    "available_slots": 8,
                    "opening_time": "05:30",
                    "closing_time": "21:30",
                    "price_per_hour": 30.0,
                    "status": "Available",
                },
                {
                    "parking_code": "KK-PAD-005",
                    "name": "Padmanabhapuram Palace Parking Area",
                    "address": "Palace Road, Padmanabhapuram, Thuckalay, Kanyakumari - 629175",
                    "district": "Kanyakumari",
                    "latitude": 8.2508,
                    "longitude": 77.3266,
                    "google_maps_url": "https://maps.google.com/?q=8.2508,77.3266",
                    "description": "Designated visitor parking bay right next to the historic Padmanabhapuram Wooden Palace in Thuckalay.",
                    "images": ["https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=900&q=80"],
                    "vehicle_types": ["Two Wheeler", "Four Wheeler", "Truck"],
                    "total_slots": 14,
                    "available_slots": 14,
                    "opening_time": "08:00",
                    "closing_time": "18:30",
                    "price_per_hour": 30.0,
                    "status": "Available",
                },
                {
                    "parking_code": "KK-KMR-006",
                    "name": "Kumaracoil Velimalai Temple Parking Lot",
                    "address": "Temple Foothills Road, Kumaracoil, Thuckalay, Kanyakumari - 629180",
                    "district": "Kanyakumari",
                    "latitude": 8.2484,
                    "longitude": 77.3442,
                    "google_maps_url": "https://maps.google.com/?q=8.2484,77.3442",
                    "description": "Spacious hilltop-access parking for Kumaracoil Murugan Temple devotees and weekend travelers.",
                    "images": ["https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=900&q=80"],
                    "vehicle_types": ["Two Wheeler", "Four Wheeler", "Truck"],
                    "total_slots": 12,
                    "available_slots": 12,
                    "opening_time": "05:00",
                    "closing_time": "21:00",
                    "price_per_hour": 25.0,
                    "status": "Available",
                },
                {
                    "parking_code": "KK-TKL-007",
                    "name": "Thuckalay Central Bus Stand & Market Parking",
                    "address": "NH-66 Main Road, Near Thuckalay Bus Stand, Kanyakumari - 629175",
                    "district": "Kanyakumari",
                    "latitude": 8.2469,
                    "longitude": 77.3210,
                    "google_maps_url": "https://maps.google.com/?q=8.2469,77.3210",
                    "description": "Central town parking along the Nagercoil–Thiruvananthapuram highway with dedicated two-wheeler bays.",
                    "images": ["https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=900&q=80"],
                    "vehicle_types": ["Two Wheeler", "Four Wheeler"],
                    "total_slots": 10,
                    "available_slots": 10,
                    "opening_time": "06:00",
                    "closing_time": "22:00",
                    "price_per_hour": 20.0,
                    "status": "Available",
                },
        ]

        vtype_rows = db.query(VehicleType).all()

        for item in sample_locations:
            if db.query(ParkingLocation).filter(ParkingLocation.parking_code == item["parking_code"]).first():
                continue
            loc = ParkingLocation(**item, is_verified=True, is_active=True, created_by=admin.id)
            db.add(loc)
            db.flush()

            for idx in range(1, item["total_slots"] + 1):
                if idx <= 3:
                    vt = "Two Wheeler"
                elif idx <= item["total_slots"] - 2:
                    vt = "Four Wheeler"
                else:
                    vt = "Truck" if "Truck" in item["vehicle_types"] else "Four Wheeler"
                db.add(
                    ParkingSlot(
                        parking_location_id=loc.id,
                        slot_number=f"A-{idx:02d}",
                        vehicle_type=vt,
                        floor_level="Ground",
                        status="Available",
                    )
                )

            for vt_row in vtype_rows:
                db.add(
                    PricingRule(
                        parking_location_id=loc.id,
                        vehicle_type=vt_row.name,
                        hourly_rate=round(float(loc.price_per_hour) * float(vt_row.rate_multiplier), 2),
                        base_fee=10.0,
                        weekend_multiplier=1.15,
                        peak_surcharge=0.0,
                    )
                )
        db.commit()
    finally:
        db.close()
