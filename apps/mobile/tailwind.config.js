/**
 * Tailwind CSS Configuration for NativeWind v4
 * @see https://www.nativewind.dev/v4/getting-started/installation
 */

/** @type {import('tailwindcss').Config} */
export const content = [
  './App.{js,jsx,ts,tsx}',
  './index.{js,jsx,ts,tsx}',
  './src/**/*.{js,jsx,ts,tsx}',
];
export const presets = [require('nativewind/preset')];
export const theme = {
  extend: {
    colors: {
      // Dark Navy Theme - Reference site inspired
      navy: {
        50: '#e6eaf0',
        100: '#c2cad8',
        200: '#9aa8be',
        300: '#7286a4',
        400: '#556c91',
        500: '#38527e',
        600: '#324a73',
        700: '#2a4065',
        800: '#1e293b', // Slightly richer navy for cards
        900: '#0f172a', // Main dark background
        950: '#020617', // Deepest navy - primary background
      },
      // Primary Blue Accent
      primary: {
        50: '#eff6ff',
        100: '#dbeafe',
        200: '#bfdbfe',
        300: '#93c5fd',
        400: '#60a5fa',
        500: '#3b82f6', // Main primary
        600: '#2563eb',
        700: '#1d4ed8',
        800: '#1e40af',
        900: '#1e3a8a',
        950: '#172554',
      },
      // Teal/Secondary - for accents
      secondary: {
        50: '#f0fdfa',
        100: '#ccfbf1',
        200: '#99f6e4',
        300: '#5eead4',
        400: '#2dd4bf',
        500: '#14b8a6',
        600: '#0d9488',
        700: '#0f766e',
        800: '#115e59',
        900: '#134e4a',
        950: '#042f2e',
      },
      // Success Green - for streak indicators
      success: {
        50: '#f0fdf4',
        100: '#dcfce7',
        200: '#bbf7d0',
        300: '#86efac',
        400: '#4ade80',
        500: '#22c55e', // Streak intact badge
        600: '#16a34a',
        700: '#15803d',
        800: '#166534',
        900: '#14532d',
      },
      // Warning/Accent Orange - merged with shadcn accent below
      // Surface colors for dark theme
      surface: {
        50: '#f8fafc',
        100: '#f1f5f9',
        200: '#e2e8f0',
        300: '#cbd5e1',
        400: '#94a3b8',
        500: '#64748b',
        600: '#475569',
        700: '#334155',
        800: '#1e293b', // Card backgrounds
        900: '#0f172a', // Darker surface
        950: '#020617',
      },
      // Danger/Error - Softer rose tones
      danger: {
        50: '#fff1f2',
        100: '#ffe4e6',
        200: '#fecdd3',
        300: '#fda4af',
        400: '#fb7185',
        500: '#f43f5e', // Softer rose instead of harsh red
        600: '#e11d48',
        700: '#be123c',
        800: '#9f1239',
        900: '#881337',
      },
      // Hope - Warm amber for positive/celebratory moments
      hope: {
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
      },
      // Calm - Soft lavender for mindfulness features
      calm: {
        50: '#faf5ff',
        100: '#f3e8ff',
        200: '#e9d5ff',
        300: '#d8b4fe',
        400: '#c084fc',
        500: '#a855f7',
        600: '#9333ea',
        700: '#7c3aed',
        800: '#6b21a8',
        900: '#581c87',
      },
      // Glow - Subtle accent for achievements
      glow: {
        400: '#38bdf8',
        500: '#0ea5e9',
        600: '#0284c7',
      },
      // shadcn semantic colors (CSS variable-based for runtime theming)
      border: 'hsl(var(--border))',
      input: 'hsl(var(--input))',
      ring: 'hsl(var(--ring))',
      background: 'hsl(var(--background))',
      foreground: 'hsl(var(--foreground))',
      destructive: {
        DEFAULT: 'hsl(var(--destructive))',
        foreground: 'hsl(var(--destructive-foreground))',
      },
      muted: {
        DEFAULT: 'hsl(var(--muted))',
        foreground: 'hsl(var(--muted-foreground))',
      },
      accent: {
        ...{
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
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
    fontFamily: {
      display: [
        'Outfit_400Regular',
        'Outfit_500Medium',
        'Outfit_600SemiBold',
        'Outfit_700Bold',
        'sans-serif',
      ],
      sans: [
        'PlusJakartaSans_400Regular',
        'PlusJakartaSans_500Medium',
        'PlusJakartaSans_600SemiBold',
        'PlusJakartaSans_700Bold',
        'sans-serif',
      ],
      mono: [
        'JetBrainsMono_400Regular',
        'JetBrainsMono_500Medium',
        'JetBrainsMono_700Bold',
        'monospace',
      ],
    },
    borderRadius: {
      '4xl': '2rem',
      // shadcn radius system
      lg: 'var(--radius)',
      md: 'calc(var(--radius) - 2px)',
      sm: 'calc(var(--radius) - 4px)',
    },
    // Custom opacity for dark glass effect
    opacity: {
      15: '0.15',
      25: '0.25',
      35: '0.35',
      85: '0.85',
    },
  },
};
export const plugins = [];
