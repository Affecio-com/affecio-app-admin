/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: "var(--surface)",
        "input-bg": "var(--input-bg)",
        muted: "var(--muted)",
        "muted-foreground": "var(--muted-foreground)",
        border: "var(--border)",
        ring: "var(--ring)",
        link: "var(--link)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
        },
        affecio: {
          bg: "#000000",
          surface: "#111111",
          input: "#1A1A1A",
          border: "#2A2A2A",
          text: "#FFFFFF",
          muted: "#AAAAAA",
          accent: "#FF4B63",
          danger: "#FF3B30",
          link: "#4FC3F7",
        },
      },
      fontFamily: {
        sans: ["var(--font-poppins)", "system-ui", "sans-serif"],
        poppins: ["var(--font-poppins)", "sans-serif"],
        mondwest: ["var(--font-mondwest)", "var(--font-poppins)", "system-ui", "sans-serif"],
        display: ["var(--font-mondwest)", "var(--font-poppins)", "system-ui", "sans-serif"],
        mono: ["var(--font-neuebit)", "monospace"],
      },
      borderRadius: {
        lg: "0.75rem",
        xl: "1rem",
      },
      minWidth: {
        desktop: "1280px",
      },
      maxWidth: {
        content: "1400px",
      },
    },
  },
  plugins: [],
};
