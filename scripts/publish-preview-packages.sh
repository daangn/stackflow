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

echo "Detecting changed packages compared to $BASE_BRANCH..."

# Get changes from all relevant directories
CHANGED_PATHS=$(git diff --name-only origin/"$BASE_BRANCH"...HEAD | grep -E '^(config|core|extensions/|integrations/|packages/)' | sort -u)

if [ -z "$CHANGED_PATHS" ]; then
  echo "No changed packages detected."
  exit 0
fi

# Process each changed path and format it for publishing
PUBLISH_PATHS=""
while IFS= read -r path; do
  case "$path" in
    config/*|core/*)
      # For config and core, include the first directory
      dir=$(echo "$path" | cut -d '/' -f 1)
      if [[ ! "$PUBLISH_PATHS" =~ "./$dir " ]]; then
        PUBLISH_PATHS+="./$dir "
      fi
      ;;
    extensions/*|integrations/*|packages/*)
      # For extensions, integrations, and packages, include the full path up to the second level
      dir=$(echo "$path" | cut -d '/' -f 1-2)
      if [[ ! "$PUBLISH_PATHS" =~ "./$dir " ]]; then
        PUBLISH_PATHS+="./$dir "
      fi
      ;;
  esac
done <<< "$CHANGED_PATHS"

# Remove trailing space
PUBLISH_PATHS="${PUBLISH_PATHS% }"

if [ -n "$PUBLISH_PATHS" ]; then
  echo "Publishing changed packages: $PUBLISH_PATHS"
  bun x pkg-pr-new publish --compact $PUBLISH_PATHS --packageManager bun --template './demo'
else
  echo "No publishable packages found."
  exit 0
fi