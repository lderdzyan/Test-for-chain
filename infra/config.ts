import * as path from "path";

export const settings = {
  myRegion: process.env.AWS_REGION!,
  profile: process.env.PROFILEINFO!,
};

export const lambda = {
    funPathReal: path.join( __dirname,"..","src", "lambda"),  
    funName: "myLambda",
    nodeRuntime: "nodejs22.x",
    env: {
    	MESSAGE: "this text is second test ",
	    message2: "this is the  best message ever"
    } 
};



export const api = {
    resourcePath: "api",
    stage: "dev",
};

