import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      gridTemplateColumns: {
        '13': 'repeat(13, minmax(0, 1fr))',
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'quick-shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-2px)' },
          '50%': { transform: 'translateX(0)' },
          '75%': { transform: 'translateX(2px)' },
        },
        'glow-pulse': {
          '0%, 100%': {
            textShadow:
              '0 0 12px rgba(147, 51, 234, 0.7), 0 0 20px rgba(147, 51, 234, 0.5), 0 0 30px rgba(147, 51, 234, 0.3)',
            transform: 'scale(1.01)',
          },
          '50%': {
            textShadow:
              '0 0 14px rgba(147, 51, 234, 0.9), 0 0 24px rgba(147, 51, 234, 0.7), 0 0 35px rgba(147, 51, 234, 0.5)',
            transform: 'scale(1.03)',
          },
        },
        'glow-pulse-subtle': {
          '0%, 100%': {
            textShadow: '0 0 4px rgba(255, 255, 255, 0.7), 0 0 8px rgba(147, 51, 234, 0.5)',
            transform: 'scale(1)',
          },
          '50%': {
            textShadow: '0 0 8px rgba(255, 255, 255, 0.9), 0 0 15px rgba(147, 51, 234, 0.7)',
            transform: 'scale(1.01)',
          },
        },
      },
      animation: {
        'quick-shake': 'quick-shake 0.25s ease-in-out',
        'glow-text': 'glow-pulse 2s ease-in-out infinite',
        'glow-text-subtle': 'glow-pulse-subtle 2.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
export default config
