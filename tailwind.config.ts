import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

export default {
  // Note: also includes src/content so MDX content can use Tailwind classes.
  content: ['./src/app/**/*.{js,ts,jsx,tsx,mdx}', './src/content/**/*.{md,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4f46e5',
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      typography: {
        DEFAULT: {
          css: {
            // Keep prose readable + match the rest of the site
            'a': { color: 'var(--tw-prose-links)', textDecoration: 'underline' },
            'code::before': { content: '""' },
            'code::after': { content: '""' },
            'pre': { backgroundColor: '#0f172a', color: '#e2e8f0' },
          },
        },
      },
    },
  },
  plugins: [typography],
} satisfies Config;
