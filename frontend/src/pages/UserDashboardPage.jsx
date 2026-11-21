import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Ticket,
  Calendar,
  CreditCard,
  Star,
  User,
  LogOut,
  XCircle,
  Lock,
  CheckCircle2,
  MapPin,
  Navigation,
  Trash2,
} from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import TicketModal from '../components/TicketModal';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { formatINR } from '../utils/formatters';

export default function UserDashboardPage() {
  const { user, logout, updateUser } = useAuth();
  const [tab, setTab] = useState('bookings');
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTicket, setActiveTicket] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Review form state
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', description: '' });

  // Profile & password state
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
  });
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const [bRes, pRes, rRes] = await Promise.all([
        api.get('/bookings/my'),
        api.get('/payments/my'),
        api.get('/reviews/my'),
      ]);
      setBookings(bRes.data || []);
      setPayments(pRes.data || []);
      setReviews(rRes.data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleViewTicket = async (bookingId) => {
    try {
      const res = await api.get(`/tickets/${bookingId}`);
      setActiveTicket(res.data);
    } catch (err) {
      toast.error(err.message || 'Ticket not available yet');
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      await api.post(`/bookings/${bookingId}/cancel`);
      toast.success('Booking cancelled');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Cancellation failed');
    }
  };

  const handlePermanentDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/bookings/${deleteTarget.id}`);
      toast.success(`Booking ${deleteTarget.booking_reference} permanently deleted.`);
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Permanent delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/reviews', {
        booking_id: reviewTarget.id,
        rating: Number(reviewForm.rating),
        title: reviewForm.title,
        description: reviewForm.description,
      });
      toast.success('Review submitted! Thank you for your feedback.');
      setReviewTarget(null);
      setReviewForm({ rating: 5, title: '', description: '' });
      loadData();
    } catch (err) {
      toast.error(err.message || 'Could not submit review');
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put('/auth/me', profileForm);
      updateUser(res.data);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.message || 'Update failed');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/change-password', pwForm);
      toast.success('Password changed successfully');
      setPwForm({ current_password: '', new_password: '' });
    } catch (err) {
      toast.error(err.message || 'Password change failed');
    }
  };

  const tabs = [
    { id: 'bookings', label: 'My Bookings & Tickets', icon: Ticket },
    { id: 'payments', label: 'Payment History', icon: CreditCard },
    { id: 'reviews', label: 'My Reviews', icon: Star },
    { id: 'profile', label: 'Profile & Security', icon: User },
  ];

  return (
    <MainLayout>
      <section className="section-container py-10">
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-gradient-to-r from-[#073B5C] to-[#087CA7] p-6 text-white sm:flex-row sm:items-center">
          <div>
            <p className="text-xs uppercase tracking-wider text-amber-300">Driver Dashboard</p>
            <h1 className="mt-1 font-heading text-2xl font-bold">{user?.full_name}</h1>
            <p className="text-xs text-sky-100">
              {user?.email} • {user?.phone || 'Kanyakumari District'}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Link to="/explore" className="btn-sunrise !py-2.5">
              Book New Spot
            </Link>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/25"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-6 flex flex-wrap gap-2">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  tab === t.id
                    ? 'bg-[#073B5C] text-white shadow-md'
                    : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-[#102A43] dark:text-slate-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {loading ? (
            <div className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500 dark:bg-[#102A43]">
              Loading your dashboard...
            </div>
          ) : tab === 'bookings' ? (
            bookings.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No bookings yet"
                description="Explore verified parking spots across Kanyakumari District to reserve your first slot."
                actionLabel="Explore Parking"
                onAction={() => (window.location.href = '/#popular-parking')}
              />
            ) : (
              <div className="space-y-4">
                {bookings.map((b) => (
                  <div
                    key={b.id}
                    className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card dark:border-sky-900/50 dark:bg-[#102A43] md:flex-row md:items-center"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#087CA7]">
                          {b.booking_reference}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            b.status === 'Confirmed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : b.status === 'Pending Payment'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {b.status}
                        </span>
                      </div>
                      <h3 className="font-heading text-lg font-bold text-[#073B5C] dark:text-white">
                        {b.parking_name} — Slot {b.slot_number}
                      </h3>
                      {b.parking_address && (
                        <p className="flex items-start gap-1 text-xs text-slate-600 dark:text-slate-300">
                          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#087CA7]" />
                          <span>{b.parking_address}</span>
                        </p>
                      )}
                      <p className="text-xs text-slate-500 dark:text-slate-300">
                        {b.vehicle_number} ({b.vehicle_type}) • {b.booking_date} • {b.duration_hours}{' '}
                        hrs • <strong className="text-[#16A34A]">{formatINR(b.total_amount)}</strong>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {(b.navigation_url || b.google_maps_url) && (
                        <a
                          href={b.navigation_url || b.google_maps_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                        >
                          <Navigation className="h-3.5 w-3.5" />
                          Navigate
                        </a>
                      )}
                      {b.ticket && (
                        <button
                          type="button"
                          onClick={() => handleViewTicket(b.id)}
                          className="btn-primary !py-2 !px-3.5 !text-xs"
                        >
                          <Ticket className="h-3.5 w-3.5" />
                          View QR Ticket
                        </button>
                      )}
                      {(b.status === 'Confirmed' || b.status === 'Completed') && (
                        <button
                          type="button"
                          onClick={() => setReviewTarget(b)}
                          className="btn-outline !py-2 !px-3.5 !text-xs"
                        >
                          <Star className="h-3.5 w-3.5 text-[#F59E0B]" />
                          Write Review
                        </button>
                      )}
                      {(b.status === 'Pending Payment' || b.status === 'Confirmed') && (
                        <button
                          type="button"
                          onClick={() => handleCancelBooking(b.id)}
                          className="inline-flex items-center gap-1 rounded-xl border border-amber-300 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/20"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Cancel
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(b)}
                        className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-[#DC2626] hover:bg-[#DC2626] hover:text-white transition dark:border-red-900/60 dark:bg-red-950/40"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : tab === 'payments' ? (
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-card dark:border-sky-900/50 dark:bg-[#102A43]">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F4F8FB] text-xs uppercase text-slate-500 dark:bg-[#0B1D2E]">
                  <tr>
                    <th className="px-4 py-3">Order ID</th>
                    <th className="px-4 py-3">Payment ID</th>
                    <th className="px-4 py-3">Amount (INR)</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-sky-900/40">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                        No payment transactions yet.
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => (
                      <tr key={p.id}>
                        <td className="px-4 py-3 font-mono text-xs">{p.razorpay_order_id}</td>
                        <td className="px-4 py-3 font-mono text-xs">{p.razorpay_payment_id || '—'}</td>
                        <td className="px-4 py-3 font-bold text-[#16A34A]">{formatINR(p.amount)}</td>
                        <td className="px-4 py-3 uppercase text-xs font-semibold">{p.status}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {p.created_at ? new Date(p.created_at).toLocaleString('en-IN') : ''}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : tab === 'reviews' ? (
            reviews.length === 0 ? (
              <EmptyState
                icon={Star}
                title="No reviews submitted yet"
                description="Once you have a confirmed booking, click 'Write Review' under My Bookings to rate the parking facility."
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {reviews.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card dark:border-sky-900/50 dark:bg-[#102A43]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-heading font-bold text-[#073B5C] dark:text-white">
                        {r.parking_name}
                      </span>
                      <span className="font-bold text-[#F59E0B]">{'★'.repeat(r.rating)}</span>
                    </div>
                    <p className="mt-2 text-sm font-semibold">{r.title}</p>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{r.description}</p>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              <form
                onSubmit={handleProfileSave}
                className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-card dark:border-sky-900/50 dark:bg-[#102A43]"
              >
                <h2 className="font-heading text-lg font-bold">Edit Profile</h2>
                <div>
                  <label className="block text-xs font-semibold">Full Name</label>
                  <input
                    type="text"
                    value={profileForm.full_name}
                    onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-[#F4F8FB] px-3.5 py-2.5 text-sm dark:border-sky-900 dark:bg-[#0B1D2E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold">Mobile Number</label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-[#F4F8FB] px-3.5 py-2.5 text-sm dark:border-sky-900 dark:bg-[#0B1D2E]"
                  />
                </div>
                <button type="submit" className="btn-primary">
                  <CheckCircle2 className="h-4 w-4" />
                  Save Changes
                </button>
              </form>

              <form
                onSubmit={handlePasswordChange}
                className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-card dark:border-sky-900/50 dark:bg-[#102A43]"
              >
                <h2 className="font-heading text-lg font-bold">Change Password</h2>
                <div>
                  <label className="block text-xs font-semibold">Current Password</label>
                  <input
                    type="password"
                    required
                    value={pwForm.current_password}
                    onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-[#F4F8FB] px-3.5 py-2.5 text-sm dark:border-sky-900 dark:bg-[#0B1D2E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold">New Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={pwForm.new_password}
                    onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-[#F4F8FB] px-3.5 py-2.5 text-sm dark:border-sky-900 dark:bg-[#0B1D2E]"
                  />
                </div>
                <button type="submit" className="btn-sunrise">
                  <Lock className="h-4 w-4" />
                  Update Password
                </button>
              </form>
            </div>
          )}
        </div>
      </section>

      {/* Review Modal */}
      {reviewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleReviewSubmit}
            className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#102A43]"
          >
            <h3 className="font-heading text-lg font-bold text-[#073B5C] dark:text-white">
              Rate {reviewTarget.parking_name}
            </h3>
            <div>
              <label className="block text-xs font-semibold">Star Rating (1–5)</label>
              <select
                value={reviewForm.rating}
                onChange={(e) => setReviewForm({ ...reviewForm, rating: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-[#F4F8FB] px-3 py-2 text-sm dark:border-sky-900 dark:bg-[#0B1D2E]"
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n} Stars
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold">Review Title</label>
              <input
                type="text"
                required
                value={reviewForm.title}
                onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                placeholder="Clean and easy sunrise access"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-[#F4F8FB] px-3 py-2 text-sm dark:border-sky-900 dark:bg-[#0B1D2E]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold">Description</label>
              <textarea
                rows={3}
                required
                value={reviewForm.description}
                onChange={(e) => setReviewForm({ ...reviewForm, description: e.target.value })}
                placeholder="Share your experience..."
                className="mt-1 w-full rounded-xl border border-slate-200 bg-[#F4F8FB] px-3 py-2 text-sm dark:border-sky-900 dark:bg-[#0B1D2E]"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReviewTarget(null)}
                className="btn-outline !py-2"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary !py-2">
                Publish Review
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Permanent Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#102A43]"
          >
            <div className="flex items-center gap-3 text-[#DC2626]">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/30">
                <Trash2 className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-lg font-bold text-[#102A43] dark:text-white">
                Permanently Delete Ticket?
              </h3>
            </div>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              Are you sure you want to permanently delete booking{' '}
              <strong className="font-mono text-[#073B5C] dark:text-sky-300">
                {deleteTarget.booking_reference}
              </strong>{' '}
              ({deleteTarget.parking_name} — Slot {deleteTarget.slot_number})? This removes the
              ticket permanently and cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="btn-outline !py-2"
              >
                Keep Ticket
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handlePermanentDelete}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#DC2626] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                {deleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      <TicketModal ticket={activeTicket} onClose={() => setActiveTicket(null)} />
    </MainLayout>
  );
}
