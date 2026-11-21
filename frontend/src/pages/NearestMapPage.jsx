import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  LocateFixed,
  Navigation,
  Map as MapIcon,
  List,
  MapPin,
  ExternalLink,
  Search,
} from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import ParkingAnimatedHeading from '../components/ParkingAnimatedHeading';
import api from '../services/api';
import { formatDistance, formatINR } from '../utils/formatters';

export default function NearestMapPage() {
  const [locations, setLocations] = useState([]);
  const [selectedLoc, setSelectedLoc] = useState(null);
  const [viewMode, setViewMode] = useState('map'); // 'map' | 'list'
  const [userCoords, setUserCoords] = useState(null);
  const [locating, setLocating] = useState(false);
  const [manualQuery, setManualQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLocations = async (coords = null) => {
    setLoading(true);
    try {
      const res = coords
        ? await api.get('/parking/nearest', { params: { lat: coords.lat, lng: coords.lng } })
        : await api.get('/parking');
      const data = res?.data || [];
      setLocations(data);
      if (data.length > 0) setSelectedLoc(data[0]);
    } catch {
      toast.error('Unable to load nearest parking locations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported by your browser. Search manually below.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserCoords(coords);
        setLocating(false);
        toast.success('GPS detected! Ranked nearest verified parking spots.');
        fetchLocations(coords);
      },
      () => {
        setLocating(false);
        toast.error('GPS permission denied. You can search manually below.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const filtered = locations.filter((loc) => {
    const q = manualQuery.trim().toLowerCase();
    if (!q) return true;
    return loc.name.toLowerCase().includes(q) || loc.address.toLowerCase().includes(q);
  });

  const activeMapLat = selectedLoc?.latitude || userCoords?.lat || 8.0883;
  const activeMapLng = selectedLoc?.longitude || userCoords?.lng || 77.5385;

  return (
    <MainLayout>
      {/* Header */}
      <section className="relative overflow-hidden py-12 text-white">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/kanyakumari-bg.jpg?v=2')" }}
          aria-hidden="true"
        />
        <div className="section-container relative z-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end [text-shadow:0_2px_10px_rgba(0,0,0,0.65)]">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1 text-xs font-semibold text-amber-200 backdrop-blur-sm">
              <Navigation className="h-3.5 w-3.5 text-[#F59E0B]" />
              Haversine Nearest Parking Finder
            </span>
            <div className="mt-2">
              <ParkingAnimatedHeading
                prefix="Nearest"
                highlight="Parking Map"
                align="left"
                size="page"
              />
            </div>
            <p className="mt-1 text-sm text-sky-100/90">
              {userCoords
                ? `GPS Active (${userCoords.lat.toFixed(4)}, ${userCoords.lng.toFixed(4)}) — showing closest admin-verified lots.`
                : 'Enable GPS to find the closest verified parking lot in Kanyakumari District.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleDetectGPS}
              disabled={locating}
              className="btn-sunrise"
            >
              <LocateFixed className={`h-4 w-4 ${locating ? 'animate-spin' : ''}`} />
              {locating ? 'Detecting GPS...' : 'Use My Current Location'}
            </button>

            <div className="inline-flex rounded-xl bg-white/15 p-1 backdrop-blur-md">
              <button
                type="button"
                onClick={() => setViewMode('map')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  viewMode === 'map' ? 'bg-white text-[#073B5C]' : 'text-white'
                }`}
              >
                <MapIcon className="h-3.5 w-3.5" />
                Map View
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  viewMode === 'list' ? 'bg-white text-[#073B5C]' : 'text-white'
                }`}
              >
                <List className="h-3.5 w-3.5" />
                List View
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="section-container py-10">
        {/* Manual fallback search */}
        <div className="mb-6 relative max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={manualQuery}
            onChange={(e) => setManualQuery(e.target.value)}
            placeholder="Manual search (e.g. Thuckalay, Beach, Nagercoil)..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm dark:border-sky-900 dark:bg-[#102A43]"
          />
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white p-12 text-center text-sm text-slate-500 dark:bg-[#102A43]">
            Calculating nearest verified parking facilities...
          </div>
        ) : viewMode === 'map' ? (
          <div className="grid gap-6 lg:grid-cols-5">
            {/* Interactive Google Map Embed */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card dark:border-sky-900/50 lg:col-span-3">
              <iframe
                title="Kumari Parking Nearest Map"
                width="100%"
                height="520"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                src={`https://maps.google.com/maps?q=${activeMapLat},${activeMapLng}&z=15&output=embed`}
              />
              {selectedLoc && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-white p-4 dark:border-sky-900/50 dark:bg-[#102A43]">
                  <div>
                    <p className="font-heading font-bold text-[#073B5C] dark:text-white">
                      {selectedLoc.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-300">
                      {selectedLoc.address}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${selectedLoc.latitude},${selectedLoc.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-outline !py-2 !px-3 !text-xs"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Navigate
                    </a>
                    <Link
                      to={`/booking/${selectedLoc.id}`}
                      className="btn-primary !py-2 !px-3.5 !text-xs"
                    >
                      Book Now
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Nearest Ranked Sidebar List */}
            <div className="space-y-3 lg:col-span-2 max-h-[600px] overflow-y-auto pr-1">
              {filtered.map((loc, idx) => {
                const isSelected = selectedLoc?.id === loc.id;
                return (
                  <div
                    key={loc.id}
                    onClick={() => setSelectedLoc(loc)}
                    className={`cursor-pointer rounded-2xl border p-4 transition ${
                      isSelected
                        ? 'border-[#087CA7] bg-sky-50/90 shadow-md dark:border-sky-400 dark:bg-[#163554]'
                        : 'border-slate-200/80 bg-white hover:border-[#087CA7]/50 dark:border-sky-900/50 dark:bg-[#102A43]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full bg-[#073B5C] px-2.5 py-0.5 text-[11px] font-bold text-white">
                        #{idx + 1}
                      </span>
                      {loc.distance_km !== undefined && (
                        <span className="text-xs font-bold text-[#087CA7] dark:text-sky-300">
                          {formatDistance(loc.distance_km)} away
                        </span>
                      )}
                    </div>
                    <h3 className="mt-2 font-heading text-sm font-bold text-[#102A43] dark:text-white">
                      {loc.name}
                    </h3>
                    <p className="mt-0.5 flex items-start gap-1 text-xs text-slate-500 dark:text-slate-300">
                      <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-[#087CA7]" />
                      {loc.address}
                    </p>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="font-bold text-[#16A34A]">
                        {loc.available_slots}/{loc.total_slots} slots free
                      </span>
                      <span className="font-heading font-bold text-[#073B5C] dark:text-amber-300">
                        {formatINR(loc.price_per_hour)}/hr
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-3">
            {filtered.map((loc, idx) => (
              <div
                key={loc.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card dark:border-sky-900/50 dark:bg-[#102A43]"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-[#073B5C] px-3 py-1 text-[11px] font-bold text-white">
                      #{idx + 1} Nearest
                    </span>
                    {loc.distance_km !== undefined && (
                      <span className="text-xs font-bold text-[#087CA7] dark:text-sky-300">
                        {formatDistance(loc.distance_km)} away
                      </span>
                    )}
                  </div>
                  <h3 className="mt-3 font-heading text-lg font-bold text-[#102A43] dark:text-white">
                    {loc.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{loc.address}</p>
                  <div className="mt-4 flex items-center justify-between rounded-xl bg-[#F4F8FB] p-3 text-xs dark:bg-[#0B1D2E]">
                    <span className="font-bold text-[#16A34A]">
                      {loc.available_slots}/{loc.total_slots} free
                    </span>
                    <span className="font-heading text-base font-bold text-[#073B5C] dark:text-amber-300">
                      {formatINR(loc.price_per_hour)}/hr
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${loc.latitude},${loc.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-outline flex-1 !py-2 !text-xs"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Navigate
                  </a>
                  <Link to={`/booking/${loc.id}`} className="btn-primary flex-1 !py-2 !text-xs">
                    Book Slot
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </MainLayout>
  );
}
