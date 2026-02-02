# Changesets

This folder contains changeset files that describe changes to be released.

## What is a Changeset?

A changeset is a description of changes made in a pull request. It helps automate version bumps and changelog generation.

## How to create a Changeset

When you make changes that should be published to npm, run:

```bash
yarn changeset
```

This will:
1. Prompt you to select the type of change:
   - `patch`: Bug fixes and minor changes (0.0.x)
   - `minor`: New features (0.x.0)
   - `major`: Breaking changes (x.0.0)
2. Ask for a description of the changes
3. Generate a markdown file in `.changeset/` that you commit with your PR

## Release Process

When PRs with changesets are merged to `master`:
1. The Changesets GitHub Action creates a "Version Packages" PR
2. This PR updates version numbers and changelogs
3. When merged, the packages are automatically published to npm

For more information, see the [Changesets documentation](https://github.com/changesets/changesets).
