const KEY = "yonkoma-db";

export type StoredState = {
  apiKey: string;
  character: {
    name: string;
    pronouns: string;
    look: string;
    personality: string;
    tell: string;
    sheetDataUrl?: string;
  };
};

export const fallback: StoredState = {
  apiKey: "",
  character: {
    name: "わたし",
    pronouns: "わたし",
    look: "ショートヘア、丸い目、シンプルなパーカー、細い線の棒人間に近い",
    personality: "少し疲れているが観察眼がある",
    tell: "いつも同じパーカー、髪が少しボサボサ、目の下に薄い影",
  },
};

export function loadState(): StoredState {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
}

export function saveState(state: StoredState) {
  localStorage.setItem(KEY, JSON.stringify(state));
}
