module.exports = {
  branches: [
    'master',
    { name: 'alpha', prerelease: true },
    { name: 'beta', prerelease: true },
    { name: 'canary-*', prerelease: true, channel: 'rc' },
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
