import type { Config } from "tailwindcss";

/**
 * Tailwind CSS Configuration
 * REQ-FE-014: Tailwind CSS 4 integration with CSS variables
 *
 * Uses @theme directive in globals.css for design tokens
 * This file provides additional configuration and content paths
 */
const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Colors are defined in styles/tokens/colors.css using @theme
      // Font families are defined in styles/tokens/typography.css using @theme
      // Spacing is defined in styles/tokens/spacing.css using @theme

      // Map CSS variables to Tailwind utilities
      colors: {
        background: "var(--color-background)",
        foreground: "var(--color-foreground)",
        border: "var(--color-border)",
        "border-muted": "var(--color-border-muted)",

        primary: {
          50: "var(--color-primary-50)",
          100: "var(--color-primary-100)",
          200: "var(--color-primary-200)",
          300: "var(--color-primary-300)",
          400: "var(--color-primary-400)",
          500: "var(--color-primary-500)",
          600: "var(--color-primary-600)",
          700: "var(--color-primary-700)",
          800: "var(--color-primary-800)",
          900: "var(--color-primary-900)",
          950: "var(--color-primary-950)",
          DEFAULT: "var(--color-primary-600)",
        },

        secondary: {
          50: "var(--color-secondary-50)",
          100: "var(--color-secondary-100)",
          200: "var(--color-secondary-200)",
          300: "var(--color-secondary-300)",
          400: "var(--color-secondary-400)",
          500: "var(--color-secondary-500)",
          600: "var(--color-secondary-600)",
          700: "var(--color-secondary-700)",
          800: "var(--color-secondary-800)",
          900: "var(--color-secondary-900)",
          950: "var(--color-secondary-950)",
          DEFAULT: "var(--color-secondary-500)",
        },

        accent: {
          50: "var(--color-accent-50)",
          100: "var(--color-accent-100)",
          200: "var(--color-accent-200)",
          300: "var(--color-accent-300)",
          400: "var(--color-accent-400)",
          500: "var(--color-accent-500)",
          600: "var(--color-accent-600)",
          700: "var(--color-accent-700)",
          800: "var(--color-accent-800)",
          900: "var(--color-accent-900)",
          950: "var(--color-accent-950)",
          DEFAULT: "var(--color-accent-500)",
        },

        neutral: {
          50: "var(--color-neutral-50)",
          100: "var(--color-neutral-100)",
          200: "var(--color-neutral-200)",
          300: "var(--color-neutral-300)",
          400: "var(--color-neutral-400)",
          500: "var(--color-neutral-500)",
          600: "var(--color-neutral-600)",
          700: "var(--color-neutral-700)",
          800: "var(--color-neutral-800)",
          900: "var(--color-neutral-900)",
          950: "var(--color-neutral-950)",
        },

        success: {
          50: "var(--color-success-50)",
          100: "var(--color-success-100)",
          200: "var(--color-success-200)",
          300: "var(--color-success-300)",
          400: "var(--color-success-400)",
          500: "var(--color-success-500)",
          600: "var(--color-success-600)",
          700: "var(--color-success-700)",
          800: "var(--color-success-800)",
          900: "var(--color-success-900)",
          DEFAULT: "var(--color-success-500)",
        },

        warning: {
          50: "var(--color-warning-50)",
          100: "var(--color-warning-100)",
          200: "var(--color-warning-200)",
          300: "var(--color-warning-300)",
          400: "var(--color-warning-400)",
          500: "var(--color-warning-500)",
          600: "var(--color-warning-600)",
          700: "var(--color-warning-700)",
          800: "var(--color-warning-800)",
          900: "var(--color-warning-900)",
          DEFAULT: "var(--color-warning-500)",
        },

        error: {
          50: "var(--color-error-50)",
          100: "var(--color-error-100)",
          200: "var(--color-error-200)",
          300: "var(--color-error-300)",
          400: "var(--color-error-400)",
          500: "var(--color-error-500)",
          600: "var(--color-error-600)",
          700: "var(--color-error-700)",
          800: "var(--color-error-800)",
          900: "var(--color-error-900)",
          DEFAULT: "var(--color-error-500)",
        },

        info: {
          50: "var(--color-info-50)",
          100: "var(--color-info-100)",
          200: "var(--color-info-200)",
          300: "var(--color-info-300)",
          400: "var(--color-info-400)",
          500: "var(--color-info-500)",
          600: "var(--color-info-600)",
          700: "var(--color-info-700)",
          800: "var(--color-info-800)",
          900: "var(--color-info-900)",
          DEFAULT: "var(--color-info-500)",
        },

        // Semantic component colors
        card: {
          background: "var(--color-card-background)",
          foreground: "var(--color-card-foreground)",
          border: "var(--color-card-border)",
        },

        input: {
          background: "var(--color-input-background)",
          foreground: "var(--color-input-foreground)",
          border: "var(--color-input-border)",
          placeholder: "var(--color-input-placeholder)",
        },

        popover: {
          background: "var(--color-popover-background)",
          foreground: "var(--color-popover-foreground)",
          border: "var(--color-popover-border)",
        },

        sidebar: {
          background: "var(--color-sidebar-background)",
          foreground: "var(--color-sidebar-foreground)",
          border: "var(--color-sidebar-border)",
          accent: "var(--color-sidebar-accent)",
          "accent-foreground": "var(--color-sidebar-accent-foreground)",
        },

        muted: {
          background: "var(--color-muted-background)",
          foreground: "var(--color-muted-foreground)",
        },
      },

      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
        kr: ["var(--font-kr)"],
      },

      fontSize: {
        "display-lg": ["var(--font-size-display-lg)", { lineHeight: "1.1" }],
        display: ["var(--font-size-display)", { lineHeight: "1.2" }],
        h1: ["var(--font-size-h1)", { lineHeight: "1.3" }],
        h2: ["var(--font-size-h2)", { lineHeight: "1.4" }],
        h3: ["var(--font-size-h3)", { lineHeight: "1.4" }],
        h4: ["var(--font-size-h4)", { lineHeight: "1.5" }],
        "body-lg": ["var(--font-size-body-lg)", { lineHeight: "1.6" }],
        body: ["var(--font-size-body)", { lineHeight: "1.6" }],
        "body-sm": ["var(--font-size-body-sm)", { lineHeight: "1.5" }],
        caption: ["var(--font-size-caption)", { lineHeight: "1.4" }],
        overline: ["var(--font-size-overline)", { lineHeight: "1.2" }],
      },

      spacing: {
        "sidebar": "var(--sidebar-width)",
        "sidebar-collapsed": "var(--sidebar-width-collapsed)",
        "header": "var(--header-height)",
        "header-mobile": "var(--header-height-mobile)",
        "bottom-tab": "var(--bottom-tab-height)",
      },

      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
      },

      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        "2xl": "var(--shadow-2xl)",
        inner: "var(--shadow-inner)",
        card: "var(--shadow-card)",
        "card-hover": "var(--shadow-card-hover)",
        dropdown: "var(--shadow-dropdown)",
        dialog: "var(--shadow-dialog)",
        tooltip: "var(--shadow-tooltip)",
        float: "var(--shadow-float)",
        nav: "var(--shadow-nav)",
        focus: "var(--shadow-focus)",
        "focus-error": "var(--shadow-focus-error)",
      },

      transitionDuration: {
        instant: "var(--duration-instant)",
        fast: "var(--duration-fast)",
        normal: "var(--duration-normal)",
        slow: "var(--duration-slow)",
        slower: "var(--duration-slower)",
        slowest: "var(--duration-slowest)",
      },

      transitionTimingFunction: {
        "ease-bounce": "var(--ease-bounce)",
        "ease-spring": "var(--ease-spring)",
      },

      zIndex: {
        dropdown: "var(--z-dropdown)",
        sticky: "var(--z-sticky)",
        fixed: "var(--z-fixed)",
        "modal-backdrop": "var(--z-modal-backdrop)",
        modal: "var(--z-modal)",
        popover: "var(--z-popover)",
        tooltip: "var(--z-tooltip)",
        toast: "var(--z-toast)",
      },

      maxWidth: {
        container: "var(--container-max)",
        "dialog-sm": "var(--dialog-max-width-sm)",
        dialog: "var(--dialog-max-width)",
        "dialog-lg": "var(--dialog-max-width-lg)",
        "dialog-xl": "var(--dialog-max-width-xl)",
      },

      animation: {
        "fade-in": "fadeIn var(--duration-normal) var(--ease-out)",
        "slide-in": "slideIn var(--duration-normal) var(--ease-out)",
        "slide-up": "slideUp var(--duration-normal) var(--ease-out)",
      },

      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideIn: {
          "0%": { transform: "translateX(-8px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
