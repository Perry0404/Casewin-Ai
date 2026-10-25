import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './apps/web/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './apps/web/components/**/*.{js,ts,jsx,tsx,mdx}',
    './apps/web/app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1a472a',
        secondary: '#2d5016',
        accent: '#fbbf24',
        // CaseWin brand: night-green surfaces, emerald action, gold for the
        // justice / court thread shared with CaseWin Court.
        night: { 950: '#040A07', 900: '#07120D', 850: '#0A1812', 800: '#0E2018', 700: '#163024', 600: '#21402F' },
        mint: { 200: '#B8F2D6', 300: '#86E8BC', 400: '#4FD99B', 500: '#1EC07E', 600: '#119C64' },
        gold: { 200: '#F5E2AE', 300: '#ECCD7C', 400: '#E0B451' },
      },
      fontFamily: {
        display: ['var(--font-display)', 'var(--font-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
      },
      keyframes: {
        rise: { '0%': { opacity: '0', transform: 'translateY(10px)' }, '100%': { opacity: '1', transform: 'none' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
      },
      animation: {
        rise: 'rise .6s cubic-bezier(.2,.7,.2,1) both',
        float: 'float 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
export default config
