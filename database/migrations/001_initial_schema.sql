-- ============================================================================
-- KUMARI PARKING — Migration 001: Core Relational Schema (Supabase PostgreSQL)
-- Currency: Strictly INR (₹)
-- Location: Kanyakumari District, Tamil Nadu, India
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- ----------------------------------------------------------------------------
-- 1. PROFILES (extends Supabase auth.users)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- ----------------------------------------------------------------------------
-- 2. VEHICLE TYPES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vehicle_types (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  rate_multiplier NUMERIC(5,2) NOT NULL DEFAULT 1.00 CHECK (rate_multiplier > 0),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. PARKING LOCATIONS (Admin-verified only)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.parking_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parking_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  district TEXT NOT NULL DEFAULT 'Kanyakumari',
  latitude DOUBLE PRECISION NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  google_maps_url TEXT,
  description TEXT,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  vehicle_types JSONB NOT NULL DEFAULT '["Two Wheeler","Four Wheeler","SUV"]'::jsonb,
  total_slots INTEGER NOT NULL DEFAULT 0 CHECK (total_slots >= 0),
  available_slots INTEGER NOT NULL DEFAULT 0 CHECK (available_slots >= 0),
  opening_time TIME NOT NULL DEFAULT '05:00:00',
  closing_time TIME NOT NULL DEFAULT '22:00:00',
  price_per_hour NUMERIC(10,2) NOT NULL CHECK (price_per_hour >= 0),
  status TEXT NOT NULL DEFAULT 'Available'
    CHECK (status IN ('Available', 'Full', 'Closed', 'Temporarily Unavailable')),
  is_verified BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_parking_locations_status ON public.parking_locations(status) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_parking_locations_coords ON public.parking_locations(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_parking_locations_district ON public.parking_locations(district);

-- ----------------------------------------------------------------------------
-- 4. PARKING SLOTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.parking_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parking_location_id UUID NOT NULL REFERENCES public.parking_locations(id) ON DELETE CASCADE,
  slot_number TEXT NOT NULL,
  vehicle_type TEXT NOT NULL DEFAULT 'Four Wheeler',
  floor_level TEXT DEFAULT 'Ground',
  status TEXT NOT NULL DEFAULT 'Available'
    CHECK (status IN ('Available', 'Occupied', 'Maintenance')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (parking_location_id, slot_number)
);

CREATE INDEX IF NOT EXISTS idx_parking_slots_location ON public.parking_slots(parking_location_id, status);

-- ----------------------------------------------------------------------------
-- 5. PRICING RULES (Per-location & vehicle-type dynamic pricing in INR)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parking_location_id UUID NOT NULL REFERENCES public.parking_locations(id) ON DELETE CASCADE,
  vehicle_type TEXT NOT NULL,
  hourly_rate NUMERIC(10,2) NOT NULL CHECK (hourly_rate >= 0),
  base_fee NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (base_fee >= 0),
  weekend_multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.00 CHECK (weekend_multiplier >= 1.00),
  peak_surcharge NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (peak_surcharge >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (parking_location_id, vehicle_type)
);

CREATE INDEX IF NOT EXISTS idx_pricing_rules_location ON public.pricing_rules(parking_location_id);

-- ----------------------------------------------------------------------------
-- 6. BOOKINGS (With database-level overlap prevention via EXCLUDE USING gist)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_reference TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  parking_location_id UUID NOT NULL REFERENCES public.parking_locations(id) ON DELETE RESTRICT,
  slot_id UUID NOT NULL REFERENCES public.parking_slots(id) ON DELETE RESTRICT,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  vehicle_number TEXT NOT NULL,
  vehicle_type TEXT NOT NULL,
  booking_date DATE NOT NULL,
  entry_time TIMESTAMPTZ NOT NULL,
  exit_time TIMESTAMPTZ NOT NULL,
  duration_hours NUMERIC(6,2) NOT NULL CHECK (duration_hours > 0),
  hourly_rate NUMERIC(10,2) NOT NULL CHECK (hourly_rate >= 0),
  base_fee NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  surcharge_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  total_amount NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'INR' CHECK (currency = 'INR'),
  status TEXT NOT NULL DEFAULT 'Pending Payment'
    CHECK (status IN ('Pending Payment', 'Confirmed', 'Cancelled', 'Expired', 'Completed')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_booking_time_order CHECK (exit_time > entry_time),
  CONSTRAINT no_overlapping_active_slot_bookings
    EXCLUDE USING gist (
      slot_id WITH =,
      tstzrange(entry_time, exit_time, '[)') WITH &&
    )
    WHERE (status IN ('Pending Payment', 'Confirmed'))
);

CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_location_id ON public.bookings(parking_location_id, booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status_expires ON public.bookings(status, expires_at)
  WHERE status = 'Pending Payment';

-- ----------------------------------------------------------------------------
-- 7. PAYMENTS (Razorpay INR transactions — never stores sensitive card details)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  razorpay_order_id TEXT NOT NULL UNIQUE,
  razorpay_payment_id TEXT UNIQUE,
  razorpay_signature TEXT,
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'INR' CHECK (currency = 'INR'),
  status TEXT NOT NULL DEFAULT 'created'
    CHECK (status IN ('created', 'paid', 'failed', 'refunded')),
  method TEXT,
  webhook_event_id TEXT UNIQUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id, created_at DESC);

-- ----------------------------------------------------------------------------
-- 8. TICKETS (Digital Boarding Pass + Secure QR Verification Token)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
  booking_reference TEXT NOT NULL UNIQUE,
  verification_token TEXT NOT NULL UNIQUE,
  qr_payload TEXT NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT FALSE,
  checked_in_at TIMESTAMPTZ,
  checked_out_at TIMESTAMPTZ,
  verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickets_verification_token ON public.tickets(verification_token);

-- ----------------------------------------------------------------------------
-- 9. REVIEWS (One review per eligible booking)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parking_location_id UUID NOT NULL REFERENCES public.parking_locations(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_location ON public.reviews(parking_location_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON public.reviews(user_id);

-- ----------------------------------------------------------------------------
-- 10. NOTIFICATIONS (Resend email audit trail)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  recipient_email TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'failed')),
  provider_message_id TEXT,
  error_message TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, created_at DESC);

-- ----------------------------------------------------------------------------
-- 11. ADMIN SETTINGS & AUDIT LOGS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ----------------------------------------------------------------------------
-- AUTO-UPDATE updated_at TRIGGER
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'profiles', 'parking_locations', 'parking_slots',
    'pricing_rules', 'bookings', 'payments', 'reviews'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_updated_at ON public.%s;', tbl, tbl);
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON public.%s FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();',
      tbl, tbl
    );
  END LOOP;
END;
$$;
