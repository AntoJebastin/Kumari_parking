-- ============================================================================
-- KUMARI PARKING — Migration 002: Row Level Security (RLS) Policies
-- ============================================================================

-- Helper function to check admin role safely
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND role = 'admin' AND is_active = TRUE
  );
$$;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING ((SELECT auth.uid()) = id OR public.is_admin());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id AND role = 'user');

-- PARKING LOCATIONS & SLOTS & PRICING (Public read for verified active lots, Admin write)
CREATE POLICY "Public can view verified active parking locations"
  ON public.parking_locations FOR SELECT
  USING ((is_verified = TRUE AND is_active = TRUE) OR public.is_admin());

CREATE POLICY "Admins manage parking locations"
  ON public.parking_locations FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Public can view active parking slots"
  ON public.parking_slots FOR SELECT
  USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "Admins manage parking slots"
  ON public.parking_slots FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Public can view vehicle types"
  ON public.vehicle_types FOR SELECT
  USING (TRUE);

CREATE POLICY "Public can view active pricing rules"
  ON public.pricing_rules FOR SELECT
  USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "Admins manage pricing rules"
  ON public.pricing_rules FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- BOOKINGS (Strictly owner or admin)
CREATE POLICY "Users view own bookings"
  ON public.bookings FOR SELECT
  USING ((SELECT auth.uid()) = user_id OR public.is_admin());

CREATE POLICY "Users create own bookings"
  ON public.bookings FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Admins manage all bookings"
  ON public.bookings FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- PAYMENTS (Owner read-only, Backend Service Role / Admin writes)
CREATE POLICY "Users view own payments"
  ON public.payments FOR SELECT
  USING ((SELECT auth.uid()) = user_id OR public.is_admin());

-- TICKETS (Owner or Admin)
CREATE POLICY "Users view own tickets"
  ON public.tickets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = tickets.booking_id AND b.user_id = (SELECT auth.uid())
    )
    OR public.is_admin()
  );

-- REVIEWS (Public read visible reviews, authenticated insert for own booking)
CREATE POLICY "Public view visible reviews"
  ON public.reviews FOR SELECT
  USING (is_visible = TRUE OR public.is_admin());

CREATE POLICY "Users insert own booking reviews"
  ON public.reviews FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Admins manage reviews"
  ON public.reviews FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- NOTIFICATIONS, ADMIN SETTINGS, AUDIT LOGS (Admin only, or own notifications)
CREATE POLICY "Users view own notifications"
  ON public.notifications FOR SELECT
  USING ((SELECT auth.uid()) = user_id OR public.is_admin());

CREATE POLICY "Admins manage settings"
  ON public.admin_settings FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins view audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.is_admin());
