/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // yellow Primary theme (Main highlight color: #7A5AF8) - Lighter & More Aesthetic
        primary: {
          50: '#faf7ff',
          100: '#f4f0ff', // Lavender Background - Lighter
          200: '#ede4ff',
          300: '#e0d0ff',
          400: '#cfb8ff',
          500: '#b898ff',
          600: '#9b7df8', // Main yellow Theme - Lighter
          700: '#8566f5',
          800: '#7454e8',
          900: '#6346d6',
          950: '#523bc4',
        },
        // Light Grey for sidebar/cards - Softer & More Modern
        secondary: {
          50: '#fbfcfd', // Light Grey Sidebar/Cards - Softer
          100: '#f7f8fa',
          200: '#eef1f4',
          300: '#dde2e7',
          400: '#b4bcc5',
          500: '#8a94a3', // Secondary Text Grey - Lighter
          600: '#6b7684',
          700: '#525b69',
          800: '#3d4651', // Dark Text Primary - Lighter
          900: '#2a3138',
          950: '#1a1f24',
        },
        // Blue Accent - Lighter & More Vibrant
        accent: {
          50: '#f0f8ff',
          100: '#e0f0ff',
          200: '#c7e4ff',
          300: '#a5d2ff',
          400: '#7bb8ff',
          500: '#5ba3ff', // Blue Accent - Lighter
          600: '#4a90e2',
          700: '#3d7bc5',
          800: '#3466a8',
          900: '#2d548b',
        },
        // Green Accent for success - Lighter & More Fresh
        success: {
          50: '#f0fdf6',
          100: '#dcfce8',
          200: '#bbf7d2',
          300: '#86efb0',
          400: '#4ade87',
          500: '#22c55e', // Green Accent - Lighter
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        // Orange Accent for warnings - Lighter & More Warm
        warning: {
          50: '#fffcf0',
          100: '#fef7e0',
          200: '#feecb8',
          300: '#fddd82',
          400: '#fcc84a',
          500: '#fbb424', // Orange Accent - Lighter
          600: '#ea9a0c',
          700: '#c27c0a',
          800: '#9b6308',
          900: '#7d5006',
        },
        // Pink Accent for additional highlights - Lighter & More Playful
        pink: {
          50: '#fef7f7',
          100: '#feecee',
          200: '#fed7dc',
          300: '#fdb8c2',
          400: '#fb8da3',
          500: '#f56b88', // Pink Accent - Lighter
          600: '#e94d72',
          700: '#d63862',
          800: '#b8265a',
          900: '#9d1d53',
        },
        // Error colors
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      boxShadow: {
        'soft': '0 2px 15px 0 rgba(0, 0, 0, 0.08)',
        'medium': '0 4px 25px 0 rgba(0, 0, 0, 0.1)',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
      },
    },
  },
  plugins: [
    // Add any Tailwind plugins here when needed
  ],
}
