import {BackendStack} from "./backend"
import {FrontendStack} from "./frontend"
import { App } from "cdktf";

const app = new App();
new BackendStack(app,"backend");

const backendStack = new BackendStack(app, "backend");


new FrontendStack(app,"frontend",{
  backendApiUrl: backendStack.apiUrl
});
app.synth();
