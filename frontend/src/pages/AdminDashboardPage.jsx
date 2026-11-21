import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  LayoutDashboard,
  MapPin,
  Users,
  CalendarCheck,
  CreditCard,
  Mail,
  Plus,
  Trash2,
  ShieldCheck,
  IndianRupee,
} from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import api from '../services/api';
import { formatINR } from '../utils/formatters';

export default function AdminDashboardPage() {
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [locations, setLocations] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);

  const [newLoc, setNewLoc] = useState({
    parking_code: '',
    name: '',
    address: '',
    district: 'Kanyakumari',
    latitude: '8.0883',
    longitude: '77.5385',
    total_slots: '20',
    price_per_hour: '30',
    opening_time: '05:00',
    closing_time: '22:00',
    description: '',
  });

  const loadAll = async () => {
    try {
      const [dRes, lRes, bRes, pRes, uRes, nRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/parking'),
        api.get('/admin/bookings'),
        api.get('/admin/payments'),
        api.get('/admin/users'),
        api.get('/admin/notifications'),
      ]);
      setStats(dRes.data);
      setLocations(lRes.data || []);
      setBookings(bRes.data || []);
      setPayments(pRes.data || []);
      setUsers(uRes.data || []);
      setNotifications(nRes.data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load admin data');
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleAddLocation = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/parking', {
        ...newLoc,
        latitude: parseFloat(newLoc.latitude),
        longitude: parseFloat(newLoc.longitude),
        total_slots: parseInt(newLoc.total_slots, 10),
        price_per_hour: parseFloat(newLoc.price_per_hour),
        vehicle_types: ['Two Wheeler', 'Four Wheeler', 'Truck'],
      });
      toast.success('Verified parking location added!');
      setShowAddForm(false);
      setNewLoc({
        parking_code: '',
        name: '',
        address: '',
        district: 'Kanyakumari',
        latitude: '8.0883',
        longitude: '77.5385',
        total_slots: '20',
        price_per_hour: '30',
        opening_time: '05:00',
        closing_time: '22:00',
        description: '',
      });
      loadAll();
    } catch (err) {
      toast.error(err.message || 'Failed to add location');
    }
  };

  const handleDeactivate = async (id) => {
    try {
      await api.delete(`/admin/parking/${id}`);
      toast.success('Parking location deactivated');
      loadAll();
    } catch (err) {
      toast.error(err.message || 'Action failed');
    }
  };

  const navTabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'parking', label: 'Parking Locations', icon: MapPin },
    { id: 'bookings', label: 'Bookings', icon: CalendarCheck },
    { id: 'payments', label: 'Payments (₹)', icon: CreditCard },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'emails', label: 'Email Logs', icon: Mail },
  ];

  return (
    <MainLayout>
      <section className="section-container py-10">
        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-[#073B5C] p-6 text-white sm:flex-row sm:items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-300">
              <ShieldCheck className="h-4 w-4" />
              Role-Protected Admin Console
            </span>
            <h1 className="mt-1 font-heading text-2xl font-bold">
              Kumari Parking — District Administration
            </h1>
          </div>
          <button
            type="button"
            onClick={() => {
              setTab('parking');
              setShowAddForm(true);
            }}
            className="btn-sunrise"
          >
            <Plus className="h-4 w-4" />
            Add Verified Parking Location
          </button>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex flex-wrap gap-2">
          {navTabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold sm:text-sm ${
                  tab === t.id
                    ? 'bg-[#087CA7] text-white shadow-md'
                    : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-[#102A43] dark:text-slate-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* OVERVIEW */}
        {tab === 'overview' && stats && (
          <div className="mt-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Total Revenue (INR)', val: formatINR(stats.total_revenue), accent: 'text-[#16A34A]' },
                { label: 'Confirmed Bookings', val: `${stats.confirmed_bookings} / ${stats.total_bookings}`, accent: 'text-[#087CA7]' },
                { label: 'Verified Locations', val: stats.total_locations, accent: 'text-[#073B5C] dark:text-white' },
                { label: 'Available Slots', val: `${stats.available_slots} / ${stats.total_slots}`, accent: 'text-[#F59E0B]' },
                { label: 'Registered Users', val: stats.total_users, accent: 'text-[#073B5C] dark:text-white' },
                { label: 'Pending Payments', val: stats.pending_payments, accent: 'text-amber-600' },
              ].map((card) => (
                <div
                  key={card.label}
                  className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card dark:border-sky-900/50 dark:bg-[#102A43]"
                >
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{card.label}</p>
                  <p className={`mt-2 font-heading text-2xl font-extrabold ${card.accent}`}>{card.val}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card dark:border-sky-900/50 dark:bg-[#102A43]">
              <h2 className="font-heading text-lg font-bold">Recent Bookings</h2>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-[#F4F8FB] uppercase text-slate-500 dark:bg-[#0B1D2E]">
                    <tr>
                      <th className="px-3 py-2.5">Ref</th>
                      <th className="px-3 py-2.5">Customer</th>
                      <th className="px-3 py-2.5">Vehicle</th>
                      <th className="px-3 py-2.5">Location</th>
                      <th className="px-3 py-2.5">Amount</th>
                      <th className="px-3 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-sky-900/40">
                    {(stats.recent_bookings || []).map((b) => (
                      <tr key={b.id}>
                        <td className="px-3 py-2.5 font-mono font-bold text-[#087CA7]">{b.booking_reference}</td>
                        <td className="px-3 py-2.5">{b.customer_name}</td>
                        <td className="px-3 py-2.5">{b.vehicle_number}</td>
                        <td className="px-3 py-2.5">{b.parking_name}</td>
                        <td className="px-3 py-2.5 font-bold text-[#16A34A]">{formatINR(b.total_amount)}</td>
                        <td className="px-3 py-2.5">{b.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* PARKING LOCATIONS */}
        {tab === 'parking' && (
          <div className="mt-6 space-y-5">
            {showAddForm && (
              <form
                onSubmit={handleAddLocation}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card dark:border-sky-900/50 dark:bg-[#102A43]"
              >
                <h2 className="font-heading text-lg font-bold">Add Verified Parking Facility</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <input
                    required
                    placeholder="Parking ID (e.g. KK-COL-005)"
                    value={newLoc.parking_code}
                    onChange={(e) => setNewLoc({ ...newLoc, parking_code: e.target.value })}
                    className="rounded-xl border border-slate-200 bg-[#F4F8FB] px-3 py-2 text-sm dark:border-sky-900 dark:bg-[#0B1D2E]"
                  />
                  <input
                    required
                    placeholder="Parking Facility Name"
                    value={newLoc.name}
                    onChange={(e) => setNewLoc({ ...newLoc, name: e.target.value })}
                    className="rounded-xl border border-slate-200 bg-[#F4F8FB] px-3 py-2 text-sm dark:border-sky-900 dark:bg-[#0B1D2E] sm:col-span-2"
                  />
                  <input
                    required
                    placeholder="Full Address in Kanyakumari District"
                    value={newLoc.address}
                    onChange={(e) => setNewLoc({ ...newLoc, address: e.target.value })}
                    className="rounded-xl border border-slate-200 bg-[#F4F8FB] px-3 py-2 text-sm dark:border-sky-900 dark:bg-[#0B1D2E] sm:col-span-3"
                  />
                  <input
                    required
                    type="number"
                    step="any"
                    placeholder="Latitude"
                    value={newLoc.latitude}
                    onChange={(e) => setNewLoc({ ...newLoc, latitude: e.target.value })}
                    className="rounded-xl border border-slate-200 bg-[#F4F8FB] px-3 py-2 text-sm dark:border-sky-900 dark:bg-[#0B1D2E]"
                  />
                  <input
                    required
                    type="number"
                    step="any"
                    placeholder="Longitude"
                    value={newLoc.longitude}
                    onChange={(e) => setNewLoc({ ...newLoc, longitude: e.target.value })}
                    className="rounded-xl border border-slate-200 bg-[#F4F8FB] px-3 py-2 text-sm dark:border-sky-900 dark:bg-[#0B1D2E]"
                  />
                  <input
                    required
                    type="number"
                    placeholder="Price / Hr (₹ INR)"
                    value={newLoc.price_per_hour}
                    onChange={(e) => setNewLoc({ ...newLoc, price_per_hour: e.target.value })}
                    className="rounded-xl border border-slate-200 bg-[#F4F8FB] px-3 py-2 text-sm dark:border-sky-900 dark:bg-[#0B1D2E]"
                  />
                  <input
                    required
                    type="number"
                    placeholder="Total Slots"
                    value={newLoc.total_slots}
                    onChange={(e) => setNewLoc({ ...newLoc, total_slots: e.target.value })}
                    className="rounded-xl border border-slate-200 bg-[#F4F8FB] px-3 py-2 text-sm dark:border-sky-900 dark:bg-[#0B1D2E]"
                  />
                  <input
                    placeholder="Opening Time (05:00)"
                    value={newLoc.opening_time}
                    onChange={(e) => setNewLoc({ ...newLoc, opening_time: e.target.value })}
                    className="rounded-xl border border-slate-200 bg-[#F4F8FB] px-3 py-2 text-sm dark:border-sky-900 dark:bg-[#0B1D2E]"
                  />
                  <input
                    placeholder="Closing Time (22:00)"
                    value={newLoc.closing_time}
                    onChange={(e) => setNewLoc({ ...newLoc, closing_time: e.target.value })}
                    className="rounded-xl border border-slate-200 bg-[#F4F8FB] px-3 py-2 text-sm dark:border-sky-900 dark:bg-[#0B1D2E]"
                  />
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button type="button" onClick={() => setShowAddForm(false)} className="btn-outline !py-2">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary !py-2">
                    Save Verified Location
                  </button>
                </div>
              </form>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              {locations.map((loc) => (
                <div
                  key={loc.id}
                  className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-card dark:border-sky-900/50 dark:bg-[#102A43]"
                >
                  <div>
                    <span className="font-mono text-xs font-bold text-[#087CA7]">{loc.parking_code}</span>
                    <h3 className="font-heading text-base font-bold">{loc.name}</h3>
                    <p className="text-xs text-slate-500">{loc.address}</p>
                    <p className="mt-2 text-xs font-semibold">
                      {formatINR(loc.price_per_hour)}/hr • {loc.total_slots} slots • Status:{' '}
                      <span className="text-[#16A34A]">{loc.status}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeactivate(loc.id)}
                    className="rounded-xl p-2 text-[#DC2626] hover:bg-red-50"
                    title="Deactivate Location"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BOOKINGS */}
        {tab === 'bookings' && (
          <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-card dark:border-sky-900/50 dark:bg-[#102A43]">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#F4F8FB] uppercase text-slate-500 dark:bg-[#0B1D2E]">
                <tr>
                  <th className="px-4 py-3">Booking Ref</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Vehicle</th>
                  <th className="px-4 py-3">Location / Slot</th>
                  <th className="px-4 py-3">Total (₹)</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-sky-900/40">
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td className="px-4 py-3 font-mono font-bold text-[#087CA7]">{b.booking_reference}</td>
                    <td className="px-4 py-3">
                      {b.customer_name}
                      <div className="text-[11px] text-slate-400">{b.customer_phone}</div>
                    </td>
                    <td className="px-4 py-3">{b.vehicle_number}</td>
                    <td className="px-4 py-3">
                      {b.parking_name} ({b.slot_number})
                    </td>
                    <td className="px-4 py-3 font-bold text-[#16A34A]">{formatINR(b.total_amount)}</td>
                    <td className="px-4 py-3">{b.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PAYMENTS */}
        {tab === 'payments' && (
          <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-card dark:border-sky-900/50 dark:bg-[#102A43]">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#F4F8FB] uppercase text-slate-500 dark:bg-[#0B1D2E]">
                <tr>
                  <th className="px-4 py-3">Razorpay Order</th>
                  <th className="px-4 py-3">Payment ID</th>
                  <th className="px-4 py-3">Amount (INR)</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-sky-900/40">
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-mono">{p.razorpay_order_id}</td>
                    <td className="px-4 py-3 font-mono">{p.razorpay_payment_id || '—'}</td>
                    <td className="px-4 py-3 font-bold text-[#16A34A] flex items-center gap-1">
                      <IndianRupee className="h-3.5 w-3.5" />
                      {formatINR(p.amount)}
                    </td>
                    <td className="px-4 py-3 uppercase font-semibold">{p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* USERS */}
        {tab === 'users' && (
          <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-card dark:border-sky-900/50 dark:bg-[#102A43]">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#F4F8FB] uppercase text-slate-500 dark:bg-[#0B1D2E]">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-sky-900/40">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-3 font-semibold">{u.full_name}</td>
                    <td className="px-4 py-3">{u.email}</td>
                    <td className="px-4 py-3">{u.phone || '—'}</td>
                    <td className="px-4 py-3 uppercase text-xs font-bold text-[#087CA7]">{u.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* EMAIL LOGS */}
        {tab === 'emails' && (
          <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-card dark:border-sky-900/50 dark:bg-[#102A43]">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#F4F8FB] uppercase text-slate-500 dark:bg-[#0B1D2E]">
                <tr>
                  <th className="px-4 py-3">Recipient</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-sky-900/40">
                {notifications.map((n) => (
                  <tr key={n.id}>
                    <td className="px-4 py-3">{n.recipient_email}</td>
                    <td className="px-4 py-3 font-mono">{n.notification_type}</td>
                    <td className="px-4 py-3">{n.subject}</td>
                    <td className="px-4 py-3 uppercase font-bold text-[#16A34A]">{n.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </MainLayout>
  );
}
