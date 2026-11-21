"""End-to-end API integration tests for Kumari Parking."""

from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
from app.main import app
from app.services.seed_service import init_and_seed_db

init_and_seed_db()
client = TestClient(app)


def test_health_and_parking_discovery():
    res = client.get("/api/health")
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert body["data"]["currency"] == "INR"

    list_res = client.get("/api/parking")
    assert list_res.status_code == 200
    assert len(list_res.json()["data"]) >= 4

    nearest = client.get("/api/parking/nearest", params={"lat": 8.081, "lng": 77.551})
    assert nearest.status_code == 200
    data = nearest.json()["data"]
    assert len(data) >= 1
    assert "distance_km" in data[0]


def test_auth_booking_payment_ticket_and_rbac():
    # 1. Login as demo user
    login_res = client.post(
        "/api/auth/login",
        json={"email": "demo@kumariparking.in", "password": "User@123"},
    )
    assert login_res.status_code == 200
    user_token = login_res.json()["data"]["access_token"]
    user_headers = {"Authorization": f"Bearer {user_token}"}

    # 2. Regular user MUST NOT access admin dashboard
    forbidden = client.get("/api/admin/dashboard", headers=user_headers)
    assert forbidden.status_code == 403

    # 3. Get parking detail & first available slot
    locs = client.get("/api/parking").json()["data"]
    loc_id = locs[0]["id"]
    detail = client.get(f"/api/parking/{loc_id}").json()["data"]
    slot_id = detail["slots"][0]["id"]

    entry = datetime.now(timezone.utc) + timedelta(hours=2)
    exit_t = entry + timedelta(hours=3)

    # 4. Dynamic INR estimate
    est = client.post(
        "/api/bookings/estimate",
        json={
            "parking_location_id": loc_id,
            "vehicle_type": "Four Wheeler",
            "entry_time": entry.isoformat(),
            "exit_time": exit_t.isoformat(),
        },
    )
    assert est.status_code == 200
    assert est.json()["data"]["currency"] == "INR"
    assert est.json()["data"]["total_amount"] > 0

    # 5. Create booking
    booking_res = client.post(
        "/api/bookings",
        headers=user_headers,
        json={
            "parking_location_id": loc_id,
            "slot_id": slot_id,
            "customer_name": "Karthik Test",
            "customer_email": "demo@kumariparking.in",
            "customer_phone": "+919842112345",
            "vehicle_number": "TN74AB1234",
            "vehicle_type": "Four Wheeler",
            "booking_date": entry.date().isoformat(),
            "entry_time": entry.isoformat(),
            "exit_time": exit_t.isoformat(),
        },
    )
    assert booking_res.status_code == 201
    booking_id = booking_res.json()["data"]["id"]

    # 6. Overlapping booking on same slot MUST fail with 409
    overlap_res = client.post(
        "/api/bookings",
        headers=user_headers,
        json={
            "parking_location_id": loc_id,
            "slot_id": slot_id,
            "customer_name": "Overlap Test",
            "customer_email": "demo@kumariparking.in",
            "customer_phone": "+919842112345",
            "vehicle_number": "TN74CD5678",
            "vehicle_type": "Four Wheeler",
            "booking_date": entry.date().isoformat(),
            "entry_time": entry.isoformat(),
            "exit_time": exit_t.isoformat(),
        },
    )
    assert overlap_res.status_code == 409

    # 7. Create Razorpay order & verify HMAC-SHA256 signature
    order_res = client.post(
        "/api/payments/create-order",
        headers=user_headers,
        json={"booking_id": booking_id},
    )
    assert order_res.status_code == 200
    order_id = order_res.json()["data"]["order_id"]

    # Tampered signature MUST fail
    bad_verify = client.post(
        "/api/payments/verify",
        headers=user_headers,
        json={
            "booking_id": booking_id,
            "razorpay_order_id": order_id,
            "razorpay_payment_id": "pay_fake_123",
            "razorpay_signature": "invalid_signature",
        },
    )
    assert bad_verify.status_code == 400

    # Valid signature succeeds and issues QR ticket
    sign_res = client.post(
        "/api/payments/dev-sandbox-sign",
        headers=user_headers,
        json={"razorpay_order_id": order_id},
    )
    signed = sign_res.json()["data"]
    verify_res = client.post(
        "/api/payments/verify",
        headers=user_headers,
        json={"booking_id": booking_id, **signed},
    )
    assert verify_res.status_code == 200
    qr_token = verify_res.json()["data"]["ticket"]["verification_token"]

    # 8. Verify QR ticket endpoint
    qr_check = client.get(f"/api/tickets/verify/{qr_token}")
    assert qr_check.status_code == 200
    assert qr_check.json()["data"]["is_valid"] is True

    # 9. Admin login & dashboard check
    admin_login = client.post(
        "/api/auth/login",
        json={"email": "admin@kumariparking.in", "password": "Admin@123"},
    )
    assert admin_login.status_code == 200
    admin_token = admin_login.json()["data"]["access_token"]
    dash = client.get(
        "/api/admin/dashboard",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert dash.status_code == 200
    assert dash.json()["data"]["total_revenue"] > 0
