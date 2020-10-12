# @guardian/commercial-core

[![npm (scoped)](https://img.shields.io/npm/v/@guardian/commercial-core)](https://www.npmjs.com/package/@guardian/commercial-core)
[![minzipped (scoped)](https://badgen.net/bundlephobia/minzip/@guardian/commercial-core)](https://bundlephobia.com/result?p=@guardian/commercial-core)
[![ES version](https://badgen.net/badge/ES/2020/cyan)](https://tc39.es/ecma262/2020/)
[![npm type definitions](https://img.shields.io/npm/types/@guardian/commercial-core)](https://www.typescriptlang.org/)
[![Coverage Status](https://coveralls.io/repos/github/guardian/commercial-core/badge.svg)](https://coveralls.io/github/guardian/commercial-core)

> Guardian advertising business logic

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

## Table of contents

-   [Installation](#installation)
    -   [Bundling](#bundling)
-   [Development](#development)
    -   [Requirements](#requirements)
    -   [Commit messages and releasing to NPM](#commit-messages-and-releasing-to-npm)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Installation

[![Generic badge](https://img.shields.io/badge/google-chat-259082.svg)](https://chat.google.com/room/AAAAPL2MBvE)

```bash
yarn add @guardian/commercial-core
```

or

```bash
npm install @guardian/commercial-core
```

### Bundling

This package uses `ES2020`.

If your target environment does not support that, make sure you transpile this package when bundling your application.

## Development

### Requirements

1. [Node 14](https://nodejs.org/en/download/) ([nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm) recommended)
2. [Yarn](https://classic.yarnpkg.com/en/docs/install/)

### Releases

Commits that are merged to `main` on GitHub will be analysed by [semantic-release](https://semantic-release.gitbook.io/).

If the commit messages follow the [conventional commit format](https://www.conventionalcommits.org/en/v1.0.0), semantic-release will determine what types of changes are included.

If necessary, it will then automatically release a new, [semver](https://semver.org/)-compliant version of the package to NPM.
