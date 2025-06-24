import * as vscode from "vscode";
import { readFileSync } from "fs";
import * as path from "path";

// ✅ 1. Register the Sidebar WebviewViewProvider
class CodePulseSidebarProvider implements vscode.WebviewViewProvider {
  constructor(private readonly extensionUri: vscode.Uri) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.extensionUri, "web"),
      ]
    };

    webviewView.webview.html = getWebviewContent(webviewView.webview, this.extensionUri);
  }
}

// ✅ 2. Provide the same HTML injection logic for React
function getWebviewContent(
  webview: vscode.Webview,
  extensionUri: vscode.Uri
): string {
  const distPath = vscode.Uri.joinPath(extensionUri, "web");
  const indexPath = vscode.Uri.joinPath(distPath, "index.html");

  let html = readFileSync(indexPath.fsPath, "utf8");

  html = html.replace(/"\/assets\/(.*?)"/g, (_, assetFile) => {
    const assetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(distPath, "assets", assetFile)
    );
    return `"${assetUri}"`;
  });

  html = html.replace(/"\/vite.svg"/, () => {
    const faviconUri = webview.asWebviewUri(
      vscode.Uri.joinPath(distPath, "vite.svg")
    );
    return `"${faviconUri}"`;
  });

  return html;
}

// ✅ 3. Activate both the old command and the sidebar
export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "codepulse" is now active!');

  // ⏱ Register old command if you want to keep it
  context.subscriptions.push(
    vscode.commands.registerCommand("codepulse.helloWorld", () => {
      const panel = vscode.window.createWebviewPanel(
        "codepulseWebview",
        "CodePulse",
        vscode.ViewColumn.One,
        { enableScripts: true }
      );

      panel.webview.html = getWebviewContent(panel.webview, context.extensionUri);
    })
  );

  // 🧩 Register sidebar view provider
  const provider = new CodePulseSidebarProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("codepulse.sidebarView", provider)
  );
}

export function deactivate() {}