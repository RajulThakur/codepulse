import * as vscode from "vscode";
import { CodePulseSidebarProvider } from "./view/getWebViewContent";


export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "codepulse" is now active!');

  context.subscriptions.push(
    vscode.commands.registerCommand("codepulse.helloWorld", () => {
      const panel = vscode.window.createWebviewPanel(
        "codepulseWebview",
        "CodePulse",
        vscode.ViewColumn.One,
        { enableScripts: true, }
      );

    })
  );
  const provider = new CodePulseSidebarProvider(context.extensionUri, context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("codepulse.sidebarView", provider)
  );
}

export function deactivate() {}