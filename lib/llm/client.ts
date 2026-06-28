import type { LlmExtractionConfig } from "./config";

export type LlmCompletionClient = {
  completeJson(prompt: string, config: LlmExtractionConfig): Promise<string>;
};

export const openAiLlmCompletionClient: LlmCompletionClient = {
  async completeJson(prompt, config) {
    if (!config.apiKey || !config.model) {
      throw new Error("OpenAI config is incomplete");
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        authorization: `Bearer ${config.apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        text: {
          format: { type: "json_object" },
        },
        input: [
          {
            role: "system",
            content: "Return valid JSON only. Do not include markdown.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI request failed: ${response.status}`);
    }

    const payload = await response.json() as {
      output_text?: string;
      output?: Array<{
        content?: Array<{ type?: string; text?: string }>;
      }>;
    };

    if (payload.output_text) {
      return payload.output_text;
    }

    return payload.output
      ?.flatMap((item) => item.content ?? [])
      .find((content) => content.type === "output_text" && content.text)
      ?.text ?? "";
  },
};
