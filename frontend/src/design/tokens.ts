export const tokens = {
  colors: {
    brand: {
      pink: "#E91E63",
      pinkDark: "#C2185B",
      pinkLight: "#F06292",
      yellow: "#FDD835",
      yellowBold: "#FFEB3B",
      cyan: "#00BCD4",
      cyanDark: "#0097A7",
      gradient: "linear-gradient(135deg, #E91E63 0%, #FDD835 50%, #00BCD4 100%)",
      gradientAlt: "linear-gradient(135deg, #E91E63 0%, #F06292 100%)",
      gradientCyanPink: "linear-gradient(135deg, #00BCD4 0%, #E91E63 100%)",
    },
    functional: {
      success: "#10B981",
      warning: "#F59E0B",
      danger: "#EF4444",
      info: "#3B82F6",
    },
    dark: {
      bgBase: "#0A0A0F",
      bgSurface: "#12121A",
      bgElevated: "#1A1A24",
      border: "#26262F",
      textPrimary: "#F5F5F7",
      textMuted: "#8A8A94",
    },
    light: {
      bgBase: "#FAFAFB",
      bgSurface: "#FFFFFF",
      bgElevated: "#F4F4F6",
      border: "#E5E5EA",
      textPrimary: "#0A0A0F",
      textMuted: "#6B6B75",
    }
  },
  typography: {
    fonts: {
      display: "var(--font-outfit), sans-serif",
      body: "var(--font-inter), sans-serif",
      gujarati: "var(--font-gujarati), sans-serif",
      mono: "var(--font-mono), monospace",
    },
    scale: {
      xs: "12px",
      sm: "14px",
      base: "16px",
      lg: "18px",
      xl: "20px",
      "2xl": "24px",
      "3xl": "32px",
      "4xl": "40px",
      "5xl": "56px",
    }
  },
  radii: {
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "24px",
    full: "9999px",
  },
  shadows: {
    subtle: "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)",
    glowPink: "0 0 24px rgba(233, 30, 99, 0.35)",
    glowCyan: "0 0 24px rgba(0, 188, 212, 0.35)",
    cardDark: "0 10px 30px -10px rgba(0,0,0,0.5)",
  },
  motion: {
    durations: {
      micro: 0.15,
      standard: 0.25,
      page: 0.4,
    },
    ease: [0.4, 0, 0.2, 1],
  }
};
