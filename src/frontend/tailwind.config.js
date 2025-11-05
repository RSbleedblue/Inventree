/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  // Important: Add important flag to ensure Tailwind classes work alongside Mantine
  // You can also use a prefix if needed, e.g., prefix: 'tw-'
  corePlugins: {
    // Disable preflight to avoid conflicts with Mantine's base styles
    // You can enable it if you want Tailwind's reset styles
    preflight: false,
  },
}

