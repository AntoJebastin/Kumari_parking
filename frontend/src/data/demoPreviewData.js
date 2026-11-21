/**
 * PHASE 2 UI PREVIEW DATA ONLY.
 *
 * Per architecture rules, production parking locations and reviews live exclusively in
 * Supabase PostgreSQL and are managed by the Admin Dashboard (Phases 4 & 6).
 * This file provides clearly marked development preview items solely so the Phase 2 UI
 * can be visually inspected before the database is seeded in Phase 4.
 */

export const KANYAKUMARI_LANDMARKS = [
  'Vivekananda Ferry Terminal',
  'Kanyakumari Beach',
  'Padmanabhapuram Palace',
  'Thuckalay',
  'Kumaracoil',
  'Nagercoil Vadasery',
  'Suchindram Temple',
];

export const PREVIEW_PARKING_LOCATIONS = [
  {
    id: 'preview-kk-01',
    parking_code: 'KK-VRM-001',
    name: 'Vivekananda Ferry Terminal Smart Plaza',
    address: 'Beach Road, Near Poompuhar Boat Jetty, Kanyakumari - 629702',
    district: 'Kanyakumari',
    latitude: 8.0816,
    longitude: 77.5517,
    google_maps_url: 'https://maps.google.com/?q=8.0816,77.5517',
    image_url:
      'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=900&q=80',
    vehicle_types: ['Two Wheeler', 'Four Wheeler', 'Truck'],
    total_slots: 60,
    available_slots: 24,
    price_per_hour: 40,
    status: 'Available',
    average_rating: 4.8,
    total_reviews: 128,
    opening_time: '05:00',
    closing_time: '22:00',
    is_preview: true,
  },
  {
    id: 'preview-kk-02',
    parking_code: 'KK-SUN-002',
    name: 'Sunrise Point & Triveni Sangam Parking Hub',
    address: 'Sannathi Street, Near Bhagavathy Amman Temple, Kanyakumari - 629702',
    district: 'Kanyakumari',
    latitude: 8.0785,
    longitude: 77.5504,
    google_maps_url: 'https://maps.google.com/?q=8.0785,77.5504',
    image_url:
      'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=900&q=80',
    vehicle_types: ['Two Wheeler', 'Four Wheeler', 'Truck'],
    total_slots: 45,
    available_slots: 12,
    price_per_hour: 35,
    status: 'Available',
    average_rating: 4.7,
    total_reviews: 94,
    opening_time: '04:30',
    closing_time: '23:00',
    is_preview: true,
  },
  {
    id: 'preview-kk-03',
    parking_code: 'KK-NGL-003',
    name: 'Nagercoil Vadasery Central Park & Ride',
    address: 'MS Road, Opposite Vadasery Bus Stand, Nagercoil - 629001',
    district: 'Kanyakumari',
    latitude: 8.1833,
    longitude: 77.4119,
    google_maps_url: 'https://maps.google.com/?q=8.1833,77.4119',
    image_url:
      'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=900&q=80',
    vehicle_types: ['Two Wheeler', 'Four Wheeler'],
    total_slots: 80,
    available_slots: 37,
    price_per_hour: 25,
    status: 'Available',
    average_rating: 4.6,
    total_reviews: 76,
    opening_time: '06:00',
    closing_time: '22:30',
    is_preview: true,
  },
  {
    id: 'preview-kk-04',
    parking_code: 'KK-SUC-004',
    name: 'Suchindram Thanumalayan Heritage Parking',
    address: 'Car Street, Near Suchindram Temple Gopuram, Suchindram - 629704',
    district: 'Kanyakumari',
    latitude: 8.1558,
    longitude: 77.4648,
    google_maps_url: 'https://maps.google.com/?q=8.1558,77.4648',
    image_url:
      'https://images.unsplash.com/photo-1470224114660-3f6686c562eb?auto=format&fit=crop&w=900&q=80',
    vehicle_types: ['Two Wheeler', 'Four Wheeler', 'Truck'],
    total_slots: 35,
    available_slots: 0,
    price_per_hour: 30,
    status: 'Full',
    average_rating: 4.9,
    total_reviews: 52,
    opening_time: '05:30',
    closing_time: '21:30',
    is_preview: true,
  },
];

export const SAMPLE_TESTIMONIALS = [
  {
    id: 'rev-1',
    name: 'Karthikeyan S.',
    role: 'Tourist from Madurai',
    location: 'Vivekananda Ferry Terminal Smart Plaza',
    rating: 5,
    title: 'Zero stress during sunrise rush!',
    comment:
      'Booked our SUV slot at 5:15 AM before reaching Kanyakumari Beach. The QR code ticket scanned in 2 seconds at the gate and pricing in ₹ was completely transparent.',
    date: 'Nov 2026',
  },
  {
    id: 'rev-2',
    name: 'Meenakshi Sundaram',
    role: 'Daily Commuter, Nagercoil',
    location: 'Nagercoil Vadasery Central Park & Ride',
    rating: 5,
    title: 'Safe, verified, and super clean',
    comment:
      'Finding verified two-wheeler parking near Vadasery used to take 15 minutes. Now I reserve my slot in advance and get my digital ticket on email instantly.',
    date: 'Nov 2026',
  },
  {
    id: 'rev-3',
    name: 'Arun Prakash',
    role: 'Family Traveler from Chennai',
    location: 'Sunrise Point & Triveni Sangam Parking Hub',
    rating: 5,
    title: 'Smooth Razorpay UPI checkout',
    comment:
      'The GPS nearest-parking finder guided us straight to an available lot 250 meters from the temple. Paid ₹90 via UPI and downloaded the PDF boarding pass.',
    date: 'Oct 2026',
  },
];

export const FAQ_ITEMS = [
  {
    question: 'Are all parking locations on Kumari Parking verified?',
    answer:
      'Yes. Every parking facility listed on Kumari Parking is manually added and verified by our district admin team. We never display unverified third-party map pins.',
  },
  {
    question: 'How is the parking fee calculated?',
    answer:
      'Pricing is transparently calculated in Indian Rupees (₹) based on the selected parking location, vehicle type (Two Wheeler, Four Wheeler, Truck), duration, and any applicable facility rules. The exact breakdown is shown before you pay.',
  },
  {
    question: 'How do I enter the parking lot after booking?',
    answer:
      'Once your Razorpay payment is verified, you receive an animated digital parking ticket with a unique QR code (also emailed to you and available in My Bookings). Simply show the QR code to the parking attendant to scan.',
  },
  {
    question: 'What if I deny GPS location permission?',
    answer:
      'No problem at all. You can manually search by any town, beach, temple, or landmark across Kanyakumari District (such as Nagercoil, Kanyakumari Beach, Suchindram, or Marthandam) to browse verified parking locations.',
  },
  {
    question: 'What happens if my payment fails or is interrupted?',
    answer:
      'Unpaid temporary slot holds are automatically released after the expiry window so slots stay fair for everyone. A booking is only confirmed after our backend cryptographically verifies your Razorpay payment.',
  },
];
