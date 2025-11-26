import { settings,lambdaFunctions,api } from "./config"
import { Construct } from "constructs";
import { AwsProvider } from "./.gen/providers/aws/provider"
import { TerraformStack,Token , Fn, TerraformOutput } from "cdktf";
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
import { IamRolePolicyAttachment } from "./.gen/providers/aws/iam-role-policy-attachment";
import { ApiGatewayIntegrationResponse } from "./.gen/providers/aws/api-gateway-integration-response";
import { ApiGatewayMethodResponse } from "./.gen/providers/aws/api-gateway-method-response";

export class BackendStack extends TerraformStack {
  public readonly apiUrl: string;
  constructor(scope: Construct, id: string) {
    super(scope, id);
	

	new AwsProvider(this,"aws",{});

	new ArchiveProvider(this, "archive", {});
	


	const myRollDoc = new DataAwsIamPolicyDocument(this, "myRollDoc", {
                statement: [
                        {
                        actions: ["sts:AssumeRole"],
                        effect: "Allow",
                        principals: [
                                {
                                        identifiers: ["lambda.amazonaws.com"],
                                        type: "Service",
                                        },
                                 ],
                                },
                         ],
        });


        const myRole = new IamRole(this,"myRole",{
                assumeRolePolicy:  Token.asString(myRollDoc.json),
                name: "myRole"
        });

	const myApi = new ApiGatewayRestApi(this,"myApi", {
		name: "my_api"
	});

	const myResource = new ApiGatewayResource(this,"myResource",{
		parentId: myApi.rootResourceId,
		pathPart: api.resourcePath,
		restApiId: myApi.id
	});

	const myMethod = new ApiGatewayMethod(this,"myMethod",{
		authorization: "NONE",
	        httpMethod: "ANY",
		resourceId: myResource.id,
		restApiId: myApi.id
	});

	for (const lambda of lambdaFunctions){
	
		const myZip = new DataArchiveFile(this,`${lambda.funName}zip`,{
			outputPath: lambda.funName,
			sourceDir: lambda.funPathReal,
			type: "zip"
		});

		
        	const myLambda = new LambdaFunction(this,`${lambda.funName}lambda`, {
                	filename: myZip.outputPath,
                	functionName: lambda.funName,
                	handler: "index.handler",
	                role:  myRole.arn,
        	        runtime: lambda.nodeRuntime,
        	        environment: {
                	        variables:lambda.env
                        	 }
        	});

		new LambdaPermission(this, `${lambda.funName}perm`, {
      			action: "lambda:InvokeFunction",
      			functionName: myLambda.functionName,
      			principal: "apigateway.amazonaws.com",
      			sourceArn: `arn:aws:execute-api:${settings.myRegion}:${settings.profile}:${myApi.id}/*/*/*`,
     	 		statementId: "AllowExecutionFromAPIGateway",
   		 });

		new ApiGatewayIntegration(this,`${lambda.funName}integration`,{
			httpMethod: myMethod.httpMethod,
			resourceId: myResource.id,
			restApiId: myApi.id,
			type: "AWS_PROXY",
			integrationHttpMethod: "POST",
                	uri: myLambda.invokeArn,
       		});

        	new IamRolePolicyAttachment(this, `${lambda.funName}role`, {
                	policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
        	        role: myRole.name,
	        });

	}

	
	const optionsMethod = new ApiGatewayMethod(this,"optionsMethod",{
                authorization: "NONE",
                httpMethod: "OPTIONS",
                resourceId: myResource.id,
                restApiId: myApi.id
        });

    let optionsIntegration = new ApiGatewayIntegration(this, "OptionsIntegration", {
                restApiId: myApi.id,
                resourceId: myResource.id,
                httpMethod: optionsMethod.httpMethod,
                type: "MOCK",
                requestTemplates: {
                        "application/json": '{"statusCode": 200}',
                },
        });
    
	let corsResponse = new ApiGatewayIntegrationResponse(this,"corsResponse",{
		restApiId: myApi.id,
		resourceId: myResource.id,
		httpMethod: optionsMethod.httpMethod,
		statusCode: "200",
		
		responseParameters : {
			"method.response.header.Access-Control-Allow-Headers" : "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
		  	"method.response.header.Access-Control-Allow-Methods" : "'GET,OPTIONS'",
    			"method.response.header.Access-Control-Allow-Origin"  : "'*'"
		}	
	});

    corsResponse.node.addDependency(optionsMethod);
    corsResponse.node.addDependency(optionsIntegration);
	new ApiGatewayMethodResponse(this,"methodResponse",{
		 restApiId: myApi.id,
                resourceId: myResource.id,
                httpMethod: optionsMethod.httpMethod,
                statusCode: "200", 

		responseModels: {
   			 "application/json" : "Empty"
 		},

            	responseParameters : {
                        "method.response.header.Access-Control-Allow-Headers" : true,
                        "method.response.header.Access-Control-Allow-Methods" : true,
                        "method.response.header.Access-Control-Allow-Origin"  : true
                }
	});

	const myDeploy = new ApiGatewayDeployment(this , "myDeploy", {
        	lifecycle: {
          		createBeforeDestroy: true,
        	},
        	restApiId: myApi.id,
        	triggers: {
          	redeployment: Token.asString(
            		Fn.sha1(
              			Token.asString(
                			Fn.jsonencode([
                				myResource.pathPart,

					])
           			   )
            		)
          	),
        	},
     	 });

    myDeploy.node.addDependency(corsResponse);
    myDeploy.node.addDependency(myMethod);
    myDeploy.node.addDependency(optionsMethod);
    myDeploy.node.addDependency(optionsIntegration);

	const myStage = new ApiGatewayStage(this, "myStage", {
      		deploymentId: Token.asString(myDeploy.id),
      		restApiId: myApi.id,
      		stageName: api.stage,
    	});

    this.apiUrl = `https://${myApi.id}.execute-api.${settings.myRegion}.amazonaws.com/${myStage.stageName}/${myResource.pathPart}`;
    
        new TerraformOutput(this,"api_uri", {
      value: this.apiUrl
    });


  }
}