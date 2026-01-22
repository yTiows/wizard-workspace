import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "Consolas", "monospace"],
        display: ["Orbitron", "Inter", "sans-serif"],
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        "border-glow": "hsl(var(--border-glow))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        "background-elevated": "hsl(var(--background-elevated))",
        "background-surface": "hsl(var(--background-surface))",
        "background-overlay": "hsl(var(--background-overlay))",
        foreground: "hsl(var(--foreground))",
        "foreground-muted": "hsl(var(--foreground-muted))",
        "foreground-subtle": "hsl(var(--foreground-subtle))",
        terminal: {
          DEFAULT: "hsl(var(--terminal))",
          glow: "hsl(var(--terminal-glow))",
          dim: "hsl(var(--terminal-dim))",
        },
        cyber: {
          DEFAULT: "hsl(var(--cyber))",
          glow: "hsl(var(--cyber-glow))",
          dim: "hsl(var(--cyber-dim))",
        },
        amber: {
          DEFAULT: "hsl(var(--amber))",
          glow: "hsl(var(--amber-glow))",
          dim: "hsl(var(--amber-dim))",
        },
        danger: {
          DEFAULT: "hsl(var(--danger))",
          glow: "hsl(var(--danger-glow))",
          dim: "hsl(var(--danger-dim))",
        },
        arcane: {
          DEFAULT: "hsl(var(--arcane))",
          glow: "hsl(var(--arcane-glow))",
          dim: "hsl(var(--arcane-dim))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        window: {
          bg: "hsl(var(--window-bg))",
          header: "hsl(var(--window-header))",
          border: "hsl(var(--window-border))",
        },
        dock: {
          bg: "hsl(var(--dock-bg))",
          border: "hsl(var(--dock-border))",
        },
        status: {
          bg: "hsl(var(--status-bg))",
          text: "hsl(var(--status-text))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        window: "var(--window-shadow)",
        glow: "0 0 20px hsl(var(--terminal) / 0.3)",
        "glow-lg": "0 0 40px hsl(var(--terminal) / 0.4)",
        "glow-cyber": "0 0 20px hsl(var(--cyber) / 0.3)",
        "glow-amber": "0 0 20px hsl(var(--amber) / 0.3)",
        "glow-danger": "0 0 20px hsl(var(--danger) / 0.3)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "boot-text": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        flicker: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.8" },
        },
        "scan-line": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "boot-text": "boot-text 0.5s ease-out forwards",
        flicker: "flicker 0.15s ease-in-out infinite",
        "scan-line": "scan-line 8s linear infinite",
        float: "float 3s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
