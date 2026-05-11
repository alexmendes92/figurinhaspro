/**
 * Cache tag helper para a vitrine pública /loja/[slug]/[albumSlug].
 *
 * Vetor B1 (Fase 5.3, plano v6): dois sellers com mesmo albumSlug NÃO podem
 * compartilhar a mesma chave de cache. A tag inclui sempre seller.id pra
 * isolar — sem isso, request a /loja/A/copa-2022 poderia retornar HTML
 * cacheado de /loja/B/copa-2022 (seller.phone, paymentMethods etc).
 *
 * Uso:
 * - Dentro de função `'use cache'`: `cacheTag(storeCacheTag(sellerId, albumSlug))`
 * - Em Route Handler que muda inventory: `revalidateTag(storeCacheTag(sellerId, albumSlug))`
 * - Em Server Action: `updateTag(storeCacheTag(sellerId, albumSlug))`
 */
export function storeCacheTag(sellerId: string, albumSlug: string): string {
  return `store-${sellerId}-${albumSlug}`;
}
