/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        ink: {
          0: '#FFFFFF',
          50: '#F7F7F7',
          100: '#E5E5E5',
          200: '#C9C9C9',
          400: '#686868',
          600: '#3A3A3A',
          800: '#1C1C1C',
          900: '#0A0A0A',
        },
        live: '#00E07A',
        bad: '#FF3B30',
      },
      letterSpacing: {
        wider: '0.08em',
      },
      fontSize: {
        '11': ['11px', { lineHeight: '1.1' }],
      },
    },
  },
  plugins: [],
};
