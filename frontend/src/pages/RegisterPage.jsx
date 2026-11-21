import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import BrandLogo from '../components/BrandLogo';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { register: registerAccount } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const passwordVal = watch('password');

  const onSubmit = async (data) => {
    try {
      await registerAccount({
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        password: data.password,
      });
      toast.success('Welcome to Kumari Parking! Your account is ready.');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    }
  };

  return (
    <MainLayout>
      <section className="section-container flex min-h-[82vh] items-center justify-center py-12">
        <div className="w-full max-w-lg rounded-2xl border border-slate-200/80 bg-white p-7 shadow-card dark:border-sky-900/50 dark:bg-[#102A43] sm:p-8">
          <div className="flex flex-col items-center text-center">
            <BrandLogo showTamil={false} />
            <h1 className="mt-4 font-heading text-2xl font-bold text-[#073B5C] dark:text-white">
              Create Your Account
            </h1>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
              Reserve verified parking slots across Kanyakumari District in seconds.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-[#102A43] dark:text-slate-200">
                  Full Name
                </label>
                <input
                  type="text"
                  {...register('full_name', { required: 'Full name is required', minLength: 2 })}
                  placeholder="e.g. Karthik Natarajan"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#F4F8FB] px-3.5 py-2.5 text-sm focus:border-[#087CA7] focus:bg-white focus:outline-none dark:border-sky-900 dark:bg-[#0B1D2E] dark:text-white"
                />
                {errors.full_name && (
                  <p className="mt-1 text-xs text-[#DC2626]">{errors.full_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#102A43] dark:text-slate-200">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  {...register('phone', {
                    required: 'Mobile number is required',
                    minLength: { value: 10, message: 'Enter a valid 10-digit mobile number' },
                  })}
                  placeholder="+91 98421 12345"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#F4F8FB] px-3.5 py-2.5 text-sm focus:border-[#087CA7] focus:bg-white focus:outline-none dark:border-sky-900 dark:bg-[#0B1D2E] dark:text-white"
                />
                {errors.phone && (
                  <p className="mt-1 text-xs text-[#DC2626]">{errors.phone.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#102A43] dark:text-slate-200">
                Email Address
              </label>
              <input
                type="email"
                {...register('email', { required: 'Email address is required' })}
                placeholder="you@example.com"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#F4F8FB] px-3.5 py-2.5 text-sm focus:border-[#087CA7] focus:bg-white focus:outline-none dark:border-sky-900 dark:bg-[#0B1D2E] dark:text-white"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-[#DC2626]">{errors.email.message}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-[#102A43] dark:text-slate-200">
                  Password
                </label>
                <div className="relative mt-1.5">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password', {
                      required: 'Password is required',
                      minLength: { value: 6, message: 'At least 6 characters' },
                    })}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-200 bg-[#F4F8FB] px-3.5 py-2.5 pr-10 text-sm focus:border-[#087CA7] focus:bg-white focus:outline-none dark:border-sky-900 dark:bg-[#0B1D2E] dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-[#DC2626]">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#102A43] dark:text-slate-200">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('confirm_password', {
                    required: 'Please confirm password',
                    validate: (val) => val === passwordVal || 'Passwords do not match',
                  })}
                  placeholder="••••••••"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#F4F8FB] px-3.5 py-2.5 text-sm focus:border-[#087CA7] focus:bg-white focus:outline-none dark:border-sky-900 dark:bg-[#0B1D2E] dark:text-white"
                />
                {errors.confirm_password && (
                  <p className="mt-1 text-xs text-[#DC2626]">{errors.confirm_password.message}</p>
                )}
              </div>
            </div>

            <label className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                {...register('terms', { required: 'You must accept the terms & conditions' })}
                className="mt-0.5 rounded border-slate-300 text-[#087CA7]"
              />
              <span>
                I agree to Kumari Parking’s Terms of Service and Privacy Policy, and consent to
                receiving booking confirmation emails.
              </span>
            </label>
            {errors.terms && <p className="text-xs text-[#DC2626]">{errors.terms.message}</p>}

            <button type="submit" disabled={isSubmitting} className="btn-sunrise w-full">
              <UserPlus className="h-4 w-4" />
              {isSubmitting ? 'Creating account...' : 'Create Kumari Parking Account'}
            </button>

            <p className="text-center text-xs text-slate-600 dark:text-slate-300">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-[#087CA7] hover:underline dark:text-sky-300">
                Sign In
              </Link>
            </p>
          </form>
        </div>
      </section>
    </MainLayout>
  );
}
