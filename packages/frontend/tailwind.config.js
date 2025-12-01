/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
        accent: {
          DEFAULT: '#06b6d4',
          hover: '#0891b2',
          light: '#22d3ee',
          dark: '#0e7490',
          glow: '#06b6d4',
        },
        background: {
          primary: '#000000',
          secondary: '#0a0a0a',
          tertiary: '#141414',
          elevated: '#1f1f1f',
        },
        surface: {
          base: 'rgba(20, 20, 20, 0.7)',
          elevated: 'rgba(31, 31, 31, 0.8)',
          hover: 'rgba(40, 40, 40, 0.9)',
          active: 'rgba(50, 50, 50, 1)',
        },
        // Semantic Status Colors - Full Palette
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          DEFAULT: '#10b981',
          light: '#34d399',
          dark: '#059669',
          text: '#10b981',
          bg: 'rgba(16, 185, 129, 0.1)',
          border: 'rgba(16, 185, 129, 0.3)',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          DEFAULT: '#f59e0b',
          light: '#fbbf24',
          dark: '#d97706',
          text: '#f59e0b',
          bg: 'rgba(245, 158, 11, 0.1)',
          border: 'rgba(245, 158, 11, 0.3)',
        },
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
          DEFAULT: '#ef4444',
          light: '#f87171',
          dark: '#dc2626',
          text: '#ef4444',
          bg: 'rgba(239, 68, 68, 0.1)',
          border: 'rgba(239, 68, 68, 0.3)',
        },
        info: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
          DEFAULT: '#06b6d4',
          light: '#22d3ee',
          dark: '#0891b2',
          text: '#06b6d4',
          bg: 'rgba(6, 182, 212, 0.1)',
          border: 'rgba(6, 182, 212, 0.3)',
        },
        // Legacy status for backward compatibility
        status: {
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
          info: '#06b6d4',
        },
        // Interactive State Colors
        interactive: {
          hover: {
            primary: 'rgba(6, 182, 212, 0.1)',
            secondary: 'rgba(255, 255, 255, 0.05)',
            success: 'rgba(16, 185, 129, 0.1)',
            warning: 'rgba(245, 158, 11, 0.1)',
            error: 'rgba(239, 68, 68, 0.1)',
            info: 'rgba(6, 182, 212, 0.1)',
          },
          active: {
            primary: 'rgba(6, 182, 212, 0.15)',
            secondary: 'rgba(255, 255, 255, 0.1)',
            success: 'rgba(16, 185, 129, 0.15)',
            warning: 'rgba(245, 158, 11, 0.15)',
            error: 'rgba(239, 68, 68, 0.15)',
            info: 'rgba(6, 182, 212, 0.15)',
          },
          disabled: {
            bg: 'rgba(255, 255, 255, 0.05)',
            text: 'rgba(255, 255, 255, 0.3)',
            border: 'rgba(255, 255, 255, 0.1)',
          },
          focus: {
            primary: 'rgba(6, 182, 212, 0.5)',
            success: 'rgba(16, 185, 129, 0.5)',
            warning: 'rgba(245, 158, 11, 0.5)',
            error: 'rgba(239, 68, 68, 0.5)',
            info: 'rgba(6, 182, 212, 0.5)',
          },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, #06b6d4, #0e7490)',
        'gradient-secondary': 'linear-gradient(135deg, #0a0a0a, #141414)',
        'gradient-cyan': 'linear-gradient(135deg, #06b6d4, #0891b2, #0e7490)',
      },
      boxShadow: {
        'glow': '0 0 40px rgba(6, 182, 212, 0.5), 0 0 80px rgba(6, 182, 212, 0.3)',
        'glow-lg': '0 0 60px rgba(6, 182, 212, 0.7), 0 0 120px rgba(6, 182, 212, 0.4)',
        'glow-strong': '0 0 80px rgba(6, 182, 212, 0.8), 0 0 160px rgba(6, 182, 212, 0.5)',
      },
      animation: {
        'shimmer': 'shimmer 3s infinite',
        'glow': 'glow 3s ease-in-out infinite',
        'float': 'float 3.5s ease-in-out infinite',
        'gradient': 'gradient 5s ease infinite',
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      ringWidth: {
        'focus': '2px',
      },
      ringColor: {
        'focus': 'rgba(6, 182, 212, 0.5)',
      },
      outlineColor: {
        'focus': '#06b6d4',
      },
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      // Typography Scale
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1.5', letterSpacing: '0.025em' }],      // 12px
        'sm': ['0.875rem', { lineHeight: '1.571', letterSpacing: '0.01em' }],   // 14px
        'base': ['1rem', { lineHeight: '1.5', letterSpacing: '0' }],             // 16px
        'lg': ['1.125rem', { lineHeight: '1.556', letterSpacing: '-0.01em' }],  // 18px
        'xl': ['1.25rem', { lineHeight: '1.5', letterSpacing: '-0.015em' }],     // 20px
        '2xl': ['1.5rem', { lineHeight: '1.5', letterSpacing: '-0.02em' }],     // 24px
        '3xl': ['1.875rem', { lineHeight: '1.4', letterSpacing: '-0.025em' }],  // 30px
        '4xl': ['2.25rem', { lineHeight: '1.333', letterSpacing: '-0.03em' }],   // 36px
        '5xl': ['3rem', { lineHeight: '1.25', letterSpacing: '-0.035em' }],      // 48px
        '6xl': ['3.75rem', { lineHeight: '1.2', letterSpacing: '-0.04em' }],     // 60px
      },
      // Font Weight Scale
      fontWeight: {
        'light': '300',
        'normal': '400',
        'medium': '500',
        'semibold': '600',
        'bold': '700',
        'extrabold': '800',
        'black': '900',
      },
      // Line Height Scale
      lineHeight: {
        'none': '1',
        'tight': '1.25',
        'snug': '1.375',
        'normal': '1.5',
        'relaxed': '1.625',
        'loose': '2',
        '3': '0.75rem',
        '4': '1rem',
        '5': '1.25rem',
        '6': '1.5rem',
        '7': '1.75rem',
        '8': '2rem',
        '9': '2.25rem',
        '10': '2.5rem',
      },
      // Letter Spacing Scale
      letterSpacing: {
        'tighter': '-0.05em',
        'tight': '-0.025em',
        'normal': '0em',
        'wide': '0.025em',
        'wider': '0.05em',
        'widest': '0.1em',
      },
      // Spacing Scale - Consistent spacing system
      spacing: {
        'xs': '0.25rem',    // 4px
        'sm': '0.5rem',     // 8px
        'md': '0.75rem',    // 12px
        'base': '1rem',     // 16px
        'lg': '1.5rem',     // 24px
        'xl': '2rem',       // 32px
        '2xl': '3rem',      // 48px
        '3xl': '4rem',      // 64px
        '4xl': '6rem',      // 96px
        '5xl': '8rem',      // 128px
      },
      // Container max-widths
      maxWidth: {
        'xs': '20rem',      // 320px
        'sm': '24rem',      // 384px
        'md': '28rem',      // 448px
        'lg': '32rem',      // 512px
        'xl': '36rem',      // 576px
        '2xl': '42rem',     // 672px
        '3xl': '48rem',     // 768px
        '4xl': '56rem',     // 896px
        '5xl': '64rem',     // 1024px
        '6xl': '72rem',     // 1152px
        '7xl': '80rem',     // 1280px
        'container-sm': '640px',
        'container-md': '768px',
        'container-lg': '1024px',
        'container-xl': '1280px',
        'container-2xl': '1536px',
      },
      // Grid system
      gridTemplateColumns: {
        'auto-fit-xs': 'repeat(auto-fit, minmax(200px, 1fr))',
        'auto-fit-sm': 'repeat(auto-fit, minmax(250px, 1fr))',
        'auto-fit-md': 'repeat(auto-fit, minmax(300px, 1fr))',
        'auto-fit-lg': 'repeat(auto-fit, minmax(350px, 1fr))',
        'auto-fill-xs': 'repeat(auto-fill, minmax(200px, 1fr))',
        'auto-fill-sm': 'repeat(auto-fill, minmax(250px, 1fr))',
        'auto-fill-md': 'repeat(auto-fill, minmax(300px, 1fr))',
        'auto-fill-lg': 'repeat(auto-fill, minmax(350px, 1fr))',
      },
    },
  },
  plugins: [],
}
