export default {
  branches: [
    'master',
    { name: 'alpha', prerelease: true },
    { name: 'beta', prerelease: true },
    { name: 'rc', prerelease: true },
    { name: 'canary-*', prerelease: true, channel: 'canary' },
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
