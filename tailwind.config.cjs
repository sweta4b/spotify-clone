/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [ "./src/**/*.{html,js}" ],
  theme: {
    extend: {
      colors: {
        "green": "#1db954",
        "black-primary": "#191414",
        "black-base":"#121212",
        "black-secondary": "#171818",
        "white": "#FFFFFF",
        "lightblack": "#282828",
        "gray": "#535353",
        "secondary": "#b3b3b3"
      },
      gridTemplateColumns: {
         'auto-fill-cards': 'repeat(auto-fill, minmax(200px, 1fr))'
      },
    },
  },
  plugins: [ require('@tailwindcss/line-clamp'), ],
}
