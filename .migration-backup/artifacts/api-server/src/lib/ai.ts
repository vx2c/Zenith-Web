import OpenAI from "openai";

interface AIMessage {
  role: "user" | "assistant";
  content: string;
}

interface AIResponse {
  content: string;
  codeSnippet: string | null;
  codeLanguage: string | null;
}

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const BASE_SYSTEM_PROMPT = `You are Zenith, an expert Roblox Studio AI assistant specializing in Luau scripting and game development. You help developers write, debug, and improve their Roblox games.

When responding:
- Give clear, concise explanations followed by working Luau code when relevant.
- Use modern Roblox APIs and best practices (e.g., task.wait instead of wait, task.spawn instead of spawn).
- Always use proper error handling with pcall where appropriate.
- Write clean, readable, well-commented code.
- If the user asks for code, always provide a complete, runnable example.

IMPORTANT: When you include code in your response, format it by placing the code in a fenced code block with the language tag \`\`\`lua at the start and \`\`\` at the end. Only include ONE code block per response. Your explanation text goes outside the code block.`;

function extractCodeBlock(text: string): { content: string; codeSnippet: string | null; codeLanguage: string | null } {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/;
  const match = text.match(codeBlockRegex);

  if (match) {
    const language = match[1] ?? "lua";
    const code = match[2].trim();
    // Remove the code block from the main content
    const content = text.replace(codeBlockRegex, "").trim();
    return {
      content: content || text.trim(),
      codeSnippet: code,
      codeLanguage: language,
    };
  }

  return {
    content: text.trim(),
    codeSnippet: null,
    codeLanguage: null,
  };
}

export async function generateAIResponse(messages: AIMessage[], personality?: string): Promise<AIResponse> {
  const systemPrompt = personality
    ? `${personality}\n\nAdditional context: You are also an expert in Luau scripting and Roblox Studio. When you include code, always use a fenced \`\`\`lua code block. Only include ONE code block per response.`
    : BASE_SYSTEM_PROMPT;

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
    max_tokens: 1500,
    temperature: 0.7,
  });

  const rawText = completion.choices[0]?.message?.content ?? "Sorry, I couldn't generate a response. Please try again.";
  return extractCodeBlock(rawText);
}
