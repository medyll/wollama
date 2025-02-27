/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,svelte,ts}", "./src/**/*.css"],
  theme: {
    screens: {
      sm: "40rem",
      phone: "40rem",
      md: "48rem",
      lg: "64rem",
      xl: "80rem",
      "2xl": "96rem",
      hd: "120rem",
      "2k": "160rem",
      "4k": "230rem",
    },
    extend: {},
  },
  plugins: [
    {
      tailwindcss: {},
      autoprefixer: {},
      typography: {},
      "postcss-nesting": {},
      "postcss-import": {},
    },
  ],
};
