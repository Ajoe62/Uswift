/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Modern, professional color palette
        "uswift-primary": "#3B82F6", // Blue-500 - Main brand color
        "uswift-secondary": "#8B5CF6", // Violet-500 - Secondary actions
        "uswift-accent": "#06B6D4", // Cyan-500 - Highlights & CTAs
        "uswift-dark": "#1E293B", // Slate-800 - Dark sections
        "uswift-navy": "#0F172A", // Slate-900 - Darkest backgrounds

        // Legacy support (will be phased out)
        uswiftBlue: "#3B82F6",
        uswiftNavy: "#0F172A",
        uswiftPurple: "#8B5CF6",
      },
      backgroundImage: {
        // Note: Gradients kept for dark mode and special sections
        // Light mode uses flat colors for clarity
        "uswift-gradient":
          "linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #06B6D4 100%)",
        "uswift-gradient-dark":
          "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
      },
      boxShadow: {
        // Custom shadow for cards matching Upwork style
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
      },
    },
  },
  plugins: [],
};
