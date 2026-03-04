#!/bin/bash

# This script automatically merges any open Dependabot PRs onto a single branch, for testing
BRANCHES=$(gh pr list --author "app/dependabot" --state open --json headRefName --jq '.[].headRefName')
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"

if [[ "$CURRENT_BRANCH" == "main" ]]; then
  echo 'You are on main, aborting script!';
  exit 1;
fi

for BRANCH in $BRANCHES
do
	git merge -s recursive -X theirs --no-edit $BRANCH
done
