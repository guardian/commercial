#!/bin/bash

# This script starts DCR in a Docker container.
# The image is pulled from AWS ECR. It is created via this workflow: https://github.com/guardian/dotcom-rendering/blob/main/.github/workflows/container-production.yml.

# By default, the image from `main` is used.
# If you want to use a specific branch, provide this as an argument to this script.
# Alternative identifiers are listed in the comments of PRs to `guardian/dotcom-rendering`.
# NOTE: Include any leading `:` or `@` too.
IMAGE_IDENTIFIER="${1:-":branch-main"}"

check_credentials() {
	echo "Checking AWS credentials"
	if ! aws sts get-caller-identity --profile frontend >/dev/null 2>&1; then
		echo "❌ Credentials for the frontend profile are invalid or unavailable. Please fetch new credentials before trying again."
		exit 1
	fi
	echo "✅ AWS credentials for frontend are valid."
}

pull_and_run_dcr() {
	IMAGE_ACCOUNT_ID=$(aws ssm get-parameter --name /organisation/accounts/artifacts --profile frontend --region eu-west-1 --query "Parameter.Value" --output text)
	REGISTRY="${IMAGE_ACCOUNT_ID}.dkr.ecr.eu-west-1.amazonaws.com"
	IMAGE="${REGISTRY}/guardian/dotcom-rendering${IMAGE_IDENTIFIER}"

	# Login to AWS ECR https://docs.aws.amazon.com/AmazonECR/latest/userguide/registry_auth.html
	aws ecr get-login-password --profile frontend --region eu-west-1 | docker login --username AWS --password-stdin $REGISTRY

	echo "Pulling image $IMAGE"
	docker pull $IMAGE

	# GU_STAGE=CI configures DCR to reference JS assets from the local server, rather than the CDN.
	docker run -d \
		--network host \
		-e "PORT=3030" \
		-e "GU_APP=article-rendering" \
		-e "GU_STACK=frontend" \
		-e "GU_STAGE=CI" \
		-e "DISABLE_LOGGING_AND_METRICS=true" \
		-e "COMMERCIAL_BUNDLE_URL=http://localhost:3031/graun.standalone.commercial.js" \
		$IMAGE
}

main() {
	check_credentials
	pull_and_run_dcr
}

main
