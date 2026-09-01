import { NextResponse } from "next/server";

export const maxDuration = 60;
import { generateImage } from "@/lib/gemini";
import { panelPrompt, sheetPrompt } from "@/lib/prompts";
import type { Character, Panel } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      apiKey?: string;
      mode?: "sheet" | "panel";
      character?: Character;
      panel?: Panel;
      title?: string;
      sheetDataUrl?: string;
      sketchDataUrl?: string;
    };
    const apiKey = body.apiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini APIキーがありません" },
        { status: 400 },
      );
    }
    if (!body.character) {
      return NextResponse.json({ error: "キャラ情報が必要です" }, { status: 400 });
    }

    if (body.mode === "sheet") {
      const image = await generateImage({
        apiKey,
        prompt: sheetPrompt(body.character),
        aspectRatio: "3:4",
        refs: body.sketchDataUrl
          ? [
              {
                dataUrl: body.sketchDataUrl,
                label: "ユーザーのラフ。このデザインを尊重してシート化する",
              },
            ]
          : undefined,
      });
      return NextResponse.json({ image });
    }

    if (!body.panel) {
      return NextResponse.json({ error: "コマ情報が必要です" }, { status: 400 });
    }

    const refs = [
      body.sheetDataUrl
        ? {
            dataUrl: body.sheetDataUrl,
            label: "キャラクターシート。見た目の正本",
          }
        : null,
      body.sketchDataUrl
        ? {
            dataUrl: body.sketchDataUrl,
            label: "このコマのラフ下描き。構図とポーズの正本",
          }
        : null,
    ].filter(Boolean) as { dataUrl: string; label: string }[];

    const image = await generateImage({
      apiKey,
      prompt: panelPrompt({
        character: body.character,
        title: body.title || "",
        panelIndex: body.panel.index,
        roleLabel: body.panel.roleLabel,
        visual: body.panel.visual,
        hasSheet: Boolean(body.sheetDataUrl),
        hasSketch: Boolean(body.sketchDataUrl),
      }),
      refs,
      aspectRatio: "4:3",
    });
    return NextResponse.json({ image });
  } catch (err) {
    const message = err instanceof Error ? err.message : "画像生成に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
