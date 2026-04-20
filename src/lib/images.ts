const BASE_URL = (process.env.NEXT_PUBLIC_IMAGES_BASE_URL || "").replace(/\/$/, "");

export function imgUrl(path: string | undefined | null): string {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  if (!BASE_URL) return path;
  return `${BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}
