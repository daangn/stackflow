#!/bin/bash

if [ -z "$1" ]; then
  echo "Error: Base branch not specified. Usage: publish-previews.sh <base-branch>"
  exit 1
fi

BASE_BRANCH=$1

# ensure we have the latest changes from the remote
git fetch origin

if ! git show-ref --verify --quiet refs/remotes/origin/"$BASE_BRANCH"; then
  echo "Error: Base branch '$BASE_BRANCH' not found in the remote repository."
  exit 1
fi

echo "Detecting changed packages and their dependents compared to $BASE_BRANCH..."

# Use Yarn's built-in workspace dependency graph to find changed packages + all transitive dependents
PUBLISH_PATHS=$(yarn workspaces list --since=origin/"$BASE_BRANCH" --recursive --no-private --json | node -e "
  const lines = require('fs').readFileSync('/dev/stdin', 'utf8').trim();
  if (!lines) process.exit(0);
  const paths = lines.split('\n').map(l => './' + JSON.parse(l).location);
  console.log(paths.join(' '));
")

if [ -z "$PUBLISH_PATHS" ]; then
  echo "No changed packages detected."
  exit 0
fi

echo "Publishing packages: $PUBLISH_PATHS"
yarn dlx pkg-pr-new publish --compact $PUBLISH_PATHS --packageManager yarn --template './demo'
