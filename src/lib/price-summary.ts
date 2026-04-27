export interface AlbumOverrideSummary {
  count: number;
  isUsingDefaults: boolean;
  label: string;
}

export function summarizeAlbumOverrides(rulesCount: number): AlbumOverrideSummary {
  if (rulesCount <= 0) {
    return { count: 0, isUsingDefaults: true, label: "Usando preços padrão" };
  }
  const noun = rulesCount === 1 ? "personalização" : "personalizações";
  return { count: rulesCount, isUsingDefaults: false, label: `${rulesCount} ${noun}` };
}
