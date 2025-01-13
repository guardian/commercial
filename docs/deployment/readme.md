# Deployment

## This repo
When building in production, as well as generating bundle javascripts, cloudformation for updating a key in parameter store is created. This key is used by the frontend to determine the path to the commercial bundle.

This is neccessary as the production bundle files have a hash in their paths for cache busting, so the path is not the same for each build.

As part of the CI process a build is created in riff-raff with the javascripts and cloudformation. When deployment is initiated in riff-raff (automatically on prod, or manually for PRs on CODE) the javascripts are uploaded to the dotcom static S3 bucket, and the cloudformation updating the bundlepath is executed.

## Frontend
[Frontend](https://github.com/guardian/frontend/blob/main/common/app/common/CommercialBundle.scala) perioducally checks the parameter store for the path to the commercial bundle, caching it for 1 minute. This is to avoid hitting the parameter store on every request.
