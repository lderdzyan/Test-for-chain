import { TerraformStack} from "cdktf";
import { Construct } from "constructs";
import { KmsKey } from "./.gen/providers/aws/kms-key";
import { DataAwsCallerIdentity } from "./.gen/providers/aws/data-aws-caller-identity";

export class KmsStack extends TerraformStack {
  public readonly kmsKey: KmsKey;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    new AwsProvider(this, "aws_kms", {
      region: "eu-central-1"
    });

    const account = new DataAwsCallerIdentity(this, "account");

    this.kmsKey = new KmsKey(this, "projectKmsKey", {
      description: "Master KMS key",
      enableKeyRotation: true,
      deletionWindowInDays: 7,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "Enable IAM User Permissions",
            Effect: "Allow",
            Principal: {
              AWS: `arn:aws:iam::${account.accountId}:root`
            },
            Action: "kms:*",
            Resource: "*"
          }
        ]
      })
    });
  }
}
