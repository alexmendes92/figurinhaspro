// Mapeia páginas do álbum (pelo nome do arquivo) para seções de figurinhas
// Cada página do álbum corresponde a uma ou mais seções no albums.ts

import { albums as stickerAlbums } from "./albums";
import type { Section, Sticker } from "./albums";

// Extrai o nome "limpo" de uma página do álbum a partir do path
function extractPageTeam(pagePath: string): string {
  const filename = pagePath.split("/").pop() || "";
  return filename
    .replace(/^\d+_/, "")
    .replace(/Panini-World-Cup-\d+-?/, "")
    .replace(/\.webp$|\.jpg$|\.png$/i, "")
    .replace(/-/g, " ")
    .toLowerCase()
    .trim();
}

// Normaliza nome para comparação fuzzy
function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Mapeamento manual de variações de nomes entre os arquivos e as seções
const NAME_ALIASES: Record<string, string[]> = {
  "qatar": ["qatar"],
  "ecuador": ["ecuador"],
  "senegal": ["senegal"],
  "netherlands": ["netherlands", "nederland", "holland"],
  "england": ["england"],
  "iran": ["ir iran", "iran"],
  "usa": ["usa", "united states"],
  "wales": ["wales"],
  "argentina": ["argentina"],
  "saudi arabia": ["saudi arabia"],
  "mexico": ["mexico", "méxico"],
  "poland": ["poland", "polska"],
  "france": ["france"],
  "australia": ["australia"],
  "denmark": ["denmark", "danmark"],
  "tunisia": ["tunisia", "tunisie"],
  "spain": ["spain", "espana", "españa"],
  "costa rica": ["costa rica"],
  "germany": ["germany", "deutschland", "west germany"],
  "japan": ["japan", "nippon"],
  "belgium": ["belgium", "belgique"],
  "canada": ["canada"],
  "morocco": ["morocco", "maroc"],
  "croatia": ["croatia", "hrvatska"],
  "brazil": ["brazil", "brasil"],
  "serbia": ["serbia", "srbija"],
  "switzerland": ["switzerland", "helvetia", "suisse", "schweiz"],
  "cameroon": ["cameroon", "cameroun"],
  "portugal": ["portugal"],
  "ghana": ["ghana"],
  "uruguay": ["uruguay"],
  "south korea": ["korea republic", "korea", "south korea", "rep. korea"],
  "italy": ["italy", "italia"],
  "scotland": ["scotland"],
  "sweden": ["sweden", "sverige"],
  "bulgaria": ["bulgaria"],
  "chile": ["chile"],
  "east germany": ["east germany"],
  "zaire": ["zaire", "congo"],
  "yugoslavia": ["yugoslavia", "jugoslavija"],
  "haiti": ["haiti"],
  "soviet union": ["soviet union", "ussr", "cccp"],
  "czechoslovakia": ["czechoslovakia"],
  "hungary": ["hungary", "magyarorszag", "magyarország"],
  "austria": ["austria", "osterreich", "österreich"],
  "peru": ["peru", "perú"],
  "west germany": ["west germany", "deutschland"],
  "colombia": ["colombia"],
  "paraguay": ["paraguay"],
  "nigeria": ["nigeria"],
  "south africa": ["south africa"],
  "romania": ["romania"],
  "jamaica": ["jamaica"],
  "norway": ["norway", "norge"],
  "algeria": ["algeria", "algerie"],
  "republic of ireland": ["republic of ireland", "ireland", "eire"],
  "new zealand": ["new zealand"],
  "north korea": ["north korea", "korea dpr"],
  "ivory coast": ["ivory coast", "cote d ivoire", "côte d'ivoire"],
  "honduras": ["honduras"],
  "slovenia": ["slovenia"],
  "slovakia": ["slovakia"],
  "bosnia and herzegovina": ["bosnia and herzegovina", "bosnia"],
  "iceland": ["iceland"],
  "panama": ["panama"],
  "egypt": ["egypt"],
};

// Encontra seções que correspondem a uma página do álbum
export function findSectionsForPage(
  pagePath: string,
  albumYear: number
): Section[] {
  // Encontrar o álbum de stickers correspondente ao ano
  const yearStr = String(albumYear);
  const stickerAlbum = stickerAlbums.find((a) => a.year === yearStr);
  if (!stickerAlbum) return [];

  const pageTeam = extractPageTeam(pagePath);
  if (!pageTeam || pageTeam === "complete album" || pageTeam === "album") return [];

  // Páginas especiais (results, stadiums, etc.)
  if (pageTeam.includes("result")) {
    return stickerAlbum.sections.filter((s) =>
      normalize(s.name).includes("result") ||
      normalize(s.name).includes("statistic")
    );
  }
  if (pageTeam.includes("stadium")) {
    return stickerAlbum.sections.filter((s) =>
      normalize(s.name).includes("stadium") || normalize(s.name).includes("venue")
    );
  }
  if (pageTeam.includes("content") || pageTeam.includes("introduction")) {
    return stickerAlbum.sections.filter((s) =>
      normalize(s.name).includes("content") ||
      normalize(s.name).includes("introduction") ||
      normalize(s.name).includes("official")
    );
  }

  // Busca por nome do time/país
  const matched: Section[] = [];
  const pageWords = normalize(pageTeam).split(" ");

  for (const section of stickerAlbum.sections) {
    const sectionNorm = normalize(section.name);

    // Match direto
    if (pageWords.some((w) => w.length > 2 && sectionNorm.includes(w))) {
      matched.push(section);
      continue;
    }

    // Match via aliases
    for (const [, aliases] of Object.entries(NAME_ALIASES)) {
      const aliasMatch = aliases.some((alias) =>
        pageWords.some((w) => alias.includes(w) && w.length > 2)
      );
      const sectionMatch = aliases.some((alias) =>
        sectionNorm.includes(alias)
      );
      if (aliasMatch && sectionMatch) {
        matched.push(section);
        break;
      }
    }
  }

  return matched;
}

// Retorna todas as figurinhas para uma página específica do álbum
export function getStickersForPage(
  pagePath: string,
  albumYear: number
): Sticker[] {
  const sections = findSectionsForPage(pagePath, albumYear);
  return sections.flatMap((s) => s.stickers);
}

// Retorna o nome da seção principal para uma página
export function getSectionNameForPage(
  pagePath: string,
  albumYear: number
): string | null {
  const sections = findSectionsForPage(pagePath, albumYear);
  return sections.length > 0 ? sections[0].name : null;
}
