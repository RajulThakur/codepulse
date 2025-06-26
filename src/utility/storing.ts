import { ExtensionContext } from "vscode";
interface ChatMessage {
  isUser: boolean;
  text: string;
}
export class ChatStore {
  constructor(private context: ExtensionContext) {}

  getChats(): ChatMessage[] {
    return this.context.workspaceState.get<ChatMessage[]>("chatHistory", []);
  }

  async addChat(msg: ChatMessage) {
    const chats = this.getChats();
    chats.push(msg);
    await this.context.workspaceState.update("chatHistory", chats);
  }

  async clearChats() {
    await this.context.workspaceState.update("chatHistory", []);
  }
}