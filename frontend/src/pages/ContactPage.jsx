import React from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { MapPin, Mail, Phone, Send, ShieldCheck } from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import ParkingAnimatedHeading from '../components/ParkingAnimatedHeading';
import api from '../services/api';

export default function ContactPage() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (data) => {
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
      <section className="relative overflow-hidden py-14 text-white">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/kanyakumari-bg.jpg?v=2')" }}
          aria-hidden="true"
        />
        <div className="section-container relative z-10 text-center [text-shadow:0_2px_10px_rgba(0,0,0,0.65)]">
          <span className="rounded-full bg-white/15 px-3.5 py-1 text-xs font-semibold text-amber-200 backdrop-blur-sm">
            District Support
          </span>
          <div className="mt-3">
            <ParkingAnimatedHeading
              prefix="Contact"
              highlight="Kumari Parking"
              align="center"
              size="page"
            />
          </div>
          <p className="mx-auto mt-2 max-w-xl text-sm text-sky-100/90">
            Reach our Kanyakumari District operations team for booking assistance or to register a
            verified parking facility.
          </p>
        </div>
      </section>

      <section className="section-container py-14">
        <div className="grid gap-8 lg:grid-cols-5">
          <div className="space-y-5 lg:col-span-2">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card dark:border-sky-900/50 dark:bg-[#102A43]">
              <h2 className="font-heading text-lg font-bold text-[#073B5C] dark:text-white">
                District Support Office
              </h2>
              <div className="mt-5 space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#087CA7]/10 text-[#087CA7]">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#102A43] dark:text-white">Address</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Villukuri, Kanyakumari District, Tamil Nadu 629702, India
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#087CA7]/10 text-[#087CA7]">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#102A43] dark:text-white">Email</p>
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

                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#087CA7]/10 text-[#087CA7]">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#102A43] dark:text-white">24/7 Helpline</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300">+91 9500977950</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  Only Admin-Verified Parking Facilities Listed
                </div>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card dark:border-sky-900/50 dark:bg-[#102A43] lg:col-span-3"
          >
            <h2 className="font-heading text-lg font-bold text-[#073B5C] dark:text-white">
              Send Us a Message
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold">Full Name</label>
                <input
                  type="text"
                  {...register('name', { required: 'Please enter your name' })}
                  placeholder="e.g. Rajesh Kumar"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#F4F8FB] px-3.5 py-2.5 text-sm dark:border-sky-900 dark:bg-[#0B1D2E]"
                />
                {errors.name && <p className="mt-1 text-xs text-[#DC2626]">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold">Email Address</label>
                <input
                  type="email"
                  {...register('email', { required: 'Please enter a valid email' })}
                  placeholder="you@example.com"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#F4F8FB] px-3.5 py-2.5 text-sm dark:border-sky-900 dark:bg-[#0B1D2E]"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-[#DC2626]">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-semibold">Message</label>
              <textarea
                rows={5}
                {...register('message', { required: 'Please enter your message' })}
                placeholder="How can we help you with parking in Kanyakumari?"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#F4F8FB] px-3.5 py-2.5 text-sm dark:border-sky-900 dark:bg-[#0B1D2E]"
              />
              {errors.message && (
                <p className="mt-1 text-xs text-[#DC2626]">{errors.message.message}</p>
              )}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary mt-5">
              <Send className="h-4 w-4" />
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </section>
    </MainLayout>
  );
}
