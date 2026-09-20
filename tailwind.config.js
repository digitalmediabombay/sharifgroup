/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",
    "./**/*.html",
    "./assets/js/**/*.js",
    "./admin/**/*.js",
    "./admin/**/*.html",
    "./admin/**/*.php",
    "./blog/**/*.html",
    "./programs/**/*.html",
    "./*.sql",
    "./**/*.json"
  ],
  theme: {
    extend: {
      colors: {
        luxury: {
          gold: '#C5A880',
          goldhover: '#B3946B',
          dark: '#111111',
          light: '#FDFCFB',
          gray: '#8E8E93',
          border: '#E5E5EA',
          sectionOff: '#F5F2EB',
          sectionCopper: '#FAF6EE'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif']
      }
    }
  },
  plugins: []
};
