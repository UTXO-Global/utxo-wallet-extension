/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      width: {
        33: "8.6rem",
        20.5: "6.01rem",
        38: "9.5rem",
        38.1: "9.6875rem",
      },
      height: {
        33: "8.6rem",
        38: "9.5rem",
        38.1: "9.6875rem",
        "100vh-72px": "calc(100vh - 72px)",
        "100vh-100px": "calc(100vh - 100px)"
      },
      colors: {
        light: {
          100: "#FFFFFF"
        },
        grey: {
          100: "#ABA8A1",
          200: "#EBECEC",
          300: "#F5F5F5"
        },
        bg: "#18100C",
        "input-bg": "#3d3d3d95",
        "input-light": "#3d3d3d35",
        "toast-bg": "#3d3d3d",
        text: "#FBFBFB",
        secondary: "#D1D1D1",
        primary: "#0D0D0D",
        panel: "#669bbc",
        hovered: "#a8d0db",
        "hovered-btn": "#fd9343",
        "light-orange": "#ff863a",
        "light-purple-2": "#382C20",
        "purple-4": "#A69C8C",
        "purple-3": "#4E4132",
        "dark-purple": "#261D13"
      },
      screens: {
        "standard": "355px",
        "sm": "640px",
        "md": "768px",
        "lg": "1024px",
        "xl": "1280px",
        "2xl": "1536px"
      }
    },
  },
  plugins: [],
};
