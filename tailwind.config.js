/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0b1120',
        card: '#1e293b',
        'card-hover': '#334155',
        primary: '#0ea5e9',
        secondary: '#14b8a6',
        text: '#f8fafc',
        muted: '#94a3b8',
        border: 'rgba(51, 65, 85, 0.5)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
