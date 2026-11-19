// ╔══════════════════════════════════════════════════════════════════════════╗
// ║                                                                          ║
// ║ ██╗   ██╗██╗      █████╗ ██████╗                                         ║
// ║ ██║   ██║██║     ██╔══██╗██╔══██╗                                        ║
// ║ ██║   ██║██║     ███████║██████╔╝                                        ║
// ║ ╚██╗ ██╔╝██║     ██╔══██║██╔══██╗                                        ║
// ║  ╚████╔╝ ███████╗██║  ██║██████╔╝                                        ║
// ║   ╚═══╝  ╚══════╝╚═╝  ╚═╝╚═════╝                                         ║
// ║                                                                          ║
// ║ Project   : Ultra AI — Proprietary AI Platform                           ║
// ║ Developer : Ultra Cube Tech — ucubetech.com                              ║
// ║ Team      : Ultra Zone Team — ultra-zone.ucubetech.com                   ║
// ║ GitHub    : github.com/Ultra-Cube                                        ║
// ║ Copyright : (c) Ultra Cube Tech — All rights reserved                    ║
// ║ [UCUBETECH-COPYRIGHT]                                                    ║
// ║                                                                          ║
// ╚══════════════════════════════════════════════════════════════════════════╝

/** @type {import('tailwindcss').Config} */
// Warm neutral palette aligned with the Ultra AI design tokens
// (globals.css: --bg #f7f3eb, --ink #1f1d1a, --muted #5d5953,
//  --accent #d95d39, --accent-2 #2f8f9d).
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        gray: {
          50: '#faf7f1',
          100: '#f3eee4',
          200: '#e6ddcd',
          300: '#d3c6b1',
          400: '#b3a48c',
          500: '#8f8271',
          600: '#6e6354',
          700: '#5d5245',
          800: '#4a4237',
          900: '#2e2a23',
          950: '#1f1d1a',
        },
        brand: {
          DEFAULT: '#d95d39',
          soft: '#f3e2da',
          2: '#2f8f9d',
        },
      },
    },
  },
  plugins: [],
};
