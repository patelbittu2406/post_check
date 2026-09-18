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
          pink: "#E91E63",
          pinkDark: "#C2185B",
          pinkLight: "#F06292",
          yellow: "#FDD835",
          yellowBold: "#FFEB3B",
          cyan: "#00BCD4",
          cyanDark: "#0097A7",
        },
        accent: {
          success: "#10B981",
          warning: "#F59E0B",
          danger: "#EF4444",
          info: "#3B82F6",
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
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
      },
      backgroundImage: {
        'brand-gradient': "linear-gradient(135deg, #E91E63 0%, #FDD835 50%, #00BCD4 100%)",
        'brand-pink-grad': "linear-gradient(135deg, #E91E63 0%, #F06292 100%)",
        'brand-cyan-grad': "linear-gradient(135deg, #00BCD4 0%, #0097A7 100%)",
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
