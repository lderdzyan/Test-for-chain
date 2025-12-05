import { TerraformStack } from "cdktf";
import { Construct } from "constructs";
import { AwsProvider } from "./.gen/providers/aws/provider";
import { KmsKey } from "./.gen/providers/aws/kms-key";
import { DataAwsCallerIdentity } from "./.gen/providers/aws/data-aws-caller-identity";

export class KmsStack extends TerraformStack {
  public readonly kmsKey: KmsKey;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    new AwsProvider(this, "aws_kms", {});

    const account = new DataAwsCallerIdentity(this, "account");
    const region = process.env.AWS_REGION;

    this.kmsKey = new KmsKey(this, "projectKmsKey", {
      description: "Master KMS key",
      enableKeyRotation: true,
      deletionWindowInDays: 7,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "EnableRootPermissions",
            Effect: "Allow",
            Principal: {
              AWS: `arn:aws:iam::${account.accountId}:root`,
            },
            Action: "kms:*",
            Resource: "*",
          },


          {
            Sid: "AllowAWSAccountServices",
            Effect: "Allow",
            Principal: { AWS: "*" },
            Action: [
              "kms:Encrypt",
              "kms:Decrypt",
              "kms:ReEncrypt*",
              "kms:GenerateDataKey*",
              "kms:DescribeKey"
            ],
            Resource: "*",
            Condition: {
              StringEquals: {
                "kms:CallerAccount": account.accountId,
                "kms:ViaService": [
                  `s3.${region}.amazonaws.com`,
                  `lambda.${region}.amazonaws.com`,
                  `logs.${region}.amazonaws.com`
                ]
              }
            }
          }
        ],
      }),
    });
  }
}


