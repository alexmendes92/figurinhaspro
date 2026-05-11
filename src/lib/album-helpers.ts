export interface AlbumCoverage {
  percent: number;
  missing: number;
}

export function calculateAlbumCoverage(inStock: number, total: number): AlbumCoverage {
  if (total <= 0) return { percent: 0, missing: 0 };
  const clamped = Math.min(inStock, total);
  const percent = Math.round((clamped / total) * 100);
  const missing = Math.max(total - inStock, 0);
  return { percent, missing };
}

export interface CoverageColor {
  bg: string;
  text: string;
}

export function getCoverageColor(percent: number): CoverageColor {
  if (percent >= 80) return { bg: "bg-emerald-500", text: "text-emerald-400" };
  if (percent >= 30) return { bg: "bg-accent-500", text: "text-accent-400" };
  return { bg: "bg-zinc-500", text: "text-zinc-400" };
}

export function isAlbumComplete(input: { inStock: number; total: number }): boolean {
  if (input.total <= 0) return false;
  return input.inStock >= input.total;
}
