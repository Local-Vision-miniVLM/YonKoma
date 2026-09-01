import { NextResponse } from "next/server";

export const maxDuration = 30;
import { generateText } from "@/lib/gemini";
import { extractJson, scriptPrompt } from "@/lib/prompts";
import type { Character, Script } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      apiKey?: string;
      diary?: string;
      character?: Character;
    };
    const apiKey = body.apiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini APIキーがありません" },
        { status: 400 },
      );
    }
    if (!body.diary?.trim()) {
      return NextResponse.json({ error: "日記を書いてください" }, { status: 400 });
    }
    if (!body.character?.name || !body.character.look) {
      return NextResponse.json(
        { error: "キャラの名前と見た目を入れてください" },
        { status: 400 },
      );
    }

    const raw = await generateText(
      apiKey,
      scriptPrompt(body.diary.trim(), body.character),
    );
    const script = extractJson<Script>(raw);
    if (!Array.isArray(script.panels) || script.panels.length !== 4) {
      return NextResponse.json(
        { error: "台本のコマ数が4ではありません", raw },
        { status: 502 },
      );
    }
    return NextResponse.json({ script });
  } catch (err) {
    const message = err instanceof Error ? err.message : "台本生成に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
