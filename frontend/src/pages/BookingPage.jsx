import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  MapPin,
  Car,
  Bike,
  Truck,
  Bus,
  Clock,
  ShieldCheck,
  IndianRupee,
  CheckCircle2,
  CreditCard,
  ArrowLeft,
} from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import TicketModal from '../components/TicketModal';
import PaymentDriveAnimation from '../components/PaymentDriveAnimation';
import Parking3DBayPreview from '../components/Parking3DBayPreview';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { formatINR } from '../utils/formatters';

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function getVehicleIcon(vehicleType) {
  if (vehicleType === 'Two Wheeler') return Bike;
  if (vehicleType === 'Truck') return Truck;
  if (vehicleType === 'Other') return Bus;
  return Car;
}

export default function BookingPage() {
  const { parkingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [location, setLocation] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    customer_name: user?.full_name || '',
    customer_email: user?.email || '',
    customer_phone: user?.phone || '',
    vehicle_number: '',
    vehicle_type: 'Four Wheeler',
    booking_date: today,
    entry_hour: '09:00',
    exit_hour: '12:00',
  });

  const [estimate, setEstimate] = useState(null);
  const [confirmedTicket, setConfirmedTicket] = useState(null);
  const [showPaymentAnim, setShowPaymentAnim] = useState(false);

  // Ensure logged-in user's email/name/phone are pre-filled as soon as auth loads
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        customer_name: prev.customer_name || user.full_name || '',
        customer_email: prev.customer_email || user.email || '',
        customer_phone: prev.customer_phone || user.phone || '',
      }));
    }
  }, [user]);

  useEffect(() => {
    async function fetchDetail() {
      setLoading(true);
      try {
        const res = await api.get(`/parking/${parkingId}`);
        setLocation(res.data);
        setSlots(res.data.slots || []);
      } catch (err) {
        toast.error(err.message || 'Unable to load parking location');
        navigate('/');
      } finally {
        setLoading(false);
      }
    }
    fetchDetail();
  }, [parkingId, navigate]);

  const entryIso = `${form.booking_date}T${form.entry_hour}:00+05:30`;
  const exitIso = `${form.booking_date}T${form.exit_hour}:00+05:30`;

  // Fetch real-time slot availability & backend dynamic INR estimate whenever time/vehicle changes
  useEffect(() => {
    if (!location) return;
    if (form.exit_hour <= form.entry_hour) {
      setEstimate(null);
      return;
    }

    async function refreshAvailabilityAndPrice() {
      try {
        const [availRes, estRes] = await Promise.all([
          api.get(`/parking/${parkingId}/availability`, {
            params: {
              entry_time: entryIso,
              exit_time: exitIso,
              vehicle_type: form.vehicle_type,
            },
          }),
          api.post('/bookings/estimate', {
            parking_location_id: parkingId,
            vehicle_type: form.vehicle_type,
            entry_time: entryIso,
            exit_time: exitIso,
          }),
        ]);
        const availSlots = availRes.data.slots || [];
        setSlots(availSlots);
        setEstimate(estRes.data);
        if (!availSlots.some((s) => s.id === selectedSlotId && s.is_available)) {
          const firstFree = availSlots.find((s) => s.is_available);
          setSelectedSlotId(firstFree ? firstFree.id : '');
        }
      } catch {
        setEstimate(null);
      }
    }

    refreshAvailabilityAndPrice();
  }, [location, parkingId, form.vehicle_type, form.booking_date, form.entry_hour, form.exit_hour]);

  const handleReserveAndPay = async (e) => {
    e.preventDefault();
    if (!selectedSlotId) return toast.error('Please select an available parking slot.');
    if (!form.vehicle_number.trim()) return toast.error('Please enter your vehicle registration number.');

    setSubmitting(true);
    setShowPaymentAnim(true);
    const animStart = Date.now();
    try {
      // Step 1 & 2: Create booking & lock slot on backend
      const bookingRes = await api.post('/bookings', {
        parking_location_id: parkingId,
        slot_id: selectedSlotId,
        customer_name: form.customer_name,
        customer_email: form.customer_email,
        customer_phone: form.customer_phone,
        vehicle_number: form.vehicle_number,
        vehicle_type: form.vehicle_type,
        booking_date: form.booking_date,
        entry_time: entryIso,
        exit_time: exitIso,
      });

      const booking = bookingRes.data;

      // Step 3: Create Razorpay INR order via backend
      const orderRes = await api.post('/payments/create-order', { booking_id: booking.id });
      const order = orderRes.data;

      // Keep drive animation visible for at least 2.1s so the vehicle smoothly glides left -> right
      const elapsed = Date.now() - animStart;
      if (elapsed < 2100) {
        await new Promise((r) => setTimeout(r, 2100 - elapsed));
      }

      if (order.mode === 'razorpay_live_or_test') {
        const loaded = await loadRazorpayScript();
        setShowPaymentAnim(false);
        if (!loaded) {
          toast.error('Failed to load Razorpay Checkout SDK.');
          setSubmitting(false);
          return;
        }

        const rzp = new window.Razorpay({
          key: order.key_id,
          amount: order.amount,
          currency: 'INR',
          name: 'Kumari Parking',
          description: `Slot Reservation • ${booking.booking_reference}`,
          order_id: order.order_id,
          prefill: {
            name: booking.customer_name,
            email: booking.customer_email,
            contact: booking.customer_phone,
          },
          theme: { color: '#073B5C' },
          handler: async (response) => {
            try {
              setShowPaymentAnim(true);
              await api.post('/payments/verify', {
                booking_id: booking.id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              const ticketRes = await api.get(`/tickets/${booking.id}`);
              await new Promise((r) => setTimeout(r, 1200));
              setShowPaymentAnim(false);
              toast.success('Payment verified! Your digital QR ticket is ready.');
              setConfirmedTicket(ticketRes.data);
            } catch (verifyErr) {
              setShowPaymentAnim(false);
              toast.error(verifyErr.message || 'Payment verification failed');
            }
          },
        });
        rzp.open();
      } else {
        // Local dev sandbox (cryptographically signed & verified on backend when Razorpay keys are not yet in .env)
        const signRes = await api.post('/payments/dev-sandbox-sign', {
          razorpay_order_id: order.order_id,
        });
        await api.post('/payments/verify', {
          booking_id: booking.id,
          razorpay_order_id: signRes.data.razorpay_order_id,
          razorpay_payment_id: signRes.data.razorpay_payment_id,
          razorpay_signature: signRes.data.razorpay_signature,
        });
        const ticketRes = await api.get(`/tickets/${booking.id}`);
        setShowPaymentAnim(false);
        toast.success('Payment Verified! Digital QR Ticket generated.');
        setConfirmedTicket(ticketRes.data);
      }
    } catch (err) {
      setShowPaymentAnim(false);
      toast.error(err.message || 'Booking failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !location) {
    return (
      <MainLayout>
        <div className="section-container py-20 text-center text-slate-500">
          Loading verified parking facility...
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Scenic Kanyakumari Background Image (no color shade) */}
      <div className="relative">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-cover bg-center"
          style={{ backgroundImage: "url('/kanyakumari-bg.jpg?v=2')" }}
          aria-hidden="true"
        />

      <section className="section-container relative z-10 py-10">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-4 py-1.5 text-sm font-semibold text-[#073B5C] shadow-sm backdrop-blur-sm hover:bg-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Parking Locations
        </button>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Booking Form */}
          <form
            onSubmit={handleReserveAndPay}
            className="space-y-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card dark:border-sky-900/50 dark:bg-[#102A43] lg:col-span-2"
          >
            <div className="border-b border-slate-100 pb-4 dark:border-sky-900/50">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#16A34A]">
                <ShieldCheck className="h-4 w-4" />
                Admin-Verified Facility • {location.parking_code}
              </div>
              <h1 className="mt-1 font-heading text-2xl font-bold text-[#073B5C] dark:text-white">
                {location.name}
              </h1>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-300">
                <MapPin className="h-3.5 w-3.5 text-[#087CA7]" />
                {location.address}
              </p>
            </div>

            {/* Customer & Vehicle Details */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold">Customer Full Name</label>
                <input
                  type="text"
                  required
                  value={form.customer_name}
                  onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#F4F8FB] px-3.5 py-2.5 text-sm dark:border-sky-900 dark:bg-[#0B1D2E]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold">Email Address</label>
                <input
                  type="email"
                  required
                  value={form.customer_email}
                  onChange={(e) => setForm({ ...form, customer_email: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#F4F8FB] px-3.5 py-2.5 text-sm dark:border-sky-900 dark:bg-[#0B1D2E]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold">Mobile Number</label>
                <input
                  type="tel"
                  required
                  value={form.customer_phone}
                  onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
                  placeholder="+91 98421 12345"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#F4F8FB] px-3.5 py-2.5 text-sm dark:border-sky-900 dark:bg-[#0B1D2E]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold">Vehicle Registration Number</label>
                <input
                  type="text"
                  required
                  value={form.vehicle_number}
                  onChange={(e) => setForm({ ...form, vehicle_number: e.target.value.toUpperCase() })}
                  placeholder="TN 74 AB 1234"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#F4F8FB] px-3.5 py-2.5 text-sm uppercase dark:border-sky-900 dark:bg-[#0B1D2E]"
                />
              </div>
            </div>

            {/* Vehicle Type & Schedule */}
            <div className="grid gap-4 sm:grid-cols-4">
              <div>
                <label className="block text-xs font-semibold">Vehicle Type</label>
                <select
                  value={form.vehicle_type}
                  onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#F4F8FB] px-3 py-2.5 text-sm dark:border-sky-900 dark:bg-[#0B1D2E]"
                >
                  {(location.vehicle_types || ['Two Wheeler', 'Four Wheeler', 'Truck']).map((vt) => (
                    <option key={vt} value={vt}>
                      {vt}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold">Parking Date</label>
                <input
                  type="date"
                  min={today}
                  value={form.booking_date}
                  onChange={(e) => setForm({ ...form, booking_date: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#F4F8FB] px-3 py-2.5 text-sm dark:border-sky-900 dark:bg-[#0B1D2E]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold">Entry Time</label>
                <input
                  type="time"
                  value={form.entry_hour}
                  onChange={(e) => setForm({ ...form, entry_hour: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#F4F8FB] px-3 py-2.5 text-sm dark:border-sky-900 dark:bg-[#0B1D2E]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold">Exit Time</label>
                <input
                  type="time"
                  value={form.exit_hour}
                  onChange={(e) => setForm({ ...form, exit_hour: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#F4F8FB] px-3 py-2.5 text-sm dark:border-sky-900 dark:bg-[#0B1D2E]"
                />
              </div>
            </div>

            {/* Compact 3D Parking Bay Animation (Car / Bike / Truck) */}
            <Parking3DBayPreview
              vehicleType={form.vehicle_type}
              slotNumber={
                slots.find((s) => s.id === selectedSlotId)?.slot_number ||
                slots[0]?.slot_number ||
                'A-01'
              }
            />

            {/* Interactive Slot Selector */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#073B5C] dark:text-sky-300">
                  Select Parking Slot ({form.vehicle_type})
                </label>
                <div className="flex items-center gap-3 text-[11px] font-semibold">
                  <span className="inline-flex items-center gap-1 text-[#073B5C] dark:text-sky-200">
                    <span className="h-2.5 w-2.5 rounded-full border-2 border-[#087CA7] bg-white" />
                    Available ({slots.filter((s) => s.is_available !== false).length})
                  </span>
                  <span className="inline-flex items-center gap-1 text-[#16A34A]">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#16A34A]" />
                    Selected
                  </span>
                  <span className="inline-flex items-center gap-1 text-red-500">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
                    Booked
                  </span>
                </div>
              </div>

              {slots.length === 0 ? (
                <p className="mt-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
                  No slots configured for {form.vehicle_type}. Try another vehicle type.
                </p>
              ) : (
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5">
                  {slots.map((slot) => {
                    const available = slot.is_available !== false && slot.status === 'Available';
                    const selected = selectedSlotId === slot.id;
                    const VehicleIcon = getVehicleIcon(form.vehicle_type || slot.vehicle_type);
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        disabled={!available}
                        onClick={() => setSelectedSlotId(slot.id)}
                        className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 px-3 py-3.5 text-sm font-bold transition-all duration-200 focus:outline-none ${
                          selected
                            ? 'border-[#15803D] bg-[#16A34A] text-white shadow-lg ring-4 ring-emerald-300/60 scale-[1.04] active:scale-95'
                            : available
                            ? 'border-[#087CA7]/40 bg-white text-[#073B5C] shadow-sm hover:-translate-y-0.5 hover:border-[#087CA7] hover:bg-[#087CA7] hover:text-white hover:shadow-lg active:scale-95 dark:border-sky-700 dark:bg-[#0B1D2E] dark:text-sky-100 dark:hover:bg-[#087CA7] dark:hover:text-white'
                            : 'cursor-not-allowed border-red-200 bg-red-50/70 text-red-400 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400/70'
                        }`}
                      >
                        <VehicleIcon
                          className={`mb-1.5 h-6 w-6 transition-transform duration-200 ${
                            selected
                              ? 'text-white scale-110'
                              : available
                              ? 'text-[#087CA7] group-hover:text-white group-hover:scale-110'
                              : 'text-red-300'
                          }`}
                        />
                        <span className="font-heading tracking-wide">{slot.slot_number}</span>
                        <span
                          className={`mt-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                            selected
                              ? 'bg-white/25 text-white'
                              : available
                              ? 'bg-sky-50 text-[#087CA7] group-hover:bg-white/20 group-hover:text-white dark:bg-sky-900/40 dark:text-sky-300'
                              : 'bg-red-100 text-red-500 dark:bg-red-900/40'
                          }`}
                        >
                          {selected ? 'Selected ✓' : available ? 'Free' : 'Booked'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || !estimate || !selectedSlotId}
              className="btn-sunrise w-full !py-3.5 text-base"
            >
              <CreditCard className="h-5 w-5" />
              {submitting
                ? 'Processing Secure Reservation...'
                : estimate
                ? `Proceed to Pay ${formatINR(estimate.total_amount)} via Razorpay`
                : 'Select Valid Entry & Exit Time'}
            </button>
          </form>

          {/* Dynamic INR Price Breakdown Sidebar */}
          <aside className="h-fit rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card dark:border-sky-900/50 dark:bg-[#102A43]">
            <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-[#073B5C] dark:text-white">
              <IndianRupee className="h-5 w-5 text-[#F59E0B]" />
              INR Price Breakdown
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
              Calculated &amp; verified dynamically on the Kumari Parking server.
            </p>

            {estimate ? (
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-300">Vehicle Type</span>
                  <span className="font-semibold">{form.vehicle_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-300">Hourly Rate</span>
                  <span className="font-semibold">{formatINR(estimate.hourly_rate)} / hr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-300">Duration</span>
                  <span className="font-semibold flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-[#087CA7]" />
                    {estimate.duration_hours} hrs
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-300">Parking Subtotal</span>
                  <span className="font-semibold">{formatINR(estimate.parking_subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-300">Facility Base Fee</span>
                  <span className="font-semibold">{formatINR(estimate.base_fee)}</span>
                </div>
                {estimate.surcharge_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-300">Weekend / Peak Surcharge</span>
                    <span className="font-semibold">{formatINR(estimate.surcharge_amount)}</span>
                  </div>
                )}

                <div className="border-t border-slate-200 pt-3 dark:border-sky-900">
                  <div className="flex items-center justify-between">
                    <span className="font-heading text-base font-bold">Total Payable (INR)</span>
                    <span className="font-heading text-2xl font-extrabold text-[#16A34A]">
                      {formatINR(estimate.total_amount)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-5 rounded-xl bg-slate-100 p-4 text-xs text-slate-500 dark:bg-[#0B1D2E]">
                Choose an exit time later than your entry time to view the live INR price breakdown.
              </p>
            )}
          </aside>
        </div>
      </section>
      </div>

      {showPaymentAnim && (
        <PaymentDriveAnimation
          vehicleType={form.vehicle_type}
          amount={estimate?.total_amount}
        />
      )}

      {confirmedTicket && (
        <TicketModal
          ticket={confirmedTicket}
          onClose={() => {
            setConfirmedTicket(null);
            navigate('/dashboard');
          }}
        />
      )}
    </MainLayout>
  );
}
