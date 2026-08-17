/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        eco: {
          bg: '#F5F5F0',
          card: '#FFFFFF',
          border: '#E5E8E0',
          forest: {
            DEFAULT: '#2D5A3F',
            dark: '#21432E',
            light: '#3C7352',
            soft: '#E3EBD8',
          },
          sage: {
            DEFAULT: '#C8E8CD',
            dark: '#1F402B',
            light: '#EBF7EE',
          },
          tan: {
            DEFAULT: '#8B6D4C',
            light: '#F4E8D3',
          },
          charcoal: '#1A2E22',
          muted: '#5C6B61',
        }
      }
    },
  },
  plugins: [],
}
