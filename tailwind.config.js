/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'michigan-blue': '#00274c',
        'michigan-yellow': '#ffcb05',
      }
    },
  },
  plugins: [],
}