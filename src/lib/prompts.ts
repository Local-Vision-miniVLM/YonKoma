import type { Character } from "./types";

export const STYLE_LOCK = `画風は絶対に崩さない:
- 超ラフな鉛筆スケッチ。ノートに30秒で描いたような線
- グラファイトの黒い線、ごく薄い陰影だけ。彩色なし
- トーン、ベタ塗り、デジタル塗り、アニメ塗り、厚塗り禁止
- 線は少しブレていて、自信のあるストローク
- キャラは記号的でシンプル。特徴は3〜4個までに絞る
- 背景は最小限の小物と空間だけで、描き込みすぎない
- 紙は少し黄ばんだスケッチブック
- 吹き出しや文字は絵に描き込まない（後から重ねる）`;

export function characterPrompt(c: Character) {
  return `主人公「${c.name}」
一人称/呼び方: ${c.pronouns || "未指定"}
見た目: ${c.look}
性格: ${c.personality}
識別しやすい特徴（毎回同じ）: ${c.tell}`;
}

export function scriptPrompt(diary: string, character: Character) {
  return `あなたは日記を四コマ漫画にする編集者兼構成作家です。
派手なギャグより、日常の小さなズレ・自虐・余韻・言い淀みで落とす。

${characterPrompt(character)}

日記:
"""
${diary}
"""

やってほしいこと:
1. 日記から「今日の一本」になるテーマを1行で抜く
2. 起承転結で小回りの落とし方を決める（結は言い切らず、少し余白を残してもよい）
3. 4コマの各コマを具体的な絵の指示にする

JSONだけ返せ。前後の説明文は不要。
{
  "title": "短いタイトル",
  "theme": "テーマ1行",
  "punchline": "落ちの核",
  "whyItWorks": "なぜこの落ちが日記に沿っているか1〜2文",
  "panels": [
    {
      "index": 1,
      "role": "ki",
      "roleLabel": "起",
      "caption": "ナレーション（なくても空文字）",
      "dialogue": "セリフ（なくても空文字）",
      "visual": "絵の内容。構図、表情、小物、カメラ。英語混じり可だが日本語で具体的に",
      "punchNote": "このコマの役割"
    },
    {"index": 2, "role": "sho", "roleLabel": "承", "caption": "", "dialogue": "", "visual": "", "punchNote": ""},
    {"index": 3, "role": "ten", "roleLabel": "転", "caption": "", "dialogue": "", "visual": "", "punchNote": ""},
    {"index": 4, "role": "ketsu", "roleLabel": "結", "caption": "", "dialogue": "", "visual": "", "punchNote": ""}
  ]
}`;
}

export function sheetPrompt(character: Character) {
  return `${STYLE_LOCK}

同じキャラクターのキャラクターシートを1枚で描く。
${characterPrompt(character)}

構成:
- 白いスケッチブックの1ページ
- 正面全身、斜め、横顔を並べる
- 下段に表情3つ（普通 / 困り / ちょっと笑う）
- 服と髪型は全ポーズで完全に同じ
- ラベル文字は小さく鉛筆で書いてよい
- 一枚絵。コマ割りしない`;
}

export function panelPrompt(options: {
  character: Character;
  title: string;
  panelIndex: number;
  roleLabel: string;
  visual: string;
  hasSheet: boolean;
  hasSketch: boolean;
}) {
  const refs = [
    options.hasSheet
      ? "最初の参照画像はキャラクターシート。顔・髪・服・体型を必ず一致させる。"
      : "",
    options.hasSketch
      ? "ラフ下描きの線と構図を尊重して清書する。ポーズと配置はラフ優先。ただしキャラの見た目はシート優先。"
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  return `${STYLE_LOCK}

四コマ漫画の第${options.panelIndex}コマ（${options.roleLabel}）だけを1枚で描く。
作品タイトル: ${options.title}
${characterPrompt(options.character)}

このコマの絵:
${options.visual}

${refs}

制約:
- 1コマだけ。4つ並べない
- キャラが複数いるなら主人公は常に同じデザイン
- 吹き出し・タイトル・コマ番号は描かない
- 画面中央に読みやすいシルエット
- 超ラフ鉛筆。綺麗にしすぎない`;
}

export function extractJson<T>(raw: string): T {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const text = (fenced?.[1] ?? raw).trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end < 0) throw new Error("JSONを返せませんでした");
  return JSON.parse(text.slice(start, end + 1)) as T;
}
