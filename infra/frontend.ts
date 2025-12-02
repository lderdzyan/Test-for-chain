
import { Construct } from "constructs";
import { AwsProvider } from "./.gen/providers/aws/provider";
import { S3Backend } from "cdktf";
import { TerraformStack,Token} from "cdktf";
import { CloudfrontDistribution } from "./.gen/providers/aws/cloudfront-distribution";
import { CloudfrontOriginAccessControl } from "./.gen/providers/aws/cloudfront-origin-access-control";
import { DataAwsIamPolicyDocument } from "./.gen/providers/aws/data-aws-iam-policy-document";
import { S3Bucket } from "./.gen/providers/aws/s3-bucket";
import { S3BucketPolicy } from "./.gen/providers/aws/s3-bucket-policy";
import { S3Object } from "./.gen/providers/aws/s3-object";
import * as fs from "fs";


import "dotenv/config";

import * as path from "path";

interface FrontendStackProps {
  backendApiUrl: string;
}

export class FrontendStack extends TerraformStack {
    constructor(scope:Construct, id: string,props: FrontendStackProps){
	super(scope,id);

		const backendApiUrl = props.backendApiUrl;  
        new AwsProvider(this,"aws",{});

		
    new S3Backend(this, {
      bucket: "thisisfortestingterraformstate",
      key: "frontend/terraform.tfstate",
    });
	const myBucket = new  S3Bucket(this,"myBucket",{
		bucket: "securitytestbucket"
	});
	
	const myOac = new CloudfrontOriginAccessControl(this,"myOac",{
		name: `myOacfortestwillchange`,
		originAccessControlOriginType: "s3",
	        signingBehavior: "always",
      		signingProtocol: "sigv4",
	});

	const myCloudfront = new CloudfrontDistribution(this,"myCloudfront",{
	    defaultCacheBehavior: {
       		 allowedMethods: [
        	  	"DELETE",
          		"GET",
          		"HEAD",
          		"OPTIONS",
          		"PATCH",
          		"POST",
          		"PUT",
  		      ],
       		 cachedMethods: ["GET", "HEAD"],
        	defaultTtl: 3600,
        	forwardedValues: {
          			cookies: {
           				 forward: "none",
          			},
          		queryString: false,
        		},
        	maxTtl: 86400,
       		minTtl: 0,
        	targetOriginId: myBucket.id,
        	viewerProtocolPolicy: "allow-all",
      		},
	    defaultRootObject: "index.html",
            enabled: true,
	    origin: [{
	    	domainName: myBucket.bucketRegionalDomainName,
		originAccessControlId: myOac.id,
		originId: myBucket.id
	    }],
	    restrictions: {
    		geoRestriction: {
        		restrictionType : "none"
   		 }
 	    },
	    viewerCertificate: {
    			cloudfrontDefaultCertificate : true
	 }

	});
	const myBucketPolicy = new DataAwsIamPolicyDocument(this,"myBucketPolicy",
      		{
        		statement: [
         			 {
            			actions: ["s3:GetObject"],
            			condition: [
             				{
                			test: "StringEquals",
                			values: [myCloudfront.arn],
                			variable: "AWS:SourceArn",
              				},
            			],
            			effect: "Allow",
            			principals: [
             	 			{
               	 			identifiers: ["cloudfront.amazonaws.com"],
                			type: "Service",
              				},
            			],
            			resources: [`${myBucket.arn}/*`],
            			sid: "AllowCloudFrontServicePrincipalReadWrite",
          			},
        		],
   	});

	new S3BucketPolicy(this,"myS3Policy",{
		bucket: myBucket.bucket,
		policy: Token.asString(myBucketPolicy.json)
	});

 	const appJsPath = path.join(__dirname,"..", "src", "app.js");
    let appJsContent = fs.readFileSync(appJsPath, "utf8");
    appJsContent = appJsContent.replace('"APIURL"', `"${backendApiUrl}"`);


	new S3Object(this,"index",{
		bucket: myBucket.bucket,
		key: "index.html",
		source: path.join(__dirname,"..","src", "index.html"),
		contentType: "text/html"
	});

	new S3Object(this,"app",{
		bucket:myBucket.bucket,
		key:"app.js",
		content: appJsContent,
		contentType: "text/javascript"
	});   
  }
}
