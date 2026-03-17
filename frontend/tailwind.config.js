/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/app/**/*.{js,jsx}", "./src/components/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Manrope", "sans-serif"]
      },
      colors: {
        ink: "#0f172a",
        ocean: "#0a6173",
        surf: "#b9f3ff",
        coral: "#ff6b57",
        sand: "#fff7e8"
      }
    }
  },
  plugins: []
};
