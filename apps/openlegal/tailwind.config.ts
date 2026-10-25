import type { Config } from 'tailwindcss'

// CaseWin justice design system — OpenLegal.
// Neutral ink on white, 1px rules, small radii, no shadows. Ink blue is the
// only accent (links, focus, the brand tab). Legal text is set in a serif;
// everything else in IBM Plex Sans. Token names are kept from the first version.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    borderRadius: { none: '0', sm: '2px', DEFAULT: '3px', md: '4px', lg: '4px', xl: '4px', '2xl': '6px', '3xl': '6px', full: '9999px' },
    extend: {
      colors: {
        paper: { DEFAULT: '#FFFFFF', 2: '#F6F6F5', 3: '#ECECEA' },
        ink: { DEFAULT: '#161615', 2: '#3A3A37', 3: '#6E6E69', 4: '#8F8F89', line: '#DCDCD9' },
        naija: { 50: '#EEF3FB', 100: '#D6E2F5', 400: '#3B6FD0', 500: '#1D4FAE', 600: '#173F8C', 700: '#12326F', 900: '#0B1F45' },
        highlight: '#FFF1B8',
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      boxShadow: { card: 'none', lift: 'none' },
      keyframes: { rise: { '0%': { opacity: '0' }, '100%': { opacity: '1' } } },
      animation: { rise: 'rise .2s ease-out both' },
    },
  },
  plugins: [],
}
export default config
