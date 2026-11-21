-- ============================================================================
-- KUMARI PARKING — Development Sample Seed Data
-- Clearly identified sample data for Kanyakumari District, Tamil Nadu, India.
-- All currency amounts are in INR (₹).
-- ============================================================================

-- 1. Seed Vehicle Types
INSERT INTO public.vehicle_types (name, code, rate_multiplier, description)
VALUES
  ('Two Wheeler', '2W', 0.50, 'Motorcycles, scooters, and electric two-wheelers'),
  ('Four Wheeler', '4W', 1.00, 'Hatchbacks, sedans, and compact passenger cars'),
  ('SUV', 'SUV', 1.40, 'SUVs, MUVs, and 7-seater tourist vehicles'),
  ('Other', 'OTH', 1.75, 'Tempo travellers and light commercial vehicles')
ON CONFLICT (name) DO NOTHING;

-- 2. Seed Default Admin Settings
INSERT INTO public.admin_settings (key, value, description)
VALUES
  ('booking_expiry_minutes', '15'::jsonb, 'Minutes before unpaid Pending Payment bookings expire automatically'),
  ('currency', '"INR"'::jsonb, 'Platform currency (Indian Rupees ₹)'),
  ('district', '"Kanyakumari"'::jsonb, 'Operating district in Tamil Nadu, India')
ON CONFLICT (key) DO NOTHING;

-- 3. Seed Sample Verified Parking Locations across Kanyakumari District
INSERT INTO public.parking_locations (
  parking_code, name, address, district, latitude, longitude, google_maps_url,
  description, images, vehicle_types, total_slots, available_slots,
  opening_time, closing_time, price_per_hour, status, is_verified
)
VALUES
  (
    'KK-VRM-001',
    'Vivekananda Ferry Terminal Smart Plaza',
    'Beach Road, Near Poompuhar Boat Jetty, Kanyakumari - 629702',
    'Kanyakumari',
    8.0816, 77.5517,
    'https://maps.google.com/?q=8.0816,77.5517',
    '24/7 CCTV-monitored multi-bay parking just 120m from the Vivekananda Rock Memorial & Thiruvalluvar Statue ferry terminal.',
    '["https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=900&q=80"]'::jsonb,
    '["Two Wheeler","Four Wheeler","SUV"]'::jsonb,
    12, 12, '05:00:00', '22:00:00', 40.00, 'Available', TRUE
  ),
  (
    'KK-SUN-002',
    'Sunrise Point & Triveni Sangam Parking Hub',
    'Sannathi Street, Near Bhagavathy Amman Temple, Kanyakumari - 629702',
    'Kanyakumari',
    8.0785, 77.5504,
    'https://maps.google.com/?q=8.0785,77.5504',
    'Ideal for early-morning sunrise visitors and temple devotees. Shaded two-wheeler and four-wheeler bays with attendant assistance.',
    '["https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=900&q=80"]'::jsonb,
    '["Two Wheeler","Four Wheeler","SUV"]'::jsonb,
    10, 10, '04:30:00', '23:00:00', 35.00, 'Available', TRUE
  ),
  (
    'KK-NGL-003',
    'Nagercoil Vadasery Central Park & Ride',
    'MS Road, Opposite Vadasery Bus Stand, Nagercoil - 629001',
    'Kanyakumari',
    8.1833, 77.4119,
    'https://maps.google.com/?q=8.1833,77.4119',
    'Convenient commuter and shopper parking right beside Vadasery Bus Stand and Nagercoil commercial hub.',
    '["https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=900&q=80"]'::jsonb,
    '["Two Wheeler","Four Wheeler"]'::jsonb,
    10, 10, '06:00:00', '22:30:00', 25.00, 'Available', TRUE
  ),
  (
    'KK-SUC-004',
    'Suchindram Thanumalayan Heritage Parking',
    'Car Street, Near Suchindram Temple Gopuram, Suchindram - 629704',
    'Kanyakumari',
    8.1558, 77.4648,
    'https://maps.google.com/?q=8.1558,77.4648',
    'Safe heritage zone parking for pilgrims visiting Arulmigu Thanumalayan Swamy Temple.',
    '["https://images.unsplash.com/photo-1470224114660-3f6686c562eb?auto=format&fit=crop&w=900&q=80"]'::jsonb,
    '["Two Wheeler","Four Wheeler","SUV"]'::jsonb,
    8, 8, '05:30:00', '21:30:00', 30.00, 'Available', TRUE
  )
ON CONFLICT (parking_code) DO NOTHING;

-- 4. Seed Sample Slots for Each Location
INSERT INTO public.parking_slots (parking_location_id, slot_number, vehicle_type, floor_level, status)
SELECT
  pl.id,
  'A-' || LPAD(gs::text, 2, '0'),
  CASE
    WHEN gs <= 3 THEN 'Two Wheeler'
    WHEN gs <= 7 THEN 'Four Wheeler'
    ELSE 'SUV'
  END,
  'Ground',
  'Available'
FROM public.parking_locations pl
CROSS JOIN generate_series(1, 8) AS gs
ON CONFLICT (parking_location_id, slot_number) DO NOTHING;

-- 5. Seed Per-Vehicle Pricing Rules in INR (₹)
INSERT INTO public.pricing_rules (parking_location_id, vehicle_type, hourly_rate, base_fee, weekend_multiplier, peak_surcharge)
SELECT pl.id, vt.name, ROUND(pl.price_per_hour * vt.rate_multiplier, 2), 10.00, 1.15, 0.00
FROM public.parking_locations pl
CROSS JOIN public.vehicle_types vt
ON CONFLICT (parking_location_id, vehicle_type) DO NOTHING;
