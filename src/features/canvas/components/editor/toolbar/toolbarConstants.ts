export interface FontFamilyOption {
  name: string;
  value: string;
  label: string;
  description: string;
  category: "Sans-serif" | "Serif" | "Monospace" | "System";
}

export const FONT_FAMILIES: FontFamilyOption[] = [
  {
    name: "Inter",
    value: "'Inter', sans-serif",
    label: "Inter",
    description: "Clean modern sans-serif",
    category: "Sans-serif",
  },
  {
    name: "DM Sans",
    value: "'DM Sans', sans-serif",
    label: "DM Sans",
    description: "Geometric, readable",
    category: "Sans-serif",
  },
  {
    name: "Lato",
    value: "'Lato', sans-serif",
    label: "Lato",
    description: "Humanist, friendly",
    category: "Sans-serif",
  },
  {
    name: "Nunito",
    value: "'Nunito', sans-serif",
    label: "Nunito",
    description: "Rounded, approachable",
    category: "Sans-serif",
  },
  {
    name: "Space Grotesk",
    value: "'Space Grotesk', sans-serif",
    label: "Space Grotesk",
    description: "Tech-forward, modern",
    category: "Sans-serif",
  },
  {
    name: "Playfair Display",
    value: "'Playfair Display', Georgia, serif",
    label: "Playfair Display",
    description: "Elegant editorial serif",
    category: "Serif",
  },
  {
    name: "Merriweather",
    value: "'Merriweather', serif",
    label: "Merriweather",
    description: "Classic book reading",
    category: "Serif",
  },
  {
    name: "Libre Baskerville",
    value: "'Libre Baskerville', serif",
    label: "Libre Baskerville",
    description: "Newspaper-style serif",
    category: "Serif",
  },
  {
    name: "Crimson Text",
    value: "'Crimson Text', serif",
    label: "Crimson Text",
    description: "Long-form prose serif",
    category: "Serif",
  },
  {
    name: "Source Serif 4",
    value: "'Source Serif 4', serif",
    label: "Source Serif 4",
    description: "Adobe editorial serif",
    category: "Serif",
  },
  {
    name: "Cormorant Garamond",
    value: "'Cormorant Garamond', serif",
    label: "Cormorant Garamond",
    description: "Luxury fashion editorial",
    category: "Serif",
  },
  {
    name: "JetBrains Mono",
    value: "'JetBrains Mono', monospace",
    label: "JetBrains Mono",
    description: "Developer monospace",
    category: "Monospace",
  },
  {
    name: "Roboto Mono",
    value: "'Roboto Mono', monospace",
    label: "Roboto Mono",
    description: "Clean terminal mono",
    category: "Monospace",
  },
  {
    name: "System UI",
    value: "system-ui, -apple-system, sans-serif",
    label: "System UI",
    description: "OS native default",
    category: "System",
  },
];

export const FONT_SIZES = [
  { label: "12px", value: "12px", name: "12" },
  { label: "14px", value: "14px", name: "14" },
  { label: "16px", value: "16px", name: "16" },
  { label: "18px", value: "18px", name: "18" },
  { label: "20px", value: "20px", name: "20" },
  { label: "24px", value: "24px", name: "24" },
  { label: "30px", value: "30px", name: "30" },
  { label: "36px", value: "36px", name: "36" },
];

export const TEXT_COLOR_PALETTES = [
  {
    category: "Neutrals & Slate",
    colors: [
      { name: "Default (Theme)", value: "" },
      { name: "Dark Slate", value: "#0f172a" },
      { name: "Charcoal", value: "#334155" },
      { name: "Muted Slate", value: "#64748b" },
      { name: "Light Slate", value: "#94a3b8" },
    ],
  },
  {
    category: "Warm & Vibrant",
    colors: [
      { name: "Ruby Red", value: "#e11d48" },
      { name: "Electric Rose", value: "#f43f5e" },
      { name: "Primary Orange", value: "#ea580c" },
      { name: "Amber Gold", value: "#d97706" },
      { name: "Warm Sun", value: "#eab308" },
    ],
  },
  {
    category: "Cool & Modern",
    colors: [
      { name: "Emerald Green", value: "#059669" },
      { name: "Teal Cyan", value: "#0d9488" },
      { name: "Sky Blue", value: "#0284c7" },
      { name: "Electric Indigo", value: "#4f46e5" },
      { name: "Deep Purple", value: "#7c3aed" },
    ],
  },
  {
    category: "Deep Rich Tones",
    colors: [
      { name: "Midnight Navy", value: "#1e1b4b" },
      { name: "Wine Red", value: "#881337" },
      { name: "Forest Deep", value: "#14532d" },
      { name: "Ocean Deep", value: "#0c4a6e" },
      { name: "Royal Violet", value: "#581c87" },
    ],
  },
];

export const HIGHLIGHT_COLORS = [
  { name: "None", value: "" },
  { name: "Yellow", value: "rgba(254, 240, 138, 0.65)" },
  { name: "Green", value: "rgba(187, 247, 208, 0.65)" },
  { name: "Blue", value: "rgba(186, 230, 253, 0.65)" },
  { name: "Pink", value: "rgba(251, 207, 232, 0.65)" },
  { name: "Purple", value: "rgba(233, 213, 255, 0.65)" },
  { name: "Orange", value: "rgba(254, 215, 170, 0.65)" },
  { name: "Coral", value: "rgba(254, 205, 211, 0.65)" },
];
