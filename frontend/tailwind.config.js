/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: "#080b11",
          card: "rgba(13, 20, 35, 0.65)",
          border: "rgba(255, 255, 255, 0.07)",
          neonBlue: "#00f0ff",
          neonGreen: "#39ff14",
          neonRed: "#ff007f",
          dark: "#040609",
          slate: "#1f293d",
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
