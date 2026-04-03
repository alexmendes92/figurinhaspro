import { cookies } from "next/headers";
import { db } from "./db";

// Sessão simples baseada em cookie
// Em produção, migrar para NextAuth.js com JWT
const SESSION_COOKIE = "seller_session";

export async function getSession() {
  const cookieStore = await cookies();
  const sellerId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sellerId) return null;

  const seller = await db.seller.findUnique({ where: { id: sellerId } });
  return seller;
}

export async function createSession(sellerId: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sellerId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 dias
    path: "/",
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
