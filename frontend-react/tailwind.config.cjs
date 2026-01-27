/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Enable dark mode with class strategy
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Scan all React files for Tailwind classes
  ],
  theme: {
    extend: {
      colors: {
        // Medical Teal theme from your login page
        primary: "#0d9488",
        "primary-hover": "#0f766e",
        "background-light": "#f3f4f6",
        "background-dark": "#111827",
        "card-light": "#ffffff",
        "card-dark": "#1f2937",
        "text-main-light": "#111827",
        "text-main-dark": "#f9fafb",
        "text-sub-light": "#6b7280",
        "text-sub-dark": "#9ca3af",
        "border-light": "#e5e7eb",
        "border-dark": "#374151",
        "input-bg-light": "#ffffff",
        "input-bg-dark": "#374151",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
