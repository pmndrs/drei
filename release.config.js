module.exports = {
  branches: [
    'master',
    { name: 'alpha', prerelease: true },
    { name: 'beta', prerelease: true },
    { name: 'abernier-*', prerelease: true },
  ],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    [
      '@semantic-release/npm',
      {
        pkgRoot: './dist',
      },
    ],
    '@semantic-release/github',
  ],
}
