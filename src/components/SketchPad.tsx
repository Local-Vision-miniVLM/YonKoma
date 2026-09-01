"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  value?: string | null;
  onChange: (dataUrl: string | null) => void;
  label?: string;
};

export function SketchPad({ value, onChange, label }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [mode, setMode] = useState<"draw" | "erase">("draw");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        fillPaper(ctx, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = value;
    } else {
      fillPaper(ctx, canvas.width, canvas.height);
    }
  }, [value]);

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const r = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * canvas.width,
      y: ((e.clientY - r.top) / r.height) * canvas.height,
    };
  }

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    drawing.current = true;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    canvas.setPointerCapture(e.pointerId);
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const p = pos(e);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (mode === "erase") {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = "#f4efe4";
      ctx.lineWidth = 18;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = "#2b241c";
      ctx.lineWidth = 2.2;
    }
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }

  function end() {
    if (!drawing.current) return;
    drawing.current = false;
    const canvas = canvasRef.current!;
    onChange(canvas.toDataURL("image/png"));
  }

  function clear() {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    fillPaper(ctx, canvas.width, canvas.height);
    onChange(null);
  }

  return (
    <div className="sketch">
      {label ? <div className="sketch-label">{label}</div> : null}
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
      />
      <div className="sketch-tools">
        <button
          type="button"
          className={mode === "draw" ? "on" : ""}
          onClick={() => setMode("draw")}
        >
          鉛筆
        </button>
        <button
          type="button"
          className={mode === "erase" ? "on" : ""}
          onClick={() => setMode("erase")}
        >
          消しゴム
        </button>
        <button type="button" onClick={clear}>
          消す
        </button>
      </div>
    </div>
  );
}

function fillPaper(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
) {
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "#f4efe4";
  ctx.fillRect(0, 0, w, h);
}
