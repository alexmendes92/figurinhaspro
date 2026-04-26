export function whatsappGroupTemplate(shopUrl: string): string {
  return [
    "Pessoal, montei uma loja online com meu estoque de figurinhas. Tem o que falta no álbum de vocês?",
    "",
    shopUrl,
    "",
    "Reserva e pagamento via WhatsApp.",
  ].join("\n");
}

export function whatsappOldClientTemplate(shopUrl: string): string {
  return [
    "Oi, montei uma vitrine online com tudo que tenho disponível. Confere se tem as suas:",
    "",
    shopUrl,
    "",
    "Qualquer dúvida, é só responder aqui.",
  ].join("\n");
}

export function instagramStoriesCaption(shopUrl: string): string {
  return [
    "Loja online no ar. Filtra o que falta no seu álbum e pede direto:",
    "",
    shopUrl,
  ].join("\n");
}
