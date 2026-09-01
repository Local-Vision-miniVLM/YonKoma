import { GoogleGenAI } from "@google/genai";

export const TEXT_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-flash-latest",
];

export const IMAGE_MODELS = [
  "gemini-2.5-flash-image",
  "gemini-2.5-flash-image-preview",
  "gemini-3.1-flash-image-preview",
];

export function client(apiKey: string) {
  return new GoogleGenAI({ apiKey });
}

export function stripDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) return { mimeType: "image/png", data: dataUrl };
  return { mimeType: match[1], data: match[2] };
}

export async function generateText(
  apiKey: string,
  prompt: string,
): Promise<string> {
  const ai = client(apiKey);
  let lastError: unknown;
  for (const model of TEXT_MODELS) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: prompt,
      });
      const text = res.text?.trim();
      if (text) return text;
    } catch (err) {
      lastError = err;
    }
  }
  throw toError(lastError, "台本生成に失敗しました");
}

type ImagePart = { dataUrl: string; label: string };

export async function generateImage(options: {
  apiKey: string;
  prompt: string;
  refs?: ImagePart[];
  aspectRatio?: string;
}): Promise<string> {
  const ai = client(options.apiKey);
  const parts: Array<
    { text: string } | { inlineData: { mimeType: string; data: string } }
  > = [];

  for (const ref of options.refs ?? []) {
    const { mimeType, data } = stripDataUrl(ref.dataUrl);
    parts.push({ inlineData: { mimeType, data } });
    parts.push({ text: `[REFERENCE] ${ref.label}` });
  }
  parts.push({ text: options.prompt });

  let lastError: unknown;
  for (const model of IMAGE_MODELS) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: [{ role: "user", parts }],
        config: {
          responseModalities: ["IMAGE", "TEXT"],
          imageConfig: {
            aspectRatio: options.aspectRatio ?? "4:3",
          },
        },
      });

      const out = res.candidates?.[0]?.content?.parts ?? [];
      for (const part of out) {
        const inline = part.inlineData;
        if (inline?.data) {
          const mime = inline.mimeType || "image/png";
          return `data:${mime};base64,${inline.data}`;
        }
      }
      lastError = new Error("画像が返りませんでした");
    } catch (err) {
      lastError = err;
    }
  }
  throw toError(lastError, "画像生成に失敗しました");
}

function toError(err: unknown, fallback: string) {
  if (err instanceof Error && err.message) return err;
  try {
    return new Error(JSON.stringify(err));
  } catch {
    return new Error(fallback);
  }
}
