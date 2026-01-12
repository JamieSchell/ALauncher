/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          primary: '#05070A',
          secondary: '#0B101B',
          card: '#121826',
          panel: '#080C14',
          void: '#000000',
        },
        techno: {
          cyan: '#00F5FF',
          blue: '#4A9EFF',
          dim: 'rgba(0, 245, 255, 0.1)',
        },
        magic: {
          purple: '#B026FF',
          pink: '#FF2D95',
          dim: 'rgba(176, 38, 255, 0.1)',
        },
        status: {
          success: '#00FFB3',
          warning: '#FF9500',
          error: '#FF3B3B',
        }
      },
      fontFamily: {
        sans: ['Rajdhani', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Cinzel', 'serif'],
      },
      backgroundImage: {
        'cyber-grid': 'linear-gradient(135deg, #05070A 0%, #0B101B 50%, #121826 100%)',
        'neon-gradient': 'linear-gradient(135deg, #00F5FF 0%, #B026FF 100%)',
        'glass-panel': 'linear-gradient(180deg, rgba(18, 24, 38, 0.7) 0%, rgba(8, 12, 20, 0.8) 100%)',
      },
      boxShadow: {
        'neon-cyan': '0 0 10px rgba(0, 245, 255, 0.3), 0 0 20px rgba(0, 245, 255, 0.1), inset 0 0 5px rgba(0, 245, 255, 0.1)',
        'neon-purple': '0 0 10px rgba(176, 38, 255, 0.3), 0 0 20px rgba(176, 38, 255, 0.1), inset 0 0 5px rgba(176, 38, 255, 0.1)',
      }
    }
  },
  plugins: [],
}
