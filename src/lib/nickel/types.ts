export type NickelLevel = "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN";

export type ProductNickelLevelRow = {
  product_id: string;
  nickel_level: NickelLevel;
  source: string;
  updated_at: string;
};

export function getNickelLevelLabel(level: NickelLevel | null | undefined) {
  if (level === "LOW") return "Basso";
  if (level === "MEDIUM") return "Medio";
  if (level === "HIGH") return "Alto";
  return "Non disponibile";
}

export function getNickelLevelClassName(level: NickelLevel | null | undefined) {
  if (level === "LOW") return "ios-nickel-badge ios-nickel-low";
  if (level === "MEDIUM") return "ios-nickel-badge ios-nickel-medium";
  if (level === "HIGH") return "ios-nickel-badge ios-nickel-high";
  return "ios-nickel-badge ios-nickel-unknown";
}

