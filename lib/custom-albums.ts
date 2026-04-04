import type { Album, Sticker, Section } from "@/lib/albums";
import type { CustomAlbum } from "@prisma/client";

interface RawSticker {
  code: string;
  name?: string;
  type?: string;
}

/**
 * Converte um CustomAlbum do banco para a interface Album usada no sistema.
 * Stickers ficam em uma única seção "Geral".
 */
export function customAlbumToAlbum(ca: CustomAlbum): Album {
  const rawStickers: RawSticker[] = JSON.parse(ca.stickers);

  const stickers: Sticker[] = rawStickers.map((s) => ({
    code: s.code,
    name: s.name || s.code,
    type: s.type || "regular",
    image: "",
  }));

  const section: Section = {
    name: "Geral",
    stickers,
  };

  return {
    slug: ca.slug,
    year: ca.year || "",
    title: ca.title,
    host: "",
    champion: "",
    flag: "",
    totalStickers: stickers.length,
    totalPages: 1,
    sections: [section],
  };
}

/**
 * Gera um slug a partir do título do álbum.
 * Prefixo "custom_" evita conflito com álbuns estáticos.
 */
export function generateAlbumSlug(title: string): string {
  const base = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  return `custom_${base}`;
}

/**
 * Parseia texto de stickers em lista de códigos.
 * Aceita:
 * - Range numérico: "1-670"
 * - Lista separada por vírgula/espaço/linha: "1, 2, 3, FWC1"
 * - Misto: "1-100, FWC1, FWC2, BRA1-BRA20"
 */
export function parseStickersInput(text: string): RawSticker[] {
  const parts = text
    .split(/[,;\n\r]+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const codes: string[] = [];

  for (const part of parts) {
    // Tenta interpretar como range numérico puro: "1-670"
    const numRange = part.match(/^(\d+)\s*[-–]\s*(\d+)$/);
    if (numRange) {
      const start = parseInt(numRange[1]);
      const end = parseInt(numRange[2]);
      if (end >= start && end - start < 2000) {
        for (let i = start; i <= end; i++) {
          codes.push(String(i));
        }
        continue;
      }
    }

    // Tenta range com prefixo: "BRA1-BRA20"
    const prefixRange = part.match(/^([A-Za-z]+)(\d+)\s*[-–]\s*\1(\d+)$/i);
    if (prefixRange) {
      const prefix = prefixRange[1];
      const start = parseInt(prefixRange[2]);
      const end = parseInt(prefixRange[3]);
      if (end >= start && end - start < 2000) {
        for (let i = start; i <= end; i++) {
          codes.push(`${prefix}${i}`);
        }
        continue;
      }
    }

    // Códigos individuais separados por espaço
    const singles = part.split(/\s+/).filter(Boolean);
    codes.push(...singles);
  }

  return codes.map((code) => ({ code: code.toUpperCase() }));
}
