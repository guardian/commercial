#!/bin/bash

# Container images are tagged with the commit SHA. The latest main build is also tagged with "main"
# If you want to use a specific commit, provide this as an argument to this script
if [ ! $1 ]
 then TAG="main";
 else TAG="$1";
fi

# See https://github.com/guardian/dotcom-rendering/pkgs/container/dotcom-rendering for available images
IMAGE="ghcr.io/guardian/dotcom-rendering:$TAG"

echo "Pulling image $IMAGE"

# This script starts DCR in a Docker container using the dotcom-rendering main branch
# The container images are created via this workflow: https://github.com/guardian/dotcom-rendering/blob/18f4f9f6b861b04e2ad8deed82f442938e9f9197/.github/workflows/container.yml
/usr/bin/docker run -d \
    --network host \
    -p 3030:3030 \
    -e "PORT=3030" \
    -e "COMMERCIAL_BUNDLE_URL=http://localhost:3031/graun.standalone.commercial.js" \
    $IMAGE