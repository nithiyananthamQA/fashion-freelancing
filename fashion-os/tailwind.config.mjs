/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}'],
  theme: {
    extend: {
      colors: {
        // v8 "Nebula Light" — soft lavender / charcoal / violet-indigo-cyan
        paper: '#F4F4FB',
        'paper-2': '#ECECF7',
        'paper-3': '#FFFFFF',
        surface: '#F4F4FB',
        ink: {
          DEFAULT: '#14132B',
          // legacy "-N" scale
          2: '#26253F',
          3: '#3B3A57',
          4: '#6E6C8A',
          5: '#8A88A4',
          6: '#9B99B4',
          7: '#C7C5D8',
          8: '#E4E3EF',
          // numeric scale used widely across the app — mapped onto the same ramp
          50: '#F1F0F7',
          100: '#E4E3EF',
          200: '#D2D1E2',
          300: '#C7C5D8',
          400: '#9B99B4',
          500: '#6E6C8A',
          600: '#52506E',
          700: '#3B3A57',
          800: '#26253F',
          900: '#14132B',
        },
        line: '#E0DFEC',
        // Primary accent kept under "champagne" name so old classes still resolve
        champagne: {
          DEFAULT: '#5468F5',
          2: '#4453E0',
          3: '#3A3AB0',
          50: '#EEEEFE',
          100: '#D9DCFB',
        },
        mint: {
          DEFAULT: '#2BA8E8',
          2: '#1E8FC9',
          3: '#176F9E',
          50: '#E6F5FC',
          100: '#C5E7F7',
        },
        // "gold" alias → primary accent, so legacy btn-gold / bg-gold-50 classes resolve
        gold: {
          DEFAULT: '#5468F5',
          deep: '#3A3AB0',
          50: '#EEEEFE',
          100: '#D9DCFB',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        // "serif"/"display" now point to Fraunces (editorial serif)
        serif: ['Fraunces', 'Georgia', 'serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace'],
      },
      letterSpacing: { tightish: '-0.012em', editorial: '-0.018em' },
      boxShadow: {
        card: '0 1px 2px rgba(20,19,43,.04), 0 1px 1px rgba(20,19,43,.03)',
        soft: '0 16px 38px -16px rgba(40,40,90,.24)',
        gold: '0 16px 38px -14px rgba(84,104,245,.42)',
        indigo: '0 16px 38px -14px rgba(84,104,245,.42)',
      },
      borderRadius: { '4xl': '2rem' },
    },
  },
  plugins: [],
};
