import * as vscode from "vscode";
import { CodePulseSidebarProvider } from "./view/getWebViewContent";


export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "codepulse" is now active!');

  // ⏱ Register old command if you want to keep it
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

  // 🧩 Register sidebar view provider
}

export function deactivate() {}