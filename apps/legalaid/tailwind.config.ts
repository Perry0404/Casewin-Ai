import type { Config } from 'tailwindcss'

// Court design tokens: navy "ink", brass accents on warm parchment. Status
// colours follow the registry's language: green = moving, amber = waiting on
// someone, red = stopped.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#F3F5F9',
          100: '#E3E8F1',
          200: '#C5CEDE',
          300: '#97A5BF',
          400: '#6A7C9C',
          500: '#4B5D7E',
          600: '#364665',
          700: '#26344F',
          800: '#18233A',
          900: '#0F1729',
          950: '#080D1A',
        },
        brass: {
          50: '#FBF7EC',
          100: '#F4EACB',
          200: '#E9D49A',
          300: '#DDBC69',
          400: '#D1A646',
          500: '#B8892E',
          600: '#956B24',
          700: '#714F1F',
        },
        parchment: '#F7F4ED',
        verdict: { 50: '#EAF6EF', 500: '#1C8A55', 600: '#14714A', 700: '#0F5A3A' },
        seal: { 50: '#FBEDEA', 500: '#B5432E', 600: '#963522' },
        amberline: { 50: '#FDF4E3', 500: '#C27C0E', 600: '#9C6209' },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15,23,41,0.04), 0 4px 16px -4px rgba(15,23,41,0.06)',
        lift: '0 2px 4px rgba(15,23,41,0.05), 0 16px 40px -12px rgba(15,23,41,0.18)',
      },
      keyframes: {
        rise: { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'none' } },
      },
      animation: { rise: 'rise .5s cubic-bezier(.2,.7,.2,1) both' },
    },
  },
  plugins: [],
}
export default config
