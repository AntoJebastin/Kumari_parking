import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  LocateFixed,
  Compass,
  MapPin,
  ShieldCheck,
  QrCode,
  IndianRupee,
  Clock,
  Smartphone,
  Mail,
  Star,
  ChevronDown,
  Send,
  Phone,
  Navigation,
  CheckCircle2,
  X,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import ParkingAnimatedHeading from '../components/ParkingAnimatedHeading';
import ParkingCard from '../components/ParkingCard';
import ParkingCardSkeleton from '../components/ParkingCardSkeleton';
import EmptyState from '../components/EmptyState';
import api from '../services/api';
import { calculateHaversineKm, formatDistance, formatINR } from '../utils/formatters';
import {
  KANYAKUMARI_LANDMARKS,
  PREVIEW_PARKING_LOCATIONS,
  SAMPLE_TESTIMONIALS,
  FAQ_ITEMS,
} from '../data/demoPreviewData';

const HOW_IT_WORKS_STEPS = [
  {
    step: '01',
    icon: MapPin,
    title: 'Discover Verified Parking',
    description:
      'Enable GPS or search any landmark in Kanyakumari District to see admin-verified parking lots ranked by distance.',
  },
  {
    step: '02',
    icon: Clock,
    title: 'Pick Slot, Vehicle & Duration',
    description:
      'Choose Two Wheeler, Four Wheeler, or Truck, select an open slot, and review the transparent ₹ price breakdown.',
  },
  {
    step: '03',
    icon: IndianRupee,
    title: 'Pay Securely via Razorpay',
    description:
      'Complete checkout in INR (₹) using UPI, cards, or net banking with backend cryptographic verification.',
  },
  {
    step: '04',
    icon: QrCode,
    title: 'Scan Digital QR Ticket',
    description:
      'Receive an instant boarding-pass-style QR ticket on screen and by email. Scan at entry and park with confidence.',
  },
];

const WHY_CHOOSE_FEATURES = [
  {
    icon: ShieldCheck,
    title: '100% Admin-Verified Lots',
    description:
      'Every parking location is inspected and onboarded manually by Kumari Parking administrators — never unverified map guesses.',
  },
  {
    icon: LocateFixed,
    title: 'Smart GPS Nearest Finder',
    description:
      'Instant Haversine distance ranking from your live location with direct Google Maps turn-by-turn navigation.',
  },
  {
    icon: IndianRupee,
    title: 'Transparent INR (₹) Pricing',
    description:
      'Dynamic vehicle-based hourly rates calculated securely on the backend with zero hidden charges.',
  },
  {
    icon: QrCode,
    title: 'Boarding-Pass QR Tickets',
    description:
      'Tamper-resistant QR verification tokens downloadable as PDF, printable, and accessible anytime in My Bookings.',
  },
  {
    icon: Smartphone,
    title: 'Zero Double-Booking Guarantee',
    description:
      'Transaction-safe slot locking prevents overlapping reservations and auto-releases unpaid holds.',
  },
  {
    icon: Mail,
    title: 'Instant Email Confirmations',
    description:
      'Automated Resend email receipts with your booking reference, slot number, and digital QR pass.',
  },
];

export default function HomePage() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usingPreview, setUsingPreview] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const [userCoords, setUserCoords] = useState(null);
  const [locating, setLocating] = useState(false);

  const [openFaqIdx, setOpenFaqIdx] = useState(0);
  const [reviewModalLocation, setReviewModalLocation] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  // Fetch verified parking locations from backend (falls back to Phase 2 UI preview if backend/DB not yet connected)
  useEffect(() => {
    let active = true;
    async function loadLocations() {
      setLoading(true);
      try {
        const res = await api.get('/parking');
        if (active && res?.success && Array.isArray(res.data)) {
          setLocations(res.data);
          setUsingPreview(false);
        } else if (active) {
          setLocations(PREVIEW_PARKING_LOCATIONS);
          setUsingPreview(true);
        }
      } catch {
        if (active) {
          setLocations(PREVIEW_PARKING_LOCATIONS);
          setUsingPreview(true);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    loadLocations();
    return () => {
      active = false;
    };
  }, []);

  // Capture user's live GPS location via Browser Geolocation API
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser. Please search manually.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setUserCoords(coords);
        setLocating(false);
        toast.success('Location detected! Sorting nearest verified parking spots.');
        const el = document.getElementById('nearest-parking');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          toast.error('Location permission denied. You can search manually by town or landmark.');
        } else {
          toast.error('Unable to retrieve GPS location. Please search manually.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Enrich locations with distance if GPS coordinates exist
  const enrichedLocations = useMemo(() => {
    return locations.map((loc) => {
      if (userCoords && loc.latitude && loc.longitude) {
        return {
          ...loc,
          distance_km: calculateHaversineKm(
            userCoords.lat,
            userCoords.lng,
            Number(loc.latitude),
            Number(loc.longitude)
          ),
        };
      }
      return loc;
    });
  }, [locations, userCoords]);

  // Nearest parking sorted by distance (or availability if GPS not enabled yet)
  const nearestLocations = useMemo(() => {
    const sorted = [...enrichedLocations];
    if (userCoords) {
      sorted.sort((a, b) => (a.distance_km ?? 9999) - (b.distance_km ?? 9999));
    } else {
      sorted.sort((a, b) => (b.available_slots || 0) - (a.available_slots || 0));
    }
    return sorted.slice(0, 3);
  }, [enrichedLocations, userCoords]);

  // Filtered popular/search locations — sorted by highest rating first
  const filteredLocations = useMemo(() => {
    return enrichedLocations
      .filter((loc) => {
        const q = searchQuery.trim().toLowerCase();
        const matchesQuery =
          !q ||
          loc.name.toLowerCase().includes(q) ||
          loc.address.toLowerCase().includes(q) ||
          (loc.district || '').toLowerCase().includes(q);
        const matchesVehicle =
          vehicleFilter === 'All' || (loc.vehicle_types || []).includes(vehicleFilter);
        const matchesStatus = statusFilter === 'All' || loc.status === statusFilter;
        return matchesQuery && matchesVehicle && matchesStatus;
      })
      .sort(
        (a, b) =>
          (Number(b.average_rating) || 0) - (Number(a.average_rating) || 0) ||
          (Number(b.total_reviews) || 0) - (Number(a.total_reviews) || 0)
      );
  }, [enrichedLocations, searchQuery, vehicleFilter, statusFilter]);

  const onContactSubmit = async (data) => {
    try {
      await api.post('/contact', data);
      toast.success(`Thank you, ${data.name}! Your message has been emailed to District Support.`);
      reset();
    } catch (err) {
      toast.error(err.message || 'Unable to send message right now.');
    }
  };

  return (
    <MainLayout>
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pb-36 pt-16 text-white sm:pb-44 sm:pt-24">
        {/* Pure Kanyakumari Background Image (no color shade overlay) */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/kanyakumari-bg.jpg?v=2')" }}
          aria-hidden="true"
        />

        <div className="section-container relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#087CA7]/70 bg-[#073B5C]/90 px-4 py-1.5 text-xs font-semibold tracking-wide text-sky-100 shadow-md"
            >
              <Sparkles className="h-3.5 w-3.5 text-sky-300" />
              Kanyakumari District’s Official Smart Parking Platform • குமரி பார்க்கிங்
            </motion.div>

            <ParkingAnimatedHeading
              prefix="Find Your Parking Spot in"
              highlight="Kanyakumari"
              align="center"
              size="hero"
            />

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="mt-4 text-base text-sky-100/90 sm:text-lg"
            >
              Discover, Reserve and Park with Confidence.
            </motion.p>

            {/* Hero Glass Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="mt-8 rounded-2xl border border-white/25 bg-white/15 p-2.5 shadow-2xl backdrop-blur-xl"
            >
              <div className="flex flex-col gap-2.5 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Vivekananda Ferry, Beach Road, Nagercoil, Suchindram..."
                    className="w-full rounded-xl bg-white py-3.5 pl-12 pr-4 text-sm text-[#102A43] placeholder-slate-400 shadow-inner focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('popular-parking');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="btn-sunrise whitespace-nowrap !py-3.5 !px-6"
                >
                  <Search className="h-4 w-4" />
                  Search Parking
                </button>
              </div>
            </motion.div>

            {/* Hero Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24 }}
              className="mt-5 flex flex-wrap items-center justify-center gap-3"
            >
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={locating}
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/15 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/25"
              >
                <LocateFixed className={`h-4 w-4 text-amber-300 ${locating ? 'animate-spin' : ''}`} />
                {locating ? 'Detecting GPS...' : 'Use My Current Location'}
              </button>

              <Link
                to="/nearest"
                className="inline-flex items-center gap-2 rounded-xl bg-[#073B5C]/80 px-4 py-2.5 text-sm font-semibold text-white border border-sky-400/30 backdrop-blur-md transition hover:bg-[#073B5C]"
              >
                <Navigation className="h-4 w-4 text-[#F59E0B]" />
                Find Nearest Parking
              </Link>

              <Link
                to="/explore"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#073B5C] shadow-md transition hover:bg-sky-50"
              >
                <Compass className="h-4 w-4 text-[#087CA7]" />
                Explore Parking Locations
              </Link>
            </motion.div>

            {/* Trust Stats */}
            <div className="mt-10 grid grid-cols-3 gap-4 border-t border-white/15 pt-7 text-center">
              <div>
                <p className="font-heading text-2xl font-bold text-amber-300 sm:text-3xl">100%</p>
                <p className="text-xs text-sky-100/80 sm:text-sm">Admin-Verified Lots</p>
              </div>
              <div>
                <p className="font-heading text-2xl font-bold text-white sm:text-3xl">₹25+</p>
                <p className="text-xs text-sky-100/80 sm:text-sm">Transparent Hourly INR</p>
              </div>
              <div>
                <p className="font-heading text-2xl font-bold text-emerald-300 sm:text-3xl">Instant</p>
                <p className="text-xs text-sky-100/80 sm:text-sm">QR Boarding Pass</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SEARCH PARKING FILTER BAR */}
      <section className="section-container relative z-20 -mt-16">
        <div className="glass-card rounded-2xl p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Quick Landmarks:
              </span>
              {KANYAKUMARI_LANDMARKS.map((landmark) => (
                <button
                  key={landmark}
                  type="button"
                  onClick={() => setSearchQuery(landmark.split(' ')[0])}
                  className="rounded-full border border-[#087CA7]/25 bg-[#087CA7]/5 px-3 py-1 text-xs font-medium text-[#073B5C] transition hover:bg-[#087CA7] hover:text-white dark:border-sky-400/25 dark:bg-sky-400/10 dark:text-sky-200"
                >
                  {landmark}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <select
                aria-label="Filter by vehicle type"
                value={vehicleFilter}
                onChange={(e) => setVehicleFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-[#102A43] focus:border-[#087CA7] focus:outline-none dark:border-sky-900 dark:bg-[#0B1D2E] dark:text-slate-100"
              >
                <option value="All">All Vehicles</option>
                <option value="Two Wheeler">Two Wheeler</option>
                <option value="Four Wheeler">Four Wheeler</option>
                <option value="Truck">Truck</option>
              </select>

              <select
                aria-label="Filter by availability status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-[#102A43] focus:border-[#087CA7] focus:outline-none dark:border-sky-900 dark:bg-[#0B1D2E] dark:text-slate-100"
              >
                <option value="All">All Statuses</option>
                <option value="Available">Available Now</option>
                <option value="Full">Full</option>
              </select>

              {(searchQuery || vehicleFilter !== 'All' || statusFilter !== 'All') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setVehicleFilter('All');
                    setStatusFilter('All');
                  }}
                  className="text-xs font-semibold text-[#DC2626] hover:underline"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {usingPreview && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-amber-50 px-3.5 py-2 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
              <Sparkles className="h-4 w-4 shrink-0 text-[#F59E0B]" />
              <span>
                <strong>Phase 2 UI Preview Mode:</strong> Showing sample Kanyakumari District lots.
                Live Supabase database records will automatically replace this preview in Phases 3–6.
              </span>
            </div>
          )}
        </div>
      </section>

      {/* 3. NEAREST PARKING LOCATIONS */}
      <section id="nearest-parking" className="section-container py-16">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#087CA7] dark:text-sky-400">
              GPS &amp; Haversine Ranking
            </span>
            <h2 className="mt-1 font-heading text-2xl font-bold text-[#073B5C] dark:text-white sm:text-3xl">
              Nearest Parking Locations
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {userCoords
                ? `Showing closest verified parking facilities to your GPS (${userCoords.lat.toFixed(4)}, ${userCoords.lng.toFixed(4)}).`
                : 'Enable GPS to calculate exact distance to every verified Kanyakumari parking lot.'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={locating}
            className="btn-outline"
          >
            <LocateFixed className={`h-4 w-4 ${locating ? 'animate-spin' : ''}`} />
            {userCoords ? 'Refresh My GPS' : 'Enable GPS Location'}
          </button>
        </div>

        <div className="mt-7 grid gap-5 md:grid-cols-3">
          {loading
            ? [1, 2, 3].map((i) => <ParkingCardSkeleton key={i} />)
            : nearestLocations.map((loc, idx) => (
              <div
                key={loc.id}
                className="relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card transition hover:border-[#087CA7]/50 hover:shadow-card-hover dark:border-sky-900/50 dark:bg-[#102A43]"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#073B5C] px-3 py-1 text-[11px] font-semibold text-white">
                      #{idx + 1} {userCoords ? 'Nearest' : 'Recommended'}
                    </span>
                    {loc.distance_km !== undefined && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#087CA7] dark:text-sky-300">
                        <Navigation className="h-3.5 w-3.5" />
                        {formatDistance(loc.distance_km)} away
                      </span>
                    )}
                  </div>

                  <h3 className="mt-3 font-heading text-lg font-bold text-[#102A43] dark:text-white">
                    {loc.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{loc.address}</p>

                  <div className="mt-4 grid grid-cols-2 gap-2.5 rounded-xl bg-[#F4F8FB] p-3 text-xs dark:bg-[#0B1D2E]/80">
                    <div>
                      <p className="text-slate-500 dark:text-slate-400">Available Slots</p>
                      <p className="mt-0.5 font-heading text-base font-bold text-[#16A34A]">
                        {loc.available_slots} / {loc.total_slots}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 dark:text-slate-400">Hourly Rate</p>
                      <p className="mt-0.5 font-heading text-base font-bold text-[#073B5C] dark:text-amber-300">
                        {formatINR(loc.price_per_hour)}/hr
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <a
                    href={loc.google_maps_url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-outline flex-1 !py-2 !px-3 !text-xs"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Directions
                  </a>
                  <Link
                    to={`/booking/${loc.id}`}
                    className="btn-primary flex-1 !py-2 !px-3 !text-xs"
                  >
                    Reserve Slot
                  </Link>
                </div>
              </div>
            ))}
        </div>
      </section>

      {/* 4. POPULAR PARKING LOCATIONS */}
      <section id="popular-parking" className="bg-white/60 py-16 dark:bg-[#0E2439]/60">
        <div className="section-container">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#F59E0B]">
                Verified Facilities
              </span>
              <h2 className="mt-1 font-heading text-2xl font-bold text-[#073B5C] dark:text-white sm:text-3xl">
                Popular Parking Locations in Kanyakumari
              </h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Showing <strong>{filteredLocations.length}</strong> verified location
              {filteredLocations.length === 1 ? '' : 's'}
            </p>
          </div>

          <div className="mt-8">
            {loading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <ParkingCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredLocations.length === 0 ? (
              <EmptyState
                title="No matching verified parking spots"
                description="No verified parking locations match your current filters. Try resetting the search or exploring another Kanyakumari landmark."
                actionLabel="Clear All Filters"
                onAction={() => {
                  setSearchQuery('');
                  setVehicleFilter('All');
                  setStatusFilter('All');
                }}
              />
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {filteredLocations.map((loc) => (
                  <ParkingCard
                    key={loc.id}
                    location={loc}
                    onOpenReviews={(selected) => setReviewModalLocation(selected)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS */}
      <section id="how-it-works" className="section-container py-16">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-[#087CA7] dark:text-sky-400">
            4 Simple Steps
          </span>
          <h2 className="mt-1 font-heading text-2xl font-bold text-[#073B5C] dark:text-white sm:text-3xl">
            How Kumari Parking Works
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Reserve your spot before you arrive at Kanyakumari Beach, Vivekananda Rock Ferry, or
            Nagercoil Town.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS_STEPS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card dark:border-sky-900/50 dark:bg-[#102A43]"
              >
                <span className="font-heading text-4xl font-extrabold text-[#087CA7]/15 dark:text-sky-400/15">
                  {item.step}
                </span>
                <div className="mt-2 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#073B5C] to-[#087CA7] text-white shadow-md">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-heading text-base font-bold text-[#102A43] dark:text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. WHY CHOOSE KUMARI PARKING */}
      <section className="bg-gradient-to-br from-[#073B5C] via-[#0A4E75] to-[#087CA7] py-16 text-white">
        <div className="section-container">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-300">
              Built for Kanyakumari District
            </span>
            <h2 className="mt-1 font-heading text-2xl font-bold sm:text-3xl">
              Why Choose Kumari Parking?
            </h2>
            <p className="mt-2 text-sm text-sky-100/85">
              Engineered for high-traffic sunrise tourist hours and everyday district commuting.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {WHY_CHOOSE_FEATURES.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="rounded-2xl border border-white/15 bg-white/10 p-6 backdrop-blur-md transition hover:bg-white/15"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F59E0B] text-white shadow-md">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-heading text-lg font-bold text-white">{feat.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-sky-100/85">
                    {feat.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. CUSTOMER REVIEWS */}
      <section id="reviews" className="section-container py-16">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-[#F59E0B]">
            Verified Driver Feedback
          </span>
          <h2 className="mt-1 font-heading text-2xl font-bold text-[#073B5C] dark:text-white sm:text-3xl">
            Trusted by Travelers &amp; Locals
          </h2>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {SAMPLE_TESTIMONIALS.map((rev) => (
            <article
              key={rev.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card dark:border-sky-900/50 dark:bg-[#102A43]"
            >
              <div>
                <div className="flex items-center gap-1 text-[#F59E0B]">
                  {Array.from({ length: rev.rating }).map((_, idx) => (
                    <Star key={idx} className="h-4 w-4 fill-[#F59E0B]" />
                  ))}
                </div>
                <h3 className="mt-3 font-heading text-base font-bold text-[#102A43] dark:text-white">
                  “{rev.title}”
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {rev.comment}
                </p>
              </div>

              <div className="mt-5 border-t border-slate-100 pt-4 dark:border-sky-900/50">
                <p className="text-sm font-bold text-[#073B5C] dark:text-white">{rev.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {rev.role} • {rev.location}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 8. FREQUENTLY ASKED QUESTIONS */}
      <section id="faq" className="bg-white/60 py-16 dark:bg-[#0E2439]/60">
        <div className="section-container max-w-4xl">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-[#087CA7] dark:text-sky-400">
              Help Center
            </span>
            <h2 className="mt-1 font-heading text-2xl font-bold text-[#073B5C] dark:text-white sm:text-3xl">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="mt-8 space-y-3">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div
                  key={item.question}
                  className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-sky-900/50 dark:bg-[#102A43]"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIdx(isOpen ? -1 : idx)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  >
                    <span className="font-heading text-sm font-semibold text-[#102A43] dark:text-white sm:text-base">
                      {item.question}
                    </span>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-[#087CA7] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''
                        }`}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="border-t border-slate-100 px-5 py-4 text-sm leading-relaxed text-slate-600 dark:border-sky-900/50 dark:text-slate-300">
                          {item.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 9. CONTACT SECTION */}
      <section id="contact" className="section-container py-16">
        <div className="grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <span className="text-xs font-bold uppercase tracking-widest text-[#F59E0B]">
              Get In Touch
            </span>
            <h2 className="mt-1 font-heading text-2xl font-bold text-[#073B5C] dark:text-white sm:text-3xl">
              Need Help or Want to List Your Parking Facility?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Reach out to our Kanyakumari District operations team for booking assistance, tourist
              bus inquiries, or admin-verified lot onboarding.
            </p>

            <div className="mt-6 space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#087CA7]/10 text-[#087CA7]">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-[#102A43] dark:text-white">District Office</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Villukuri, Kanyakumari District, Tamil Nadu 629702, India
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#087CA7]/10 text-[#087CA7]">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-[#102A43] dark:text-white">Email Support</p>
                  <a
                    href="mailto:antowilpet18@gmail.com"
                    className="block text-xs font-medium text-[#087CA7] hover:underline dark:text-sky-300"
                  >
                    antowilpet18@gmail.com
                  </a>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    support@kumariparking.in
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#087CA7]/10 text-[#087CA7]">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-[#102A43] dark:text-white">24/7 Helpline</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">+91 9500977950</p>
                </div>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit(onContactSubmit)}
            className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card dark:border-sky-900/50 dark:bg-[#102A43] lg:col-span-3"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-[#102A43] dark:text-slate-200">
                  Full Name
                </label>
                <input
                  type="text"
                  {...register('name', { required: 'Please enter your name' })}
                  placeholder="e.g. Rajesh Kumar"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#F4F8FB] px-3.5 py-2.5 text-sm focus:border-[#087CA7] focus:bg-white focus:outline-none dark:border-sky-900 dark:bg-[#0B1D2E] dark:text-white"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-[#DC2626]">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#102A43] dark:text-slate-200">
                  Email Address
                </label>
                <input
                  type="email"
                  {...register('email', { required: 'Please enter a valid email' })}
                  placeholder="you@example.com"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#F4F8FB] px-3.5 py-2.5 text-sm focus:border-[#087CA7] focus:bg-white focus:outline-none dark:border-sky-900 dark:bg-[#0B1D2E] dark:text-white"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-[#DC2626]">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-[#102A43] dark:text-slate-200">
                Message
              </label>
              <textarea
                rows={4}
                {...register('message', { required: 'Please enter your message' })}
                placeholder="How can we help you with parking in Kanyakumari?"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#F4F8FB] px-3.5 py-2.5 text-sm focus:border-[#087CA7] focus:bg-white focus:outline-none dark:border-sky-900 dark:bg-[#0B1D2E] dark:text-white"
              />
              {errors.message && (
                <p className="mt-1 text-xs text-[#DC2626]">{errors.message.message}</p>
              )}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary mt-5 w-full sm:w-auto">
              <Send className="h-4 w-4" />
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </section>

      {/* REVIEWS MODAL PREVIEW */}
      <AnimatePresence>
        {reviewModalLocation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => setReviewModalLocation(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#102A43]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-heading text-lg font-bold text-[#073B5C] dark:text-white">
                    {reviewModalLocation.name}
                  </h3>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-300">
                    <Star className="h-3.5 w-3.5 fill-[#F59E0B] text-[#F59E0B]" />
                    <strong>{Number(reviewModalLocation.average_rating || 0).toFixed(1)}</strong> (
                    {reviewModalLocation.total_reviews || 0} verified reviews)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setReviewModalLocation(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-sky-900/50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {SAMPLE_TESTIMONIALS.slice(0, 2).map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-100 bg-[#F4F8FB] p-3.5 dark:border-sky-900/50 dark:bg-[#0B1D2E]"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#102A43] dark:text-white">{item.name}</span>
                      <span className="text-slate-400">{item.date}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{item.comment}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-between rounded-xl bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  Verified booking required to submit new reviews (Phase 13).
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MainLayout>
  );
}
