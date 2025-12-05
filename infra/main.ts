import {BackendStack} from "./backend"
import {FrontendStack} from "./frontend"
import {KmsStack} from "./kms"
import { App } from "cdktf";

const app = new App();

const kmsStack = new KmsStack(app,"kms");
const backendStack = new BackendStack(app,"backend",{
  kmsKeyArn: kmsStack,
});



new FrontendStack(app,"frontend",{
  backendApiUrl: backendStack.apiUrl,
  kmsKeyArn: kmsStack.kmsKey.arn
});
app.synth();
