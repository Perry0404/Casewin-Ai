import type { Config } from 'tailwindcss'

// OpenLegal: an editorial, paper-and-ink reading experience. Nigerian green is
// the only accent, used for links, focus and the brand mark.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: { DEFAULT: '#FBFAF6', 2: '#F4F2EB', 3: '#EAE7DD' },
        ink: { DEFAULT: '#15171A', 2: '#3D4148', 3: '#6B7079', 4: '#9A9EA6', line: '#E3E1D9' },
        naija: { 50: '#E9F6EF', 100: '#CDEBDB', 400: '#1FA86A', 500: '#008751', 600: '#007043', 700: '#00593A', 900: '#073824' },
        highlight: '#FFEFA8',
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(21,23,26,0.04), 0 2px 12px -4px rgba(21,23,26,0.06)',
        lift: '0 2px 6px rgba(21,23,26,0.05), 0 24px 48px -16px rgba(21,23,26,0.18)',
      },
      keyframes: { rise: { '0%': { opacity: '0', transform: 'translateY(6px)' }, '100%': { opacity: '1', transform: 'none' } } },
      animation: { rise: 'rise .5s cubic-bezier(.2,.7,.2,1) both' },
    },
  },
  plugins: [],
}
export default config
