#!/bin/bash

# Example usage:
# ./bump_commercial.sh 10.8.0

set -e

VERSION=$1

# Just to de-dupe branch names
RAND=$(openssl rand -hex 6)
BRANCH_NAME="$RAND/bump-commercial-$VERSION"
REPO="@guardian/commercial"

cd ~/code/frontend
fnm use

git checkout main
git pull origin main

git checkout -b "$BRANCH_NAME"
pnpm upgrade "$REPO@$VERSION"

# fix the flip flopping Prebid
pnpm cache clean @guardian/prebid.js
pnpm install --force

git add package.json pnpm-lock.yaml

git commit -m "Bump commercial to $VERSION"

git push origin "$BRANCH_NAME"

gh pr create \
  -t "Bump commercial to $VERSION" \
  -b "Bring in the changes from [$VERSION](https://github.com/guardian/commercial/releases/tag/v$VERSION)" \
  -l "commercial"
