import type { Config } from 'tailwindcss';

export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'linear-custom':
          'linear-gradient(90deg, #8AD4EC 0%, #EF96FF 24%, #FF56A9 54%, #FFAA6C 85%)',
        'text-gradient':
          'linear-gradient(90deg, #8AD4EC 0%, #EF96FF 24%, #FF56A9 54%, #FFAA6C 85%)',
      },
      colors: {
        bg: '#1B1B1B',
        gray: '#232323',
        textLabel: '#ADADAD',
        textGray: '#CDCDCD',
        lightGray: '#5B5B5B',
        softWhite: '#E2E2E2',
        yellow: '#FBBC04',
        orange: '#FF6C00',
        navbar: '#151515',
      },
    },
  },
  plugins: [],
} satisfies Config;
