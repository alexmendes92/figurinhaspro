export type FilterMode = "all" | "in-stock" | "missing";

export interface CounterTextInput {
  isSearching: boolean;
  filteredCount: number;
  baseInStock: number;
  baseCount: number;
  filter: FilterMode;
  activeSection: number | "all";
  visibleSectionName: string | null;
  filteredInVisibleSection: number;
  saving: boolean;
}

export interface CounterTextOutput {
  primary: string;
  secondary: string | null;
  contextHint: string | null;
  saving: boolean;
}

// Cenário do bug original (review 2026-05-10): usuário vê "8 exibidas" no header
// enquanto só 3 cards estão visíveis na viewport. Causa: filter=Faltam aplicado
// no álbum inteiro (8) mas scroll observer está em uma seção menor (3 faltantes).
// Solução: hint contextual quando activeSection="all" e a seção visível tem
// uma contagem diferente da contagem total filtrada.
export function buildCounterText(input: CounterTextInput): CounterTextOutput {
  if (input.isSearching) {
    return {
      primary: `${input.filteredCount} encontradas`,
      secondary: null,
      contextHint: null,
      saving: input.saving,
    };
  }

  const primary = `${input.baseInStock}/${input.baseCount} em estoque`;

  if (input.filter === "all") {
    return { primary, secondary: null, contextHint: null, saving: input.saving };
  }

  const secondary = `${input.filteredCount} exibidas`;

  const showHint =
    input.activeSection === "all" &&
    input.visibleSectionName !== null &&
    input.filteredInVisibleSection !== input.filteredCount;

  const contextHint = showHint
    ? `${input.filteredInVisibleSection} nesta seção: ${input.visibleSectionName}`
    : null;

  return { primary, secondary, contextHint, saving: input.saving };
}
