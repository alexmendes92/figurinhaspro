const ISO_BY_NAME: Record<string, string> = {
  algeria: "DZ",
  algerie: "DZ",
  angola: "AO",
  argentina: "AR",
  australia: "AU",
  austria: "AT",
  osterreich: "AT",
  belgium: "BE",
  "belgique-belgie": "BE",
  "belgique - belgie": "BE",
  "belgique/belgie": "BE",
  bolivia: "BO",
  "bosna i hercegovina": "BA",
  brasil: "BR",
  brazil: "BR",
  bulgaria: "BG",
  cameroon: "CM",
  cameroun: "CM",
  canada: "CA",
  "ceska republika": "CZ",
  chile: "CL",
  chili: "CL",
  china: "CN",
  colombia: "CO",
  "costa rica": "CR",
  "cote d'ivoire": "CI",
  croatia: "HR",
  hrvatska: "HR",
  danmark: "DK",
  denmark: "DK",
  deutschland: "DE",
  "deutschland-brd": "DE",
  germany: "DE",
  "w. germany": "DE",
  "west germany": "DE",
  ecuador: "EC",
  egypt: "EG",
  "el salvador": "SV",
  england: "GB",
  espana: "ES",
  spain: "ES",
  france: "FR",
  ghana: "GH",
  greece: "GR",
  hellas: "GR",
  haiti: "HT",
  holland: "NL",
  nederland: "NL",
  netherlands: "NL",
  honduras: "HN",
  hungaria: "HU",
  hungary: "HU",
  magyarorszag: "HU",
  iceland: "IS",
  irak: "IQ",
  iran: "IR",
  ireland: "IE",
  israel: "IL",
  italia: "IT",
  italy: "IT",
  japan: "JP",
  "korea republic": "KR",
  "korea rebublic": "KR",
  "south korea": "KR",
  korea: "KR",
  "korea dpr": "KP",
  kuwait: "KW",
  maroc: "MA",
  morocco: "MA",
  mexico: "MX",
  "new zealand": "NZ",
  nigeria: "NG",
  "north ireland": "GB",
  "northern ireland": "GB",
  norway: "NO",
  panama: "PA",
  paraguay: "PY",
  peru: "PE",
  poland: "PL",
  polska: "PL",
  portugal: "PT",
  qatar: "QA",
  romania: "RO",
  rossija: "RU",
  russia: "RU",
  "saudi arabia": "SA",
  scotia: "GB",
  scotland: "GB",
  senegal: "SN",
  serbia: "RS",
  srbija: "RS",
  slovenija: "SI",
  "slovenska republika": "SK",
  "south africa": "ZA",
  sverige: "SE",
  sweden: "SE",
  helvetia: "CH",
  switzerland: "CH",
  togo: "TG",
  "trinidad and tobago": "TT",
  tunis: "TN",
  tunisia: "TN",
  tunisie: "TN",
  turkiye: "TR",
  uae: "AE",
  ukrajina: "UA",
  uruguay: "UY",
  usa: "US",
  wales: "GB",
  zair: "CD",
};

const NON_COUNTRY_PREFIXES = [
  "mcdonald",
  "coca cola",
  "coca-cola",
  "johnson",
  "liberty",
  "wise up",
  "history",
  "host cities",
];

const NON_COUNTRY_EXACT = new Set([
  "introduction",
  "intro",
  "content",
  "stadiums",
  "stadium",
  "stadiums & cities",
  "cities & stadiums",
  "city",
  "estadio",
  "fifa museum",
  "fifa world cup legends",
  "official match ball",
  "outras",
  "playing talisman",
  "poster",
  "programma mexico 70",
  "special",
  "special edition",
  "us version",
  "mexico 70",
  "mexico team",
]);

function normalize(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function flagFromIso(iso: string): string {
  const base = 0x1f1e6 - "A".charCodeAt(0);
  return [...iso.toUpperCase()]
    .map((c) => String.fromCodePoint(base + c.charCodeAt(0)))
    .join("");
}

function lookupIso(key: string): string | undefined {
  const normalized = normalize(key);
  if (!normalized) return undefined;
  if (NON_COUNTRY_EXACT.has(normalized)) return undefined;
  if (NON_COUNTRY_PREFIXES.some((p) => normalized.startsWith(p))) return undefined;
  return ISO_BY_NAME[normalized];
}

export function flagFor(name: string): string | null {
  if (!name || !name.trim()) return null;

  const direct = lookupIso(name);
  if (direct) return flagFromIso(direct);

  const groupSplit = name.split(" - ");
  if (groupSplit.length > 1) {
    const last = groupSplit[groupSplit.length - 1];
    const fromGroup = lookupIso(last);
    if (fromGroup) return flagFromIso(fromGroup);
  }

  const yearStripped = name.replace(/\s+\d{4}\s*$/, "").trim();
  if (yearStripped !== name) {
    const fromYear = lookupIso(yearStripped);
    if (fromYear) return flagFromIso(fromYear);
  }

  return null;
}
