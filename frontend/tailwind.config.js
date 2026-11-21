/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ocean: {
          deep: '#073B5C',
          sea: '#087CA7',
          light: '#E0F2FE',
        },
        sunrise: {
          DEFAULT: '#F59E0B',
          hover: '#D97706',
          soft: '#FEF3C7',
        },
        navy: {
          dark: '#102A43',
          surface: '#163554',
          muted: '#243B53',
        },
        surface: {
          light: '#F4F8FB',
        },
        status: {
          success: '#16A34A',
          error: '#DC2626',
        },
      },
      fontFamily: {
        heading: ['Poppins', 'Noto Sans Tamil', 'sans-serif'],
        sans: ['Inter', 'Noto Sans Tamil', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(7, 59, 92, 0.12)',
        card: '0 10px 30px -10px rgba(7, 59, 92, 0.14)',
        'card-hover': '0 20px 40px -12px rgba(8, 124, 167, 0.22)',
      },
      backgroundImage: {
        'kumari-hero':
          'linear-gradient(135deg, #073B5C 0%, #087CA7 55%, #0E9AC4 78%, #F59E0B 135%)',
        'kumari-sunrise':
          'linear-gradient(120deg, #F59E0B 0%, #FB923C 50%, #F97316 100%)',
        'kumari-ocean':
          'linear-gradient(135deg, #073B5C 0%, #087CA7 100%)',
      },
    },
  },
  plugins: [],
};
