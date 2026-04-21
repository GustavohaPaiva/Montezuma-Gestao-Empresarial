/** @type {import('tailwindcss').Config} */

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        montserrat: ["Montserrat", "sans-serif"],
      },
      colors: {
        "bg-primary": "var(--color-bg-primary)",
        surface: "var(--color-surface)",
        "surface-alt": "var(--color-surface-alt)",
        "surface-muted": "var(--color-surface-muted)",
        "avatar-bg": "var(--color-avatar-bg)",
        "border-primary": "var(--color-border-primary)",
        "border-muted": "var(--color-border-muted)",
        "text-primary": "var(--color-text-primary)",
        "text-muted": "var(--color-text-muted)",
        "accent-primary": "var(--color-accent-primary)",
        "accent-primary-dark": "var(--color-accent-primary-dark)",
        "success-primary": "var(--color-success-primary)",
        "success-primary-dark": "var(--color-success-primary-dark)",
        "success-soft": "var(--color-success-soft)",
        "warning-primary": "var(--color-warning-primary)",
        "danger-primary": "var(--color-danger-primary)",
        "danger-primary-dark": "var(--color-danger-primary-dark)",
        "danger-soft": "var(--color-danger-soft)",
        "check-accent": "var(--color-check-accent)",
      },
    },
  },
  plugins: [],
};
