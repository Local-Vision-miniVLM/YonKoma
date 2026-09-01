export type PanelRole = "ki" | "sho" | "ten" | "ketsu";

export type Panel = {
  index: 1 | 2 | 3 | 4;
  role: PanelRole;
  roleLabel: string;
  caption: string;
  dialogue: string;
  visual: string;
  punchNote?: string;
};

export type Script = {
  title: string;
  theme: string;
  punchline: string;
  whyItWorks: string;
  panels: Panel[];
};

export type Character = {
  name: string;
  pronouns: string;
  look: string;
  personality: string;
  tell: string;
  sheetDataUrl?: string;
};

export type Comic = {
  id: string;
  createdAt: string;
  diary: string;
  script: Script;
  character: Character;
  panels: (string | null)[];
  sketches: (string | null)[];
};
