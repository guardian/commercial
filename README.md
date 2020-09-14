# @guardian/commercial-core

[![npm (scoped)](https://img.shields.io/npm/v/@guardian/commercial-core)](https://www.npmjs.com/package/@guardian/commercial-core)
[![ES version](https://badgen.net/badge/ES/2020/cyan)](https://tc39.es/ecma262/2020/)
[![npm type definitions](https://img.shields.io/npm/types/@guardian/commercial-core)](https://www.typescriptlang.org/)
[![Coverage Status](https://coveralls.io/repos/github/guardian/commercial-core/badge.svg)](https://coveralls.io/github/guardian/commercial-core)

> Guardian advertising business logic

## Installation

[![Generic badge](https://img.shields.io/badge/google-chat-259082.svg)](https://chat.google.com/room/AAAAPL2MBvE)

```bash
yarn add @guardian/commercial-core
```

or

```bash
npm install @guardian/commercial-core
```

## Usage

This package is built targeting `ES2020`.

If your target environment is older than that, make sure your bundler includes this package for transpilation when building your application.

## Development

### Requirements

1. [Node 14](https://nodejs.org/en/download/) ([nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm) recommended)
2. [Yarn](https://classic.yarnpkg.com/en/docs/install/)

### Continuous delivery to NPM

Pushing to `main` will automatically trigger a package release if the commit message follows the [conventional commits](https://www.conventionalcommits.org) format.

To help writing conventional commits, this repo uses [commitzen](https://github.com/commitizen/cz-cli) to intercept commits and act as the message editor.

Use `git commit` as normal and follow the prompts:

<img src="https://user-images.githubusercontent.com/867233/92921122-65635080-f42b-11ea-86b1-93a82c1f156b.png" width=613 />

> Note that this will not happen if you _commit_ changes with a GUI e.g. the GitHub Desktop app. However, you can use one as normal for staging changes etc and use `git commit` in the terminal to commit.

If a commit is not in a conventional commit format, it will not trigger a release and your change will stay in `main` until the next release.

If this is something you want, you can `ctrl-c` out of it the commitzen editor and the `git commit` command will continue as normal.
