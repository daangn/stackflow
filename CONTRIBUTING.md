# Contribution Guide

## Setup

### Node.js

> **Stackflow** only supports maintained versions of [Node.js](https://nodejs.org).

### Install dependencies

Install the dependencies by entering the following command in the project root

```bash
$ yarn
```

> **Stackflow** uses [Yarn 3](https://yarnpkg.com) and Yarn workspace

### Build

Build all packages

```bash
$ yarn build
```

...or you can build each packages by `yarn workspace` command

```bash
# Build @stackflow/core
$ yarn workspace @stackflow/core build

# Build @stackflow/react
$ yarn workspace @stackflow/react build
```

### Getting started with `demo`

You can start your project in the `/demo` folder with the following command

```bash
$ yarn workspace @stackflow/demo dev:app
```

## Development mode

View the changes in the `demo` project for testing while editing other packages as follows:

```bash
$ yarn dev
```
