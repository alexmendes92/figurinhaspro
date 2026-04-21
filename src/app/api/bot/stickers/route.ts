// src/app/api/bot/stickers/route.ts
// Busca publica de figurinhas para o bot WhatsApp. Sem HMAC (leitura only).
// Filtro: ?seller=<shopSlug>&q=<termo>&album=<slug>&limit=<n>

import { type NextRequest, NextResponse } from "next/server";
import { searchBotStickers } from "@/lib/bot-search";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const seller = req.nextUrl.searchParams.get("seller");
  const q = req.nextUrl.searchParams.get("q") ?? undefined;
  const albumSlug = req.nextUrl.searchParams.get("album") ?? undefined;
  const limitRaw = req.nextUrl.searchParams.get("limit");
  const limit = limitRaw ? Number.parseInt(limitRaw, 10) : 5;

  if (!seller) {
    return NextResponse.json(
      { error: "missing_seller", message: "Query param 'seller' e obrigatorio (shopSlug)" },
      { status: 400 },
    );
  }

  const sellerRow = await db.seller.findUnique({
    where: { shopSlug: seller },
    select: { id: true, shopSlug: true, shopName: true },
  });

  if (!sellerRow) {
    return NextResponse.json(
      { error: "seller_not_found", message: `Seller '${seller}' nao existe` },
      { status: 404 },
    );
  }

  const host = req.headers.get("host") ?? "localhost:3009";
  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  const baseUrl = `${proto}://${host}`;

  const results = await searchBotStickers({
    sellerId: sellerRow.id,
    query: q,
    albumSlug,
    limit: Number.isNaN(limit) ? 5 : limit,
    baseUrl,
  });

  return NextResponse.json({
    seller: { shopSlug: sellerRow.shopSlug, shopName: sellerRow.shopName },
    count: results.length,
    stickers: results,
  });
}
