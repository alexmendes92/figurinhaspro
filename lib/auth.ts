import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { db } from "./db";

interface SessionData {
  sellerId?: string;
}

const SESSION_OPTIONS = {
  password:
    process.env.SESSION_SECRET ||
    "dev-secret-must-be-at-least-32-characters-long!",
  cookieName: "fp_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 30, // 30 dias
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(
    cookieStore,
    SESSION_OPTIONS
  );

  if (!session.sellerId) return null;

  const seller = await db.seller.findUnique({
    where: { id: session.sellerId },
  });
  return seller;
}

export async function createSession(sellerId: string) {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(
    cookieStore,
    SESSION_OPTIONS
  );
  session.sellerId = sellerId;
  await session.save();
}

export async function destroySession() {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(
    cookieStore,
    SESSION_OPTIONS
  );
  session.destroy();
}
