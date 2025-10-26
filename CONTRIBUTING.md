# Contribution Guide

## Setup

### Node.js

> **Stackflow** only supports maintained versions of [Node.js](https://nodejs.org).

### Install dependencies

Install the dependencies by entering the following command in the project root

```bash
$ bun install
```

> **Stackflow** uses [Bun](https://bun.sh) and Bun workspaces

### Build

Build all packages

```bash
$ bun run build
```

...or you can build each package using the `--filter` flag

```bash
# Build @stackflow/core
$ bun run --filter @stackflow/core build

# Build @stackflow/react
$ bun run --filter @stackflow/react build
```

### Getting started with `demo`

You can start your project in the `/demo` folder with the following command

```bash
$ bun run --filter @stackflow/demo dev:app
```

## Development mode

View the changes in the `demo` project for testing while editing other packages as follows:

```bash
$ bun run dev
```
