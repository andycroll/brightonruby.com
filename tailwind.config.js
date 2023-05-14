module.exports = {
  content: ["./_site/**/*.html"],
  theme: {
    fontFamily: {
      mono: ["MonoLisa Variable", "ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "Liberation Mono", "Courier New", "monospace"],
    },
    screens: {
      'sm': '400px',
      'md': '700px',
      'lg': '1024px',
      // 'xl': '1280px',
      // '2xl': '1536px',
    }
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms")
  ],
}
