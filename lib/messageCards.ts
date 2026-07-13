export type ParsedCard = {
  kind: string;
  label: string;
  note: string | null;
};

export function parseCard(text: string): ParsedCard | null {
  const normalized = String(text || "").trim();
  if (!normalized.startsWith("QH_CARD::")) return null;
  try {
    const parsed = JSON.parse(normalized.slice("QH_CARD::".length));
    if (!parsed?.label) return null;
    return {
      kind: String(parsed.kind || "update"),
      label: String(parsed.label),
      note: parsed.note ? String(parsed.note) : null,
    };
  } catch {
    return null;
  }
}
