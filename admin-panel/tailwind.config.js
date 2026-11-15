/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: { colors: { navy: { 950: '#101d38', 900: '#172746', 800: '#22385d' }, gold: { 500: '#c5a15a', 600: '#ad8842' } }, boxShadow: { soft: '0 12px 40px rgba(16,29,56,.08)' } } },
  plugins: []
};