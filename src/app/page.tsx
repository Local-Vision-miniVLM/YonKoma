"use client";

import { useEffect, useMemo, useState } from "react";
import { SketchPad } from "@/components/SketchPad";
import { fallback, loadState, saveState } from "@/lib/storage";
import type { Character, Panel, Script } from "@/lib/types";

const emptyPanels = [null, null, null, null] as (string | null)[];
const roles = ["起", "承", "転", "結"] as const;

export default function Home() {
  const [apiKey, setApiKey] = useState("");
  const [character, setCharacter] = useState<Character>(fallback.character);
  const [diary, setDiary] = useState("");
  const [script, setScript] = useState<Script | null>(null);
  const [panels, setPanels] = useState<(string | null)[]>(emptyPanels);
  const [sketches, setSketches] = useState<(string | null)[]>(emptyPanels);
  const [charSketch, setCharSketch] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sketchIndex, setSketchIndex] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const s = loadState();
    setApiKey(s.apiKey);
    setCharacter(s.character);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveState({ apiKey, character });
  }, [apiKey, character, ready]);

  const canScript = Boolean(apiKey && diary.trim() && character.look.trim());

  async function makeScript() {
    setError(null);
    setBusy("台本を考えています…");
    try {
      const res = await fetch("/api/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, diary, character }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "失敗");
      setScript(data.script);
      setPanels(emptyPanels);
    } catch (err) {
      setError(err instanceof Error ? err.message : "失敗しました");
    } finally {
      setBusy(null);
    }
  }

  async function makeSheet() {
    setError(null);
    setBusy("キャラシートを描いています…");
    try {
      const res = await fetch("/api/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey,
          mode: "sheet",
          character,
          sketchDataUrl: charSketch,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "失敗");
      setCharacter((c) => ({ ...c, sheetDataUrl: data.image }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "失敗しました");
    } finally {
      setBusy(null);
    }
  }

  async function makePanel(index: number) {
    if (!script) return;
    const panel = script.panels[index];
    setError(null);
    setBusy(`${panel.roleLabel}のコマを描いています…`);
    try {
      const image = await requestPanel(panel, index);
      setPanels((prev) => prev.map((p, i) => (i === index ? image : p)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "失敗しました");
    } finally {
      setBusy(null);
    }
  }

  async function makeAll() {
    if (!script) return;
    setError(null);
    setBusy("4コマを並行して描いています…");
    try {
      const results = await Promise.all(
        script.panels.map((panel, index) => requestPanel(panel, index)),
      );
      setPanels(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "失敗しました");
    } finally {
      setBusy(null);
    }
  }

  async function requestPanel(panel: Panel, index: number) {
    const res = await fetch("/api/image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey,
        mode: "panel",
        character,
        panel,
        title: script?.title,
        sheetDataUrl: character.sheetDataUrl,
        sketchDataUrl: sketches[index],
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `${panel.roleLabel}に失敗`);
    return data.image as string;
  }

  const missingKey = useMemo(
    () => !apiKey && ready,
    [apiKey, ready],
  );

  return (
    <main className="app">
      <header className="masthead">
        <div>
          <h1>YonKoma</h1>
          <p className="lede">
            日記からテーマと小回りの落ちを抜き、同じ鉛筆キャラで四コマにする。
            絵は1枚ずつ生成してコストを抑え、ラフがあれば構図の正本にする。
          </p>
        </div>
      </header>

      {missingKey ? (
        <p className="error" style={{ marginTop: -12 }}>
          Gemini APIキーを左の設定に入れてください。このPCの内蔵GPUでは拡散モデルは現実的ではないので、画像はGemini側で生成します。
        </p>
      ) : null}

      <div className="grid">
        <section className="card">
          <h2>1. キャラと画風</h2>
          <label>Gemini APIキー</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIza..."
          />
          <label>名前</label>
          <input
            value={character.name}
            onChange={(e) =>
              setCharacter({ ...character, name: e.target.value })
            }
          />
          <label>一人称</label>
          <input
            value={character.pronouns}
            onChange={(e) =>
              setCharacter({ ...character, pronouns: e.target.value })
            }
          />
          <label>見た目（毎回同じにする核）</label>
          <textarea
            value={character.look}
            onChange={(e) =>
              setCharacter({ ...character, look: e.target.value })
            }
            placeholder="ボサボサのショート、丸い目、グレーのパーカー…"
          />
          <label>性格</label>
          <input
            value={character.personality}
            onChange={(e) =>
              setCharacter({ ...character, personality: e.target.value })
            }
          />
          <label>識別ポイント</label>
          <input
            value={character.tell}
            onChange={(e) =>
              setCharacter({ ...character, tell: e.target.value })
            }
          />
          <p className="hint">
            先にキャラシートを1枚作ると、4コマの顔がかなり揃います。下に超ラフを描いてからシート化もできます。
          </p>
          <SketchPad
            label="キャラの超ラフ（任意）"
            value={charSketch}
            onChange={setCharSketch}
          />
          <div className="row" style={{ marginTop: 10 }}>
            <button className="btn" disabled={!!busy || !apiKey} onClick={makeSheet}>
              キャラシートを生成
            </button>
          </div>
          {character.sheetDataUrl ? (
            <div className="sheet" style={{ marginTop: 12 }}>
              <img src={character.sheetDataUrl} alt="キャラシート" />
            </div>
          ) : null}
        </section>

        <section className="card">
          <h2>2. 日記 → 落ち</h2>
          <label>今日の出来事</label>
          <textarea
            value={diary}
            onChange={(e) => setDiary(e.target.value)}
            placeholder="コンビニで新作パンを狙ったのに売り切れで、結局いつものサンドイッチだった。レジで『またですか』と言われて少し傷ついた。"
          />
          <div className="row">
            <button className="btn" disabled={!canScript || !!busy} onClick={makeScript}>
              テーマと4コマ構成を出す
            </button>
          </div>
          {script ? (
            <div className="meta" style={{ marginTop: 16 }}>
              <p>
                <b>{script.title}</b>
              </p>
              <p>テーマ: {script.theme}</p>
              <p>落ち: {script.punchline}</p>
              <p className="hint">{script.whyItWorks}</p>
              <div className="script">
                {script.panels.map((panel, i) => (
                  <div className="panel-edit" key={panel.index}>
                    <b>
                      {panel.roleLabel} {panel.punchNote}
                    </b>
                    <label>絵</label>
                    <textarea
                      value={panel.visual}
                      onChange={(e) => {
                        const next = structuredClone(script);
                        next.panels[i].visual = e.target.value;
                        setScript(next);
                      }}
                    />
                    <label>セリフ</label>
                    <input
                      value={panel.dialogue}
                      onChange={(e) => {
                        const next = structuredClone(script);
                        next.panels[i].dialogue = e.target.value;
                        setScript(next);
                      }}
                    />
                    <label>ナレーション</label>
                    <input
                      value={panel.caption}
                      onChange={(e) => {
                        const next = structuredClone(script);
                        next.panels[i].caption = e.target.value;
                        setScript(next);
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="row" style={{ marginTop: 12 }}>
                <button className="btn" disabled={!!busy} onClick={makeAll}>
                  4コマをまとめて描く
                </button>
                <button className="btn ghost" disabled={!!busy} onClick={() => makePanel(0)}>
                  起だけ
                </button>
                <button className="btn ghost" disabled={!!busy} onClick={() => makePanel(1)}>
                  承だけ
                </button>
                <button className="btn ghost" disabled={!!busy} onClick={() => makePanel(2)}>
                  転だけ
                </button>
                <button className="btn ghost" disabled={!!busy} onClick={() => makePanel(3)}>
                  結だけ
                </button>
              </div>
            </div>
          ) : null}
        </section>

        <section className="card">
          <h2>3. ラフと完成</h2>
          <p className="hint">
            コマごとの超ラフがあると、テキストだけより構図が乗りやすい。なくても台本の visual だけで描けます。
          </p>
          <div className="tabs">
            {["起", "承", "転", "結"].map((label, i) => (
              <button
                key={label}
                className={sketchIndex === i ? "tab on" : "tab"}
                onClick={() => setSketchIndex(i)}
              >
                {label}
              </button>
            ))}
          </div>
          <SketchPad
            label={`${["起", "承", "転", "結"][sketchIndex]}のラフ`}
            value={sketches[sketchIndex]}
            onChange={(url) =>
              setSketches((prev) => prev.map((s, i) => (i === sketchIndex ? url : s)))
            }
          />
          <div className="strip" style={{ marginTop: 16 }}>
            {(script?.panels ?? roles.map((roleLabel, i) => ({
              index: (i + 1) as 1 | 2 | 3 | 4,
              roleLabel,
              dialogue: "",
              caption: "",
            }))).map((panel, i) => (
              <div className="cell" key={i}>
                {panels[i] ? (
                  <img src={panels[i]!} alt={`${i + 1}コマ目`} />
                ) : (
                  <div className="placeholder">{panel.roleLabel}</div>
                )}
                {panel.dialogue ? <div className="bubble">{panel.dialogue}</div> : null}
                {panel.caption ? <div className="caption">{panel.caption}</div> : null}
              </div>
            ))}
          </div>
        </section>
      </div>

      {busy ? <p className="status">{busy}</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </main>
  );
}
