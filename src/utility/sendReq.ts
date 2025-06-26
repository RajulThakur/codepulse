import { WebviewView, workspace } from "vscode";
import path from "path";
import OpenAI from "openai";

async function sendToGemini(prompt: string): Promise<string> {
  const openai = new OpenAI({
    apiKey: "",
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
  });
  const response = await openai.chat.completions.create({
    model: "gemini-2.0-flash",
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      {
        role: "user",
        content: prompt,
      },
    ],
  });
  console.log("Response from Gemini:", response.choices[0].message.content);

  return response.choices[0].message.content ?? "[No response from model]";
}

export async function handlePromptWithFiles(
  msg: { prompt: string; files: string[] },
  webviewView: WebviewView
) {
  const files: { name: string; content: string | null; type: string }[] = [];

  for (const filename of msg.files) {
    const uris = await workspace.findFiles(
      `**/${filename}`,
      "**/node_modules/**",
      1
    );

    if (uris.length === 0) {
      continue;
    }

    const uri = uris[0];
    const ext = path.extname(filename).toLowerCase();

    if ([".png", ".jpg", ".jpeg", ".webp"].includes(ext)) {
      files.push({
        name: filename,
        content: null,
        type: "image",
      });
    } else {
      const contentBytes = await workspace.fs.readFile(uri);
      const content = Buffer.from(contentBytes).toString("utf-8");

      files.push({
        name: filename,
        content,
        type: "text",
      });
    }
  }

  // 🧠 Compose the full prompt with files
 const fullPrompt =
  `You are an expert programming assistant. ` +
  `Based on the user's request and the attached project files, analyze the context and generate accurate and helpful code.\n\n` +
  `try to give him direct code help if ask for it and donot generate extra`+

  `---\n📌 USER REQUEST:\n${msg.prompt}\n\n` +

  `---\n📂 PROJECT CONTEXT:\n` +
  files
    .map((file) =>
      file.type === "text"
        ? `📄 ${file.name}\n\n${file.content}`
        : `🖼️ ${file.name} [image attached]`
    )
    .join("\n\n") +

  `\n\n---\n✅ Respond with well-commented code or an explanation. Do not repeat the input.`;

  // 🤖 Send to Gemini
  const reply = await sendToGemini(fullPrompt);

  // 🔁 Return back to the WebView
  webviewView.webview.postMessage({
    type: "files-prompt",
    prompt: msg.prompt,
    files,
    response: reply,
  });
}

export async function sendRequestToGemini(
  prompt: string,
  webviewView: WebviewView
) {
  try {
    const response = await sendToGemini(prompt);
    webviewView.webview.postMessage({
      type: "gemini-response",
      response,
    });
    console.log("Response sent to webview:", response);
    console.log("Prompt sent to Gemini:", prompt);
    webviewView.webview.postMessage({
      type: "send-request",
      response,
    });
  } catch (error) {
    console.error("Error sending request to Gemini:", error);
    webviewView.webview.postMessage({
      type: "error",
      message: "Failed to get response from Gemini.",
    });
  }
}
