import type { Config } from 'tailwindcss'

// CaseWin justice design system — Legal Aid.
// Neutral ink on white paper, 1px rules, small radii, no shadows. One functional
// accent per product (Legal Aid: signal red, for urgency). Token names are kept from the first
// version so every page picks the system up: `ink` is the neutral scale,
// `brass` is the product accent, `parchment` the quiet background.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    borderRadius: { none: '0', sm: '2px', DEFAULT: '3px', md: '4px', lg: '4px', xl: '4px', '2xl': '6px', '3xl': '6px', full: '9999px' },
    extend: {
      colors: {
        ink: {
          50: '#F6F6F5',
          100: '#ECECEA',
          200: '#DCDCD9',
          300: '#BDBDB8',
          400: '#8F8F89',
          500: '#6E6E69',
          600: '#52524E',
          700: '#3A3A37',
          800: '#262624',
          900: '#161615',
          950: '#0C0C0B',
        },
        brass: {
          50: '#FEF3F2',
          100: '#FEE4E2',
          200: '#FECDCA',
          300: '#F97066',
          400: '#D92D20',
          500: '#B42318',
          600: '#912018',
          700: '#7A271A',
        },
        parchment: '#F6F6F5',
        verdict: { 50: '#ECF6EF', 500: '#1E7B4B', 600: '#17663D', 700: '#11502F' },
        seal: { 50: '#FCEEEC', 500: '#B42318', 600: '#912018' },
        amberline: { 50: '#FDF5E6', 500: '#B54708', 600: '#93370D' },
      },
      fontFamily: {
        display: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: 'none',
        lift: 'none',
      },
      keyframes: {
        rise: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
      },
      animation: { rise: 'rise .2s ease-out both' },
    },
  },
  plugins: [],
}
export default config
