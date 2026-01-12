# Contributing

Thanks for wanting to make a contribution and wanting to improve this library for everyone! This repository uses Typescript so please continue to do so, you can always reach out in the repo or the [discord](https://pmnd.rs/discord). This is a guideline, use your initiative, if you don't think it makes sense to do a step in here, don't bother it's normally okay. we're chill.

## v11 Documentation

Drei v11 introduced a new architecture. See these guides for details:

- [Migration Guide](./MIGRATION_V10_TO_V11.md) — Overview of v11 changes
- [Build & Publish](./building/BUILD_AND_PUBLISH.md) — How to build and release
- [Platform Aliases](./building/PLATFORM_ALIASES.md) — How `#three` and `#drei-platform` work
- [Storybook Guide](../.storybook/README.md) — Writing stories and platform switching
- [Documentation Generation](./DOCS_GENERATION.md) — TSDoc to MDX generation

## How to Contribute

1.  Fork and clone the repo
2.  Run `corepack enable && yarn install` to install dependencies
3.  Create a branch for your PR with `git checkout -b pr-type/issue-number-your-branch-name`
4.  Let's get cooking! 👨🏻‍🍳🥓

You can also just [![Open in GitHub Codespaces](https://img.shields.io/static/v1?&message=Open%20in%20%20Codespaces&style=flat&colorA=000000&colorB=000000&label=GitHub&logo=github&logoColor=ffffff)](https://github.com/codespaces/new?template_repository=pmndrs%2Fdrei).

## Component Structure (v11)

Components now use a folder structure. See [Component-as-a-Folder](./MIGRATION_V10_TO_V11.md#component-as-a-folder-caaf-structure) in the migration guide.

```
src/core/Category/ComponentName/
  ├── index.ts
  ├── ComponentName.tsx
  ├── ComponentName.stories.tsx
  └── ComponentName.docs.mdx  # optional
```

> **Note:** The old flat structure (`src/core/Example.tsx`) is deprecated. New components should use the folder structure.

## Commit Guidelines

Be sure your commit messages follow this specification: https://www.conventionalcommits.org/en/v1.0.0-beta.4/

## Storybook

Every component needs a story. See the [Storybook Guide](../.storybook/README.md) for full details on:

- Platform switching (WebGL/WebGPU)
- Tags and badges
- Show code patterns
- Setup and decorators

Quick tips:

- Use args/controls for interactive configuration
- Keep stories simple — show the essence, not everything
- Keep assets minimal to avoid bloating the repo
- For platform-specific components, use tags (`legacyOnly`, `webgpuOnly`, `dual`)

## Publishing

See [Build & Publish Guide](./building/BUILD_AND_PUBLISH.md) for full details.

We use `semantic-release` to deploy the package. Commit messages determine the version bump:

- `fix:` → `0.0.x` (patch)
- `feat:` → `0.x.0` (minor)
- `BREAKING CHANGE:` → `x.0.0` (major)

Release branches: `master`, `beta`, `alpha`, `rc`, `canary-*`
