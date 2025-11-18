/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Existing design system colors (preserved for compatibility)
        basewhite: "var(--basewhite)",
        "color-mode-surface-bg-icon-gray":
          "var(--color-mode-surface-bg-icon-gray)",
        "color-mode-surface-bg-screen": "var(--color-mode-surface-bg-screen)",
        "color-mode-surface-primary-blue":
          "var(--color-mode-surface-primary-blue)",
        "color-mode-surface-purple-bg": "var(--color-mode-surface-purple-bg)",
        "color-mode-text-icons-t-blue": "var(--color-mode-text-icons-t-blue)",
        "color-mode-text-icons-t-btn-negative":
          "var(--color-mode-text-icons-t-btn-negative)",
        "color-mode-text-icons-t-green": "var(--color-mode-text-icons-t-green)",
        "color-mode-text-icons-t-orange":
          "var(--color-mode-text-icons-t-orange)",
        "color-mode-text-icons-t-placeholder":
          "var(--color-mode-text-icons-t-placeholder)",
        "color-mode-text-icons-t-primary-gray":
          "var(--color-mode-text-icons-t-primary-gray)",
        "color-mode-text-icons-t-red": "var(--color-mode-text-icons-t-red)",
        "color-mode-text-icons-t-sec": "var(--color-mode-text-icons-t-sec)",
        "color-primitives-blue-grey-10": "var(--color-primitives-blue-grey-10)",
        "color-primitives-cool-black": "var(--color-primitives-cool-black)",
        "color-shades-plain-dark": "var(--color-shades-plain-dark)",
        "color-shades-shades-10": "var(--color-shades-shades-10)",
        "core-colors-grey-grey-4": "var(--core-colors-grey-grey-4)",
        "core-colors-grey-grey-9": "var(--core-colors-grey-grey-9)",
        "core-colors-mango-mango-6": "var(--core-colors-mango-mango-6)",
        "core-colors-red-red-6": "var(--core-colors-red-red-6)",
        
        // New theme colors
        primary: {
          50: '#f0f2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#5a66c1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#5b738b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#00c850',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#e76500',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ee3939',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        // Border colors
        'border-light': '#e5e7eb',
        'border-medium': '#a9b4be',
        'border-dark': '#5b738b',
        // Text colors
        'text-primary': '#213547',
        'text-secondary': '#5b738b',
        'text-tertiary': '#a9b4be',
      },
      fontFamily: {
        // Existing design system fonts (preserved for compatibility)
        "body-body-1": "var(--body-body-1-font-family)",
        "body-body-2": "var(--body-body-2-font-family)",
        "caption-caption-1": "var(--caption-caption-1-font-family)",
        "caption-caption-2": "var(--caption-caption-2-font-family)",
        "fine-print-small-medium-underline":
          "var(--fine-print-small-medium-underline-font-family)",
        "headings-h1-h6-heading-5":
          "var(--headings-h1-h6-heading-5-font-family)",
        "headings-h1-h6-heading-6":
          "var(--headings-h1-h6-heading-6-font-family)",
        "headline-h3l": "var(--headline-h3l-font-family)",
        "headline-h5b": "var(--headline-h5b-font-family)",
        "headline-h6-m": "var(--headline-h6-m-font-family)",
        "headline-h7": "var(--headline-h7-font-family)",
        "headline-h8": "var(--headline-h8-font-family)",
        "subtitle-subtitle-2": "var(--subtitle-subtitle-2-font-family)",
        "subtitle-subtitle-3": "var(--subtitle-subtitle-3-font-family)",
        
        // New theme fonts
        'tajawal': ['Tajawal', 'Helvetica', 'Arial', 'sans-serif'],
        'inter': ['Inter', 'Helvetica', 'Arial', 'sans-serif'],
        'system': ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        'xs': '0.75rem',
        'sm': '0.875rem',
        'base': '1rem',
        'lg': '1.125rem',
        'xl': '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem',
        '6xl': '3.75rem',
      },
      borderColor: {
        'light': '#e5e7eb',
        'medium': '#a9b4be',
        'dark': '#5b738b',
      },
      textColor: {
        'primary': '#213547',
        'secondary': '#5b738b',
        'tertiary': '#a9b4be',
      },
    },
  },
  plugins: [],
};
