/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'sentiment-positive': '#10b981',
        'sentiment-negative': '#ef4444',
        'sentiment-neutral': '#6b7280',
        'emotion-joy': '#fbbf24',
        'emotion-sadness': '#3b82f6',
        'emotion-anger': '#dc2626',
        'emotion-fear': '#8b5cf6',
        'emotion-surprise': '#ec4899',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}