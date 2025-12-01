export default {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      keyframes: {
        fadeInOut: {
          '0%, 100%': { opacity: '0' },
          '50%': { opacity: '1' }
        },
        kenburns: {
          '0%': { transform: 'scale(1) translate(0, 0)' },
          '100%': { transform: 'scale(1.15) translate(10px, -10px)' }
        },
        blurFade: {
          '0%': { opacity: '0', filter: 'blur(10px)' },
          '100%': { opacity: '1', filter: 'blur(0px)' }
        },
        textUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '0.9' }
        }
      },
      animation: {
        fade: 'fadeInOut 0.7s ease-in-out',
        kenburns: 'kenburns 10s ease-out forwards',
        blurFade: 'blurFade 0.8s ease-out',
        textUp: 'textUp 1s ease-out forwards',
        glowPulse: 'glowPulse 6s ease-in-out infinite',
      }
    }
  },
  plugins: []
}
