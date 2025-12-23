/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin');
module.exports = {
  darkMode: 'class', // ✅ enables dark mode via "class"
  content: [
    "./src/**/*.{js,ts,jsx,tsx}", // adjust if your components live elsewhere
    "./components/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    plugin(function ({ addUtilities }) {
      const newUtilities = {
        '.no-scrollbar': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
        },
        '.no-scrollbar::-webkit-scrollbar': {
          display: 'none'
        },
        '.custom-scrollbar': {
          'scrollbar-width': 'thin',
          'scrollbar-color': '#E5E7EB transparent' // thumb track for Firefox
        },
        '.custom-scrollbar::-webkit-scrollbar': {
          width: '6px',
          height: '6px'
        },
        '.custom-scrollbar::-webkit-scrollbar-track': {
          'border-radius': '9999px'
        },
        '.custom-scrollbar::-webkit-scrollbar-thumb': {
          'background-color': '#E5E7EB',
          'border-radius': '9999px'
        },
        /* dark mode thumb via a nested selector (relies on .dark on <html> or <body>) */
        '.dark .custom-scrollbar::-webkit-scrollbar-thumb': {
          'background-color': '#344054'
        },
      };
      addUtilities(newUtilities, ['responsive']);
    })
  ],
};
