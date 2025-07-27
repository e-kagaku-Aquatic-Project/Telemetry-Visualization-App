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
        dark: {
          bg: '#0d1117',
          surface: '#161b22',
          accent: '#58a6ff',
          text: '#c9d1d9',
          muted: '#8b949e',
        },
        light: {
          bg: '#ffffff',
          surface: '#f6f8fa',
          accent: '#0969da',
          text: '#1f2328',
          muted: '#656d76',
        }
      },
      borderRadius: {
        'card': '12px',
        'inner': '6px',
      }
    },
  },
  plugins: [],
}