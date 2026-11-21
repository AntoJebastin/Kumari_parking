# Kumari Parking — Deployment & Credentials Guide

## 1. Supabase PostgreSQL & Auth Setup
1. Create a project at [supabase.com](https://supabase.com).
2. Run the SQL migrations in order via **Supabase SQL Editor**:
   - `database/migrations/001_initial_schema.sql`
   - `database/migrations/002_rls_policies.sql`
   - (Optional for staging/dev) `database/seed.sql`
3. Copy **Project URL**, **Anon Key**, **Service Role Key**, **JWT Secret**, and **PostgreSQL Connection URI** into `frontend/.env` and `backend/.env`.

## 2. Razorpay Payment Gateway Setup (INR ₹)
1. Create an account at [dashboard.razorpay.com](https://dashboard.razorpay.com) and switch to **Test Mode**.
2. Generate **Key ID (`rzp_test_...`)** and **Key Secret**.
3. Set `VITE_RAZORPAY_KEY_ID` in `frontend/.env` (public key only).
4. Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` in `backend/.env`.
5. Configure Razorpay Webhook URL to: `https://your-api-domain.com/api/webhooks/razorpay` subscribing to `payment.captured` and `payment.failed`.

## 3. Resend Email API Setup
1. Sign up at [resend.com](https://resend.com) and create an API key.
2. Set `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `ADMIN_EMAIL` in `backend/.env`.

## 4. Google Maps API Setup
1. Enable **Maps JavaScript API** in Google Cloud Console.
2. Restrict the API key by HTTP referrer to your frontend domain.
3. Set `VITE_GOOGLE_MAPS_API_KEY` in `frontend/.env`.

## 5. Production Deployment
- **Frontend**: Deploy `frontend/` to Vercel (uses `frontend/vercel.json` for SPA routing) with `VITE_*` environment variables.
- **Backend**: Deploy `backend/` using `backend/Dockerfile` to Render, Railway, Fly.io, or Cloud Run with `APP_ENV=production` and all secrets configured.
