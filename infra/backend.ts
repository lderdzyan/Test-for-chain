import { settings, lambda, api } from "./config";
import { Construct } from "constructs";
import { S3Backend } from "cdktf";
import { AwsProvider } from "./.gen/providers/aws/provider";
import { TerraformStack, Token, Fn, TerraformOutput } from "cdktf";
import { ApiGatewayIntegration } from "./.gen/providers/aws/api-gateway-integration";
import { ArchiveProvider } from "./.gen/providers/archive/provider";
import { ApiGatewayMethod } from "./.gen/providers/aws/api-gateway-method";
import { ApiGatewayResource } from "./.gen/providers/aws/api-gateway-resource";
import { ApiGatewayRestApi } from "./.gen/providers/aws/api-gateway-rest-api";
import { ApiGatewayStage } from "./.gen/providers/aws/api-gateway-stage";
import { ApiGatewayDeployment } from "./.gen/providers/aws/api-gateway-deployment";
import { DataAwsIamPolicyDocument } from "./.gen/providers/aws/data-aws-iam-policy-document";
import { DataArchiveFile } from "./.gen/providers/archive/data-archive-file";
import { IamRole } from "./.gen/providers/aws/iam-role";
import { LambdaFunction } from "./.gen/providers/aws/lambda-function";
import { LambdaPermission } from "./.gen/providers/aws/lambda-permission";
import { IamRolePolicy } from "./.gen/providers/aws/iam-role-policy";
import { IamRolePolicyAttachment } from "./.gen/providers/aws/iam-role-policy-attachment";
import { CloudwatchLogGroup } from "./.gen/providers/aws/cloudwatch-log-group";
import { ApiGatewayIntegrationResponse } from "./.gen/providers/aws/api-gateway-integration-response";
import { ApiGatewayMethodResponse } from "./.gen/providers/aws/api-gateway-method-response";

interface BackendStackProps {
  kmsKeyArn: string;
}

export class BackendStack extends TerraformStack {
  public readonly apiUrl: string;

  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id);

    new AwsProvider(this, "aws", {});
    new ArchiveProvider(this, "archive", {});

    new S3Backend(this, {
      bucket: "thisisfortestingterraformstate",
      key: "backend/terraform.tfstate",
    });

    const myRollDoc = new DataAwsIamPolicyDocument(this, "myRollDoc", {
      statement: [
        {
          actions: ["sts:AssumeRole"],
          effect: "Allow",
          principals: [{ identifiers: ["lambda.amazonaws.com"], type: "Service" }],
        },
      ],
    });

    const myRole = new IamRole(this, "myRole", {
      assumeRolePolicy: Token.asString(myRollDoc.json),
      name: `myRole-${Date.now()}`,
    });

    new IamRolePolicyAttachment(this, `${lambda.funName}role`, {
      policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
      role: myRole.name,
    });

    new IamRolePolicy(this, `${lambda.funName}KmsPolicy`, {
      role: myRole.name,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "kms:Encrypt",
              "kms:Decrypt",
              "kms:GenerateDataKey*",
              "kms:DescribeKey",
            ],
            Resource: props.kmsKeyArn,
          },
        ],
      }),
    });


    new CloudwatchLogGroup(this, `${lambda.funName}LogGroup`, {
      name: `/aws/lambda/${lambda.funName}`,
      retentionInDays: 14,
      kmsKeyId: props.kmsKeyArn, 
    });


    const myZip = new DataArchiveFile(this, `${lambda.funName}zip`, {
      outputPath: lambda.funName,
      sourceDir: lambda.funPathReal,
      type: "zip",
    });

    const myLambda = new LambdaFunction(this, `${lambda.funName}lambda`, {
      filename: myZip.outputPath,
      functionName: lambda.funName,
      handler: "index.handler",
      role: myRole.arn,
      runtime: lambda.nodeRuntime,
      environment: { variables: lambda.env },
      kmsKeyArn: props.kmsKeyArn, 
    });

    const myApi = new ApiGatewayRestApi(this, "myApi", { name: "my_api" });
    const myResource = new ApiGatewayResource(this, "myResource", {
      parentId: myApi.rootResourceId,
      pathPart: api.resourcePath,
      restApiId: myApi.id,
    });

    const myMethod = new ApiGatewayMethod(this, "myMethod", {
      authorization: "NONE",
      httpMethod: "ANY",
      resourceId: myResource.id,
      restApiId: myApi.id,
    });

    const myLambdaPermission = new LambdaPermission(this, `${lambda.funName}perm`, {
      action: "lambda:InvokeFunction",
      functionName: myLambda.functionName,
      principal: "apigateway.amazonaws.com",
      sourceArn: `arn:aws:execute-api:${settings.myRegion}:${settings.profile}:${myApi.id}/*/*${myResource.path}`,
      statementId: "AllowExecutionFromAPIGateway",
    });

    const myIntegration = new ApiGatewayIntegration(this, `${lambda.funName}integration`, {
      httpMethod: myMethod.httpMethod,
      resourceId: myResource.id,
      restApiId: myApi.id,
      type: "AWS_PROXY",
      integrationHttpMethod: "POST",
      uri: myLambda.invokeArn,
    });

    myIntegration.node.addDependency(myLambdaPermission);


    const optionsMethod = new ApiGatewayMethod(this, "optionsMethod", {
      authorization: "NONE",
      httpMethod: "OPTIONS",
      resourceId: myResource.id,
      restApiId: myApi.id,
    });

    const optionsIntegration = new ApiGatewayIntegration(this, "optionsIntegration", {
      restApiId: myApi.id,
      resourceId: myResource.id,
      httpMethod: optionsMethod.httpMethod,
      type: "MOCK",
      integrationHttpMethod: "POST",
      requestTemplates: { "application/json": "{\"statusCode\": 200}" },
      passthroughBehavior: "WHEN_NO_MATCH",
    });

    const optionsMethodResponse = new ApiGatewayMethodResponse(this, "optionsMethodResponse", {
      restApiId: myApi.id,
      resourceId: myResource.id,
      httpMethod: optionsMethod.httpMethod,
      statusCode: "200",
      responseParameters: {
        "method.response.header.Access-Control-Allow-Headers": true,
        "method.response.header.Access-Control-Allow-Methods": true,
        "method.response.header.Access-Control-Allow-Origin": true,
      },
      responseModels: { "application/json": "Empty" },
    });

    optionsIntegration.node.addDependency(optionsMethod);

    const optionsIntegrationResponse = new ApiGatewayIntegrationResponse(
      this,
      "optionsIntegrationResponse",
      {
        restApiId: myApi.id,
        resourceId: myResource.id,
        httpMethod: optionsMethod.httpMethod,
        statusCode: "200",
        responseParameters: {
          "method.response.header.Access-Control-Allow-Headers":
            "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
          "method.response.header.Access-Control-Allow-Methods": "'GET,OPTIONS'",
          "method.response.header.Access-Control-Allow-Origin": "'*'",
        },
      }
    );

    optionsIntegrationResponse.addOverride("depends_on", [
      "aws_api_gateway_integration.optionsIntegration",
    ]);

    optionsIntegrationResponse.node.addDependency(optionsIntegration);
    optionsIntegrationResponse.node.addDependency(optionsMethodResponse);
    optionsMethodResponse.node.addDependency(optionsIntegration);


    const myDeploy = new ApiGatewayDeployment(this, "myDeploy", {
      lifecycle: { createBeforeDestroy: true },
      restApiId: myApi.id,
      triggers: {
        redeployment: Fn.sha1(
          Fn.jsonencode({
            resource: myResource.pathPart,
            optIntRes: optionsIntegrationResponse.id,
            optInt: optionsIntegration.id,
            mainInt: myIntegration.id,
          })
        ),
      },
    });

    myDeploy.node.addDependency(myMethod);
    myDeploy.node.addDependency(myIntegration);
    myDeploy.node.addDependency(optionsMethod);
    myDeploy.node.addDependency(optionsIntegrationResponse);
    myDeploy.node.addDependency(optionsIntegration);
    myDeploy.node.addDependency(optionsMethodResponse);

    const myStage = new ApiGatewayStage(this, "myStage", {
      deploymentId: Token.asString(myDeploy.id),
      restApiId: myApi.id,
      stageName: api.stage,
    });

    this.apiUrl = `https://${myApi.id}.execute-api.${settings.myRegion}.amazonaws.com/${myStage.stageName}/${myResource.pathPart}`;

    new TerraformOutput(this, "api_uri", { value: this.apiUrl });
  }
}
