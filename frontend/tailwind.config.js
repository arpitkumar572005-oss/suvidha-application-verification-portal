/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Unified Primary Palette per Enterprise Government Standards
        navy: {
          DEFAULT: '#17365D',
          dark: '#0F243E',
          light: '#234B7D'
        },
        royal: {
          DEFAULT: '#2F6FED',
          hover: '#2558C4',
          light: '#EAF1FF',
          dark: '#1D4ED8',
          ring: '#93B4FF'
        },
        // Saffron smoothly mapped to Royal Blue for 100% theme consistency
        saffron: {
          DEFAULT: '#2F6FED',
          hover: '#2558C4',
          light: '#EAF1FF',
          dark: '#17365D'
        },
        surface: {
          bg: '#F4F7FB',
          card: '#FFFFFF',
          muted: '#F8FAFC',
          border: '#E2E8F0',
          hover: '#EAF1FF'
        },
        ink: {
          primary: '#1E293B',
          secondary: '#64748B',
          muted: '#94A3B8'
        },
        // Semantic Status Colors
        status: {
          success: '#15803D',
          'success-bg': '#DCFCE7',
          warning: '#B45309',
          'warning-bg': '#FEF3C7',
          error: '#DC2626',
          'error-bg': '#FEE2E2',
          info: '#2563EB',
          'info-bg': '#DBEAFE',
          neutral: '#64748B',
          'neutral-bg': '#F1F5F9'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif']
      },
      borderRadius: {
        DEFAULT: '6px',
        sm: '4px',
        md: '6px',
        lg: '8px'
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        elevated: '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)'
      }
    },
  },
  plugins: [],
}
