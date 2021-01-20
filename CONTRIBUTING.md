# Contributing

Thanks for wanting to make a contribution and wanting to improve this library for everyone! This repository uses Typescript so please continue to do so, you can always reach out in the repo or the [discord](https://discord.gg/9JrR3ZqG)

## How to Contribute

1.  Fork and clone the repo
2.  Run `npm install` to install dependencies
3.  Create a branch for your PR with `git checkout -b pr-type/issue-number-your-branch-name beta
4.  Let's get cooking! 👨🏻‍🍳🥓

## Commit Guidelines

Be sure your commit messages follow this specification: https://www.conventionalcommits.org/en/v1.0.0-beta.4/

## Storybook

If you're adding a brand new feature, you need to make sure you add a storybook entry. Storybook has `@storybook/addon-knobs` installed, so make use of them to show off. The most important thing about a story is to be simple & show the essence of the component, remember some people may be looking at using `drei` for the first time & it's important the stories are clear and concise.

If you want to make a more advanced example why not create a codesandbox & be sure to make use of [`use-tweaks`](https://github.com/pmndrs/use-tweaks)!

## Publishing

To publish a new version:

```
npm publish
```

To publish a **beta** version:

```
npm publish --tag beta
```
