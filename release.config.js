module.exports = {
  plugins: [
    [
      '@semantic-release/npm',
      {
        pkgRoot: './dist',
      },
    ],
  ],
}
