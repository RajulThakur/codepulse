import { readFileSync } from "fs";
import {
  CancellationToken,
  ExtensionContext,
  Uri,
  Webview,
  WebviewView,
  WebviewViewProvider,
  WebviewViewResolveContext,
  window,
} from "vscode";
import {
  applyCode,
  handlePromptWithFiles,
  sendRequestToGemini,
} from "../utility/sendReq";
import { ChatStore } from "../utility/storing";

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
      const chatStore = new ChatStore(this.extensionContext);

      const { data } = msg;
      switch (msg.type) {
        case "files-prompt":
          chatStore.addChat({ isUser: true, text: msg.data.prompt });

          const reply = await handlePromptWithFiles(data, webviewView);
          // 🔁 Return back to the WebView
          webviewView.webview.postMessage({
            type: "files-prompt",
            prompt: msg.prompt,
            response: reply,
          });
          chatStore.addChat({ isUser: false, text: reply });
          break;
        case "send-request":
          chatStore.addChat({ isUser: true, text: msg.data.prompt });

          const response = await sendRequestToGemini(data.prompt, webviewView);
          chatStore.addChat({ isUser: false, text: response || "" });
          webviewView.webview.postMessage({
            type: "send-request",
            response,
          });

          break;
        case "apply-code":
          await applyCode(
            data.content,
            data.filename,
            data.extension,
            webviewView
          );
          break;
        case "get-chats":
          const chats = chatStore.getChats();
          console.log("Sending chat history:");
          console.log(chats);
          webviewView.webview.postMessage({
            type: "chat-history",
            response: chats,
          });
          break;
        case "clear-chats":
          await chatStore.clearChats();
          webviewView.webview.postMessage({
            type: "chats-cleared",
            message: "Chat history cleared.",
          });
          window.showInformationMessage("Chat history cleared.");
          break;
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
