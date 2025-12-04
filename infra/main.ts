import {BackendStack} from "./backend"
import {FrontendStack} from "./frontend"
import {KmsStack} from "./kms"
import { App } from "cdktf";

const app = new App();


const backendStack = new BackendStack(app, "backend");

const kmsStack = new KmsStack(app,"kms");

new FrontendStack(app,"frontend",{
  backendApiUrl: backendStack.apiUrl,
  kmsKeyArn: kmsStack.kmsKey.arn
});
app.synth();
