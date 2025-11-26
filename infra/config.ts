import * as path from "path";

const lambda1 = {
    funPathReal: path.join( __dirname, "lambda"),  
    funName: "myLambda",
    nodeRuntime: "nodejs22.x",
    env: {
    	MESSAGE: "this text is second test",
	    message2: "this is the best message ever"
    } 
};


export const lambdaFunctions = [lambda1];
export const api = {
    resourcePath: "api",
    stage: "dev",
};

