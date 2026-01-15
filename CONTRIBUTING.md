# Contributing

Thanks for wanting to make a contribution and wanting to improve this library for everyone! This repository uses Typescript so please continue to do so, you can always reach out in the repo or the [discord](https://pmnd.rs/discord). This is a guideline, use your initiative, if you don't think it makes sense to do a step in here, don't bother it's normally okay. we're chill.

## How to Contribute

1.  Fork and clone the repo
2.  Run `corepack enable && yarn install` to install dependencies
3.  Create a branch for your PR with `git checkout -b pr-type/issue-number-your-branch-name`
4.  Let's get cooking! 👨🏻‍🍳🥓

You can also just [![Open in GitHub Codespaces](https://img.shields.io/static/v1?&message=Open%20in%20%20Codespaces&style=flat&colorA=000000&colorB=000000&label=GitHub&logo=github&logoColor=ffffff)](https://github.com/codespaces/new?template_repository=pmndrs%2Fdrei).

## Example

You'll find a sample [`Example.tsx`](src/core/Example.tsx) component and its associated [`Example.stories.tsx`](.storybook/stories/Example.stories.tsx) to start with, as well as its documentation in the [`README`](README.md#example)

## Commit Guidelines

Be sure your commit messages are clear and descriptive. While we use Changesets for versioning (so conventional commits are not strictly required), clear commit messages are still appreciated.

## Storybook

If you're adding a brand new feature, you need to make sure you add a storybook entry, here's a few tips:

- Make use of `@storybook/addon-controls` to show component variants & configuration
- Keep the story simple & show the essence of the component, remember some people may be looking at using drei for the first time & it's important the stories are clear and concise.
- Keep assets minimal (3D Models, textures) to avoid bloating the repository
- If you think a more involved example is necessary, you can always add a codesandbox to the main README while keeping the story minimalistic

## Publishing

We use [Changesets](https://github.com/changesets/changesets) to manage versions and publishing.

When you make changes that should be published, run `yarn changeset` to create a changeset and commit it with your PR.

For detailed instructions on how to create changesets and how the release process works, see [`.changeset/README.md`](.changeset/README.md).
