const BASE_URL = (process.env.NEXT_PUBLIC_IMAGES_BASE_URL || "").replace(/\/$/, "");

export function imgUrl(path: string | undefined | null): string {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;

  const cleanPath = `/${path.replace(/^\/+/, "")}`;
  return BASE_URL ? `${BASE_URL}${cleanPath}` : cleanPath;
}
