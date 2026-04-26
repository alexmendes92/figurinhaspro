import {
  instagramStoriesCaption,
  whatsappGroupTemplate,
  whatsappOldClientTemplate,
} from "./share-templates";

const SAMPLE_URL = "https://album-digital-ashen.vercel.app/loja/santana";
const EMOJI_REGEX = /\p{Extended_Pictographic}/u;
const PTBR_KEYWORD = /figurinha|álbum|loja|estoque|pedido|vitrine/i;

const templates = [
  { name: "whatsappGroupTemplate", fn: whatsappGroupTemplate },
  { name: "whatsappOldClientTemplate", fn: whatsappOldClientTemplate },
  { name: "instagramStoriesCaption", fn: instagramStoriesCaption },
];

describe.each(templates)("$name", ({ fn }) => {
  it("inclui a URL fornecida no corpo da mensagem", () => {
    expect(fn(SAMPLE_URL)).toContain(SAMPLE_URL);
  });

  it("não contém emoji", () => {
    expect(fn(SAMPLE_URL)).not.toMatch(EMOJI_REGEX);
  });

  it("contém pelo menos uma palavra-chave em PT-BR do domínio", () => {
    expect(fn(SAMPLE_URL).toLowerCase()).toMatch(PTBR_KEYWORD);
  });

  it("tem tamanho entre 50 e 500 caracteres (mensagem operacional)", () => {
    const result = fn(SAMPLE_URL);
    expect(result.length).toBeGreaterThanOrEqual(50);
    expect(result.length).toBeLessThanOrEqual(500);
  });
});
