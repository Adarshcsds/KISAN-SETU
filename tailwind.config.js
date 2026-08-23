/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          forest: '#1E5128',
          leaf: '#2E7D32',
          leafHover: '#256629',
          amber: '#E67E22',
        },
        surface: {
          canvas: '#F8F9FA',
          card: '#FFFFFF',
          border: '#E5E7EB',
          input: '#FFFFFF',
          hover: '#F3F4F6',
        },
        text: {
          primary: '#1F2937',
          secondary: '#4B5563',
          muted: '#9CA3AF',
        },
        status: {
          successBg: '#DCFCE7',
          successText: '#15803D',
          successBorder: '#86EFAC',
          warningBg: '#FEF3C7',
          warningText: '#B45309',
          warningBorder: '#FCD34D',
          dangerBg: '#FEE2E2',
          dangerText: '#B91C1C',
          dangerBorder: '#FCA5A5',
          infoBg: '#DBEAFE',
          infoText: '#1D4ED8',
          infoBorder: '#93C5FD',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Outfit', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        'btn': '0 2px 4px 0 rgba(46, 125, 50, 0.2)',
      }
    },
  },
  plugins: [],
}

