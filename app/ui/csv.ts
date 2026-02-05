export const splitTags = (v: unknown): string[] => {
  if (!v) return [];
  return String(v)
    .split(",")
    .map(t => t.trim())
    .filter(Boolean);
};

// Robust-ish CSV parsing with quoted commas.
export const parseCSV = (text: string): string[][] => {
  const lines = text.split(/\r?\n/).filter(Boolean);
  return lines.map((line) =>
    line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((v) => v.replace(/^"|"$/g, "").trim())
  );
};

export const normalizeKey = (s: string) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['".,()]/g, "")
    .replace(/&/g, " and ")
    .replace(/\s+/g, " ")
    .trim();
