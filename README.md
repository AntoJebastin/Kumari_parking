# Kumari Parking

> **Find Your Spot. Park with Confidence.**  
> Smart Parking Slot Reservation and Management Platform for **Kanyakumari District, Tamil Nadu, India**.

## Overview

**Kumari Parking** helps residents, commuters, and tourists across Kanyakumari District (Nagercoil, Kanyakumari Beach, Vivekananda Rock Memorial Ferry Terminal, Suchindram, Marthandam, Colachel, and more) discover verified parking locations, check real-time slot availability, reserve parking slots, pay securely in **INR (₹)** via Razorpay, and receive boarding-pass-style digital parking tickets with scannable QR codes.

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, React Router DOM, Axios, Lucide React, Framer Motion, React Hook Form, React QR Code |
| **Backend** | Python, FastAPI, Pydantic, SQLAlchemy, Uvicorn, SlowAPI, Jinja2 |
| **Database & Auth** | Supabase PostgreSQL (with Row Level Security), Supabase Authentication, Supabase Storage |
| **Integrations** | Google Maps API, Browser Geolocation API, Razorpay Payment Gateway (INR ₹), Resend Email API |

## Project Structure

```text
Kumari Parking/
├── frontend/               # React + Vite + Tailwind CSS client
│   └── src/
│       ├── components/     # Reusable UI components
│       ├── pages/          # Route-level pages (Home, Booking, Dashboards, etc.)
│       ├── layouts/        # Main, Auth, User & Admin layouts
│       ├── hooks/          # Custom React hooks (geolocation, auth, theme)
│       ├── services/       # Axios API client & Supabase client
│       ├── context/        # AuthContext, ThemeContext
│       ├── utils/          # Currency (₹), date/time, Haversine helpers
│       ├── assets/         # Kanyakumari visuals, icons, SVGs
│       ├── routes/         # Public, Protected, and Admin route guards
│       └── styles/         # Global CSS & Tailwind theme tokens
├── backend/                # Python FastAPI REST API
│   ├── app/
│   │   ├── api/            # Versioned FastAPI route modules
│   │   ├── core/           # Config, security, database, logging
│   │   ├── models/         # SQLAlchemy ORM models
│   │   ├── schemas/        # Pydantic request/response schemas
│   │   ├── services/       # Business logic (pricing, Razorpay, Resend, QR)
│   │   ├── repositories/   # Database access layer
│   │   ├── middleware/     # Auth, CORS, rate-limiting, audit logging
│   │   ├── utils/          # Haversine distance, token & reference generators
│   │   └── templates/      # Resend HTML email templates
│   ├── migrations/         # Backend migration references
│   └── tests/              # Pytest unit & integration tests
└── database/               # Supabase PostgreSQL schema & dev seed data
    ├── migrations/         # Ordered SQL migrations with RLS policies
    └── seed.sql            # Sample Kanyakumari parking locations for dev
```

## Quick Start

### 1. Environment Variables
Copy the example environment files and populate your credentials:
- `frontend/.env.example` → `frontend/.env`
- `backend/.env.example` → `backend/.env`

### 2. Run Backend
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 3. Run Frontend
```powershell
cd frontend
npm install
npm run dev
```

## Currency & Localization
- All prices and transactions are strictly in **Indian Rupees (₹ / INR)**.
- Supports English and Tamil labels where appropriate for Kanyakumari District.
