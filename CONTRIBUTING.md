# Contribution Guide

## Setup

### Install dependencies

Install the dependencies by entering the following command in the project root

```bash
$ yarn
```

> Karrotframe uses [Yarn 3](https://yarnpkg.com) and Yarn workspace

### Build

Build all packages

```bash
$ yarn build
```

...or you can build each packages by `yarn workspace` command

```bash
# Build @karrotframe/navigator
$ yarn workspace @karrotframe/navigator build

# Build @karrotframe/tabs
$ yarn workspace @karrotframe/tabs build
```

### Getting started with `example-spec`

You can start your project in the `/examples/spec` folder with the following command

```bash
$ yarn workspace example-spec start
```

### Example: View the changes in the `example-spec` project for testing while editing `@karrotframe/navigator` as follows:

```bash
$ yarn workspace example-spec start

# In a new terminal window
$ yarn workspace @karrotframe/navigator dev
```
