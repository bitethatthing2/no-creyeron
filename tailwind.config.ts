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
      // Custom border radius values
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        // Custom radius values for modern design
        '12': '0.75rem',
        '16': '1rem',
        '20': '1.25rem',
        '24': '1.5rem',
      },
      // Core color scheme
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
        // Restaurant brand colors
        margarita: {
          green: 'hsl(142, 76%, 36%)',
          lime: 'hsl(74, 100%, 50%)',
          orange: 'hsl(24, 95%, 53%)',
          coral: 'hsl(16, 100%, 66%)',
        }
      },
      // Essential animations
      animation: {
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'pulse-soft': 'pulse-soft 2s infinite',
      },
      keyframes: {
        'fade-in': {
          'from': {
            opacity: '0',
            transform: 'translateY(20px)'
          },
          'to': {
            opacity: '1',
            transform: 'translateY(0)'
          }
        },
        'slide-up': {
          'from': {
            transform: 'translateY(100%)'
          },
          'to': {
            transform: 'translateY(0)'
          }
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' }
        }
      },
      // Custom spacing values
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      // Extended font sizes
      fontSize: {
        '2xs': '0.625rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem',
      },
      // Custom shadows
      boxShadow: {
        'soft-sm': '0 2px 8px rgba(0, 0, 0, 0.1)',
        'soft-md': '0 4px 16px rgba(0, 0, 0, 0.15)',
        'soft-lg': '0 8px 32px rgba(0, 0, 0, 0.2)',
        'glow': '0 0 20px rgba(var(--primary), 0.3)',
        'warm': '0 8px 32px rgba(24, 95%, 53%, 0.2)',
      },
      // Extended screen sizes
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