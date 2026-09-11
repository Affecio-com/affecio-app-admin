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
          bg: "var(--affecio-bg)",
          surface: "var(--affecio-surface)",
          input: "var(--affecio-input)",
          border: "var(--affecio-border)",
          text: "var(--affecio-text)",
          muted: "var(--affecio-muted)",
          accent: "var(--affecio-accent)",
          danger: "var(--affecio-danger)",
          link: "var(--affecio-link)",
          panel: "var(--affecio-panel)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        poppins: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        mondwest: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        brand: ["var(--font-mondwest)", "var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      borderRadius: {
        lg: "0.75rem",
        xl: "1rem",
      },
      boxShadow: {
        panel: "var(--affecio-shadow)",
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
