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
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        chat: {
          bg: {
            light: '#f8fafc', // slate 50
            dark: '#0b0f19',  // deep custom obsidian slate
            darker: '#05070c' // deep true black
          },
          panel: {
            light: '#ffffff',
            dark: '#111827',  // gray 900
            darker: '#0e1320'
          },
          bubble: {
            selfLight: '#8b5cf6', // brand violet
            selfDark: '#4f46e5',  // indigo
            otherLight: '#f1f5f9', // slate 100
            otherDark: '#1f2937'   // gray 800
          },
          border: {
            light: '#e2e8f0',
            dark: '#1f2937'
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        'glass-light': '0 8px 32px 0 rgba(31, 38, 135, 0.08)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
};
