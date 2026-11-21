import React, { useEffect, useMemo, useState } from 'react';
import { Search, Star, X, CheckCircle2, Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '../layouts/MainLayout';
import ParkingAnimatedHeading from '../components/ParkingAnimatedHeading';
import ParkingCard from '../components/ParkingCard';
import ParkingCardSkeleton from '../components/ParkingCardSkeleton';
import EmptyState from '../components/EmptyState';
import api from '../services/api';
import {
  KANYAKUMARI_LANDMARKS,
  PREVIEW_PARKING_LOCATIONS,
  SAMPLE_TESTIMONIALS,
} from '../data/demoPreviewData';

export default function ExploreParkingPage() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [reviewModalLocation, setReviewModalLocation] = useState(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get('/parking');
        if (active && res?.success && Array.isArray(res.data)) {
          setLocations(res.data);
        } else if (active) {
          setLocations(PREVIEW_PARKING_LOCATIONS);
        }
      } catch {
        if (active) setLocations(PREVIEW_PARKING_LOCATIONS);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const filteredLocations = useMemo(() => {
    return locations
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
  }, [locations, searchQuery, vehicleFilter, statusFilter]);

  return (
    <MainLayout>
      {/* Page Banner */}
      <section className="relative overflow-hidden py-14 text-white">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/kanyakumari-bg.jpg?v=2')" }}
          aria-hidden="true"
        />
        <div className="section-container relative z-10 [text-shadow:0_2px_10px_rgba(0,0,0,0.65)]">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1 text-xs font-semibold text-amber-200 backdrop-blur-sm">
            <Compass className="h-3.5 w-3.5 text-[#F59E0B]" />
            Ranked by Highest Rating • Kanyakumari District
          </span>
          <div className="mt-3">
            <ParkingAnimatedHeading
              prefix="Explore Verified"
              highlight="Parking Locations"
              align="left"
              size="page"
            />
          </div>
          <p className="mt-2 max-w-2xl text-sm text-sky-100/90">
            Browse admin-verified parking hubs across Kanyakumari Beach, Vivekananda Ferry
            Terminal, Padmanabhapuram Palace, Thuckalay, Nagercoil, and Suchindram.
          </p>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="section-container -mt-7 relative z-20">
        <div className="glass-card rounded-2xl p-5">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by town, temple, beach, or parking name..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-[#102A43] focus:border-[#087CA7] focus:outline-none dark:border-sky-900 dark:bg-[#0B1D2E] dark:text-white"
              />
            </div>

            <select
              value={vehicleFilter}
              onChange={(e) => setVehicleFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-[#102A43] dark:border-sky-900 dark:bg-[#0B1D2E] dark:text-white"
            >
              <option value="All">All Vehicles</option>
              <option value="Two Wheeler">Two Wheeler</option>
              <option value="Four Wheeler">Four Wheeler</option>
              <option value="Truck">Truck</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-[#102A43] dark:border-sky-900 dark:bg-[#0B1D2E] dark:text-white"
            >
              <option value="All">All Statuses</option>
              <option value="Available">Available Now</option>
              <option value="Full">Full</option>
            </select>
          </div>

          <div className="mt-3.5 flex flex-wrap items-center gap-2">
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
      </section>

      {/* Parking Grid */}
      <section className="section-container py-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-heading text-xl font-bold text-[#073B5C] dark:text-white">
            Popular Parking Locations ({filteredLocations.length})
          </h2>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-300">
            Sorted by highest rating ★
          </span>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <ParkingCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredLocations.length === 0 ? (
          <EmptyState
            title="No matching parking locations"
            description="Try clearing your search or selecting another Kanyakumari District landmark."
            actionLabel="Show All Locations"
            onAction={() => {
              setSearchQuery('');
              setVehicleFilter('All');
              setStatusFilter('All');
            }}
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredLocations.map((loc) => (
              <ParkingCard
                key={loc.id}
                location={loc}
                onOpenReviews={(selected) => setReviewModalLocation(selected)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Reviews Modal */}
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
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
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
              <div className="mt-5 flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Submit your own review from My Bookings after confirming a slot.
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MainLayout>
  );
}
