# YonKoma

日記からテーマと小回りの落ちを抜き、同じ鉛筆ラフ風キャラで四コマを作るツール。

**漫画制作アプリ** ではなく、**日記を四コマにする儀式** を支援する。  
設計思想・ハードウェア評価・今後の方向性は `docs/` を参照。

| ドキュメント | 内容 |
|--------------|------|
| [docs/DESIGN.md](docs/DESIGN.md) | 設計思想・仕様・データモデル |
| [docs/HARDWARE.md](docs/HARDWARE.md) | マシンスペック別の現実性（1650 Ti 等） |
| [docs/ROADMAP.md](docs/ROADMAP.md) | ロードマップ・料金・技術決定 |

## 現状（v0.1）

- 日記 → 起承転結台本（Gemini テキスト）
- キャラシート + 4コマ画像（Gemini 画像、参照画像で一貫性）
- コマごとのラフキャンバス
- セリフは画像に焼き込まず UI で重ね表示

画像 API は **無料枠外・従量課金**（[Gemini 料金](https://ai.google.dev/gemini-api/docs/pricing)）。  
完全無料のローカル画像生成は将来オプションとして検討（`docs/HARDWARE.md`）。

## クイックスタート

```bash
npm install
npm run dev
```

1. [Google AI Studio](https://aistudio.google.com/apikey) で API キーを発行
2. http://localhost:3000 を開き、左ペインにキーを貼る（localStorage に保存）
3. キャラ設定 → 日記 → 台本 → 4コマ生成

`.env.local` に `GEMINI_API_KEY` を置くことも可能（`.env.example` 参照）。

## ハードウェアメモ

| 環境 | 向き |
|------|------|
| Intel Iris Xe + 32GB | UI・台本（Ollama）・クラウド画像 |
| GTX 1650 Ti 4GB + 32GB | ローカル SD 1.5 試作（四コマ向き、動画は非推奨） |

詳細は [docs/HARDWARE.md](docs/HARDWARE.md)。

## ライセンス

未定（Local-Vision-miniVLM 配下で検討中）。
