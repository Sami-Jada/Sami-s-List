/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Sami's List brand (match mobile app)
        primaryText: '#44482E',
        heading: '#5F6541',
        brand: '#88915D',
        highlight: '#AAB183',
        card: '#CCD2AA',
        background: '#E6E9D1',
        destructive: '#8B3A3A',
      },
    },
  },
  plugins: [],
};
