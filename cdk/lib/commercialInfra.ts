import { GuStack, type GuStackProps } from "@guardian/cdk/lib/constructs/core";
import { GuDeveloperPolicy } from "@guardian/cdk/lib/constructs/iam";
import type { App } from "aws-cdk-lib";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { StringParameter } from "aws-cdk-lib/aws-ssm";

export class CommercialInfra extends GuStack {
  constructor(scope: App, id: string, props: GuStackProps) {
    super(scope, id, {
      env: { region: 'eu-west-1' },
      stack: props.stack,
      stage: props.stage
    });

    const artifactsAccountId = StringParameter.valueForStringParameter(
      this,
      "/organisation/accounts/artifacts"
    );

    new GuDeveloperPolicy(
      this,
      "RunDCRLocallyPolicy",
      {
        grantId: "commercial-dcr-dev",
        friendlyName: "Run DCR locally for development on the commercial bundle",
        statements: [
          this.getAuthorisationToken(),
          this.batchGetImage(artifactsAccountId),
          this.getArtifactsSsmParameter()
        ]
      }
    )
  }

  /**
   * Allows fetching an authorisation token for interacting with ECR
   */
  private getAuthorisationToken() {
    return new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['ecr:GetAuthorizationToken'],
      resources: ["*"]
    });
  }

  /**
   * Allows batch fetching ECR images for the dotcom-rendering app
   */
  private batchGetImage(artifactsAccountId: string) {
    return new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['ecr:BatchGetImage'],
      resources: [
        `arn:aws:ecr:${this.region}:${artifactsAccountId}:repository/guardian/dotcom-rendering`]
    });
  }

  /**
   * Allows fetching the SSM parameteer for org artifacts
   */
  private getArtifactsSsmParameter() {
    return new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['ssm:GetParameter'],
      resources: [`arn:aws:ssm:${this.region}:${this.account}:parameter/organisation/accounts/artifacts`]
    });
  }
}