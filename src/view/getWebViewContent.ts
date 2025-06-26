import { readFileSync } from "fs";
import {
  CancellationToken,
  ExtensionContext,
  Uri,
  Webview,
  WebviewView,
  WebviewViewProvider,
  WebviewViewResolveContext,
} from "vscode";
import { handlePromptWithFiles, sendRequestToGemini } from "../utility/sendReq";

export class CodePulseSidebarProvider implements WebviewViewProvider {
  constructor(
    private readonly _extensionUri: Uri,
    public extensionContext: ExtensionContext
  ) {}
  view?: WebviewView;

  resolveWebviewView(
    webviewView: WebviewView,
    webViewContext: WebviewViewResolveContext,
    token: CancellationToken
  ) {
    this.view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (msg) => {
      console.log("Received message in webview:", msg);
      switch (msg.type) {
        case "files-prompt":
            await handlePromptWithFiles(msg, webviewView);
          break;
        case "send-request":
          await sendRequestToGemini(msg.prompt, webviewView); 

    }
      
    });
  }

  private _getHtmlForWebview(webview: Webview) {
    const distPath = Uri.joinPath(this._extensionUri, "web");
    const indexPath = Uri.joinPath(distPath, "index.html");

    let html = readFileSync(indexPath.fsPath, "utf8");

    html = html.replace(/"\/assets\/(.*?)"/g, (_, assetFile) => {
      const assetUri = webview.asWebviewUri(
        Uri.joinPath(distPath, "assets", assetFile)
      );
      return `"${assetUri}"`;
    });
    return html;
  }
}
