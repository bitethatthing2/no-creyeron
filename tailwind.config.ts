import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // Custom border radius values for your Mexican-themed UI
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        // Add custom radius values for your wolfpack design
        '12': '0.75rem',
        '16': '1rem',
        '20': '1.25rem',
        '24': '1.5rem',
      },
      // Your existing color scheme
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        },
        // Add Mexican-inspired colors for your wolfpack theme
        mexican: {
          orange: 'hsl(var(--mexican-orange))',
          red: 'hsl(var(--mexican-red))',
          green: 'hsl(var(--mexican-green))',
          yellow: 'hsl(var(--mexican-yellow))',
          lime: 'hsl(var(--mexican-lime))',
          coral: 'hsl(var(--mexican-coral))',
          terracotta: 'hsl(var(--mexican-terracotta))',
          turquoise: 'hsl(var(--mexican-turquoise))',
        }
      },
      // Add custom animations for your wolfpack theme
      animation: {
        'wolfpack-spin': 'wolfpack-spin 1s linear infinite',
        'wolfpack-pulse': 'wolfpack-pulse 2s infinite',
        'wolfpack-fade-in': 'wolfpack-fade-in 0.5s ease-out',
        'wolfpack-mexican-bounce': 'wolfpack-mexican-bounce 0.6s ease-in-out',
      },
      keyframes: {
        'wolfpack-spin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        },
        'wolfpack-pulse': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)' }
        },
        'wolfpack-fade-in': {
          'from': {
            opacity: '0',
            transform: 'translateY(20px)'
          },
          'to': {
            opacity: '1',
            transform: 'translateY(0)'
          }
        },
        'wolfpack-mexican-bounce': {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '25%': { transform: 'translateY(-5px) rotate(2deg)' },
          '75%': { transform: 'translateY(-2px) rotate(-1deg)' }
        }
      },
      // Add custom spacing for your design
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      // Add custom font sizes
      fontSize: {
        '2xs': '0.625rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem',
      },
      // Add custom shadows for depth
      boxShadow: {
        'wolfpack-sm': '0 2px 8px rgba(0, 0, 0, 0.1)',
        'wolfpack-md': '0 4px 16px rgba(0, 0, 0, 0.15)',
        'wolfpack-lg': '0 8px 32px rgba(0, 0, 0, 0.2)',
        'wolfpack-glow': '0 0 20px rgba(var(--primary), 0.3)',
        'mexican-warm': '0 8px 32px rgba(var(--mexican-orange), 0.2)',
      },
      // Ensure your custom classes work
      screens: {
        'xs': '475px',
      },
    },
  },
  plugins: [
    tailwindcssAnimate,
  ],
};

export default config;