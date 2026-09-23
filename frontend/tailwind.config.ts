import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base: "var(--bg-base)",
          surface: "var(--bg-surface)",
          elevated: "var(--bg-elevated)",
        },
        border: "var(--border)",
        text: {
          primary: "var(--text-primary)",
          muted: "var(--text-muted)",
        },
        brand: {
          purple: "#6366F1",
          purpleDark: "#4F46E5",
          purpleLight: "#EEF2FF",
          blue: "#2563EB",
          slate: "#1F2937",
          pink: "#6366F1",
          pinkDark: "#4F46E5",
          pinkLight: "#EEF2FF",
          yellow: "#F59E0B",
          yellowBold: "#D97706",
          cyan: "#2563EB",
          cyanDark: "#1D4ED8",
        },
        accent: {
          success: "#10B981",
          warning: "#F59E0B",
          danger: "#EF4444",
          info: "#2563EB",
        }
      },
      fontFamily: {
        outfit: ["var(--font-outfit)", "Outfit", "sans-serif"],
        inter: ["var(--font-inter)", "Inter", "sans-serif"],
        gujarati: ["var(--font-gujarati)", "Noto Sans Gujarati", "sans-serif"],
        anton: ["var(--font-anton)", "Anton", "sans-serif"],
        bebas: ["var(--font-bebas)", "Bebas Neue", "sans-serif"],
        montserrat: ["var(--font-montserrat)", "Montserrat", "sans-serif"],
        poppins: ["var(--font-poppins)", "Poppins", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "14px",
        xl: "20px",
      },
      backgroundImage: {
        'brand-gradient': "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
        'brand-pink-grad': "linear-gradient(135deg, #6366F1 0%, #7C3AED 100%)",
        'brand-cyan-grad': "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
