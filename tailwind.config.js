module.exports = {
  content: ["./_site/**/*.html"],
  theme: {
    fontFamily: {
      mono: ["MonoLisa Variable", "ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "Liberation Mono", "Courier New", "monospace"],
    },
    screens: {
      'sm': '520px',
      'md': '620px',
      'lg': '1000px',
      // 'xl': '1280px',
      // '2xl': '1536px',
    }
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms")
  ],
}
