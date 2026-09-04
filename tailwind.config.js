/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#17121D', // texto escuro
          soft: '#6F6878', // texto secundário
        },
        plum: {
          DEFAULT: '#1D0B2B', // roxo escuro principal
          800: '#241335',
          700: '#2C1A40',
        },
        paper: {
          DEFAULT: '#F8F6F2', // off-white
          white: '#FFFFFF',
          lavender: '#F3EEFA',
        },
        line: '#E5DFE9', // bordas claras
        brand: {
          pink: '#FF2BA6',
          violet: '#8B5CF6',
          blue: '#3B82F6',
        },
      },
      fontFamily: {
        display: ['"Raleway"', 'sans-serif'],
        sans: ['"Montserrat"', 'sans-serif'],
        serif: ['"Instrument Serif"', 'serif'],
      },
      backgroundImage: {
        'pulse-gradient': 'linear-gradient(90deg, #FF2BA6 0%, #8B5CF6 52%, #3B82F6 100%)',
      },
      maxWidth: {
        content: '1320px',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'pulse-line': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        blob: {
          '0%, 100%': { transform: 'translate(0,0) scale(1)' },
          '50%': { transform: 'translate(2%, -2%) scale(1.05)' },
        },
        'gradient-pan': {
          '0%, 100%': { backgroundPosition: '0% 0%' },
          '50%': { backgroundPosition: '100% 100%' },
        },
      },
      animation: {
        marquee: 'marquee 32s linear infinite',
        'pulse-line': 'pulse-line 6s ease-in-out infinite',
        blob: 'blob 14s ease-in-out infinite',
        'gradient-pan': 'gradient-pan 10s ease-in-out infinite',
      },
      boxShadow: {
        soft: '0 20px 60px -20px rgba(29, 11, 43, 0.18)',
        card: '0 1px 2px rgba(23, 18, 29, 0.04), 0 12px 32px -16px rgba(23, 18, 29, 0.12)',
      },
    },
  },
  plugins: [],
}
