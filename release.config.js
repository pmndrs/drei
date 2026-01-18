export default {
  branches: [
    'master',
    { name: 'alpha', prerelease: true },
    { name: 'beta', prerelease: true },
    { name: 'rc', prerelease: true },
    { name: 'canary-*', prerelease: true, channel: 'canary' },
  ],
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'angular',
        // Explicit release rules - case-insensitive handling for common commit types
        // NOTE: Commit types are CASE-SENSITIVE by default! Use lowercase: feat, fix, perf
        // These rules handle accidental capitalization (Feat, Fix, FEAT, FIX, etc.)
        releaseRules: [
          // Standard lowercase (default behavior made explicit)
          { type: 'feat', release: 'minor' },
          { type: 'fix', release: 'patch' },
          { type: 'perf', release: 'patch' },
          { type: 'refactor', release: 'patch' },
          { type: 'revert', release: 'patch' },
          // Capitalized variants (common mistakes)
          { type: 'Feat', release: 'minor' },
          { type: 'Fix', release: 'patch' },
          { type: 'Perf', release: 'patch' },
          { type: 'Refactor', release: 'patch' },
          { type: 'Revert', release: 'patch' },
          // ALL CAPS variants (aggressive typers)
          { type: 'FEAT', release: 'minor' },
          { type: 'FIX', release: 'patch' },
          // Build/chore that should trigger releases (often needed for critical config fixes)
          { type: 'build', release: 'patch' },
          { type: 'Build', release: 'patch' },
          // Breaking changes (handled via ! suffix or BREAKING CHANGE footer, but explicit here)
          { type: 'feat', scope: '*', release: 'minor' },
          { type: 'fix', scope: '*', release: 'patch' },
        ],
      },
    ],
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
