# @guardian/commercial-core

[![npm (scoped)](https://img.shields.io/npm/v/@guardian/commercial-core)](https://www.npmjs.com/package/@guardian/commercial-core)
[![ES version](https://badgen.net/badge/ES/2020/cyan)](https://tc39.es/ecma262/2020/)
[![npm type definitions](https://img.shields.io/npm/types/@guardian/commercial-core)](https://www.typescriptlang.org/)
[![Coverage Status](https://coveralls.io/repos/github/guardian/commercial-core/badge.svg)](https://coveralls.io/github/guardian/commercial-core)

> Guardian advertising business logic

## Table of contents

<!-- START doctoc -->
<!-- END doctoc -->

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

This package is published in `ES2020`.

If your target environment does not support that, make sure you transpile this package when bundling your application.

## Development

### Requirements

1. [Node 14](https://nodejs.org/en/download/) ([nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm) recommended)
2. [Yarn](https://classic.yarnpkg.com/en/docs/install/)

### Commit messages and releasing to NPM

_tl;dr_

-   prefer `yarn commit` to `git commit`
-   continuous delivery to NPM

#### Details

This repo uses [semantic-release](https://semantic-release.gitbook.io/) to automatically publish to NPM if you push suitable changes to `main` (e.g. a new feature).

The version will be derived from the commit history, using [the conventional commit format](https://www.conventionalcommits.org/en/v1.0.0/#specification).

Running `yarn commit` automates writing a well-formatted commit message with [commitizen](https://github.com/commitizen/cz-cli), which will prompt you for details then commit any staged changes.

> Alternatively, you can also [install commitizen globally](https://github.com/commitizen/cz-cli#installing-the-command-line-tool).

If you use `git commit` as normal, a `commit-msg` hook will ensure that your commit meets the convention, but won't help you write it.
