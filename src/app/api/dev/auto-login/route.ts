import { type NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { evaluateAutoLogin } from "./handler";

// Endpoint dev-only para bootstrap de sessão em testes de UI automatizados
// (skill p8-master:p8-auth). Triple-guard impede acesso em prod:
//   1) VERCEL_ENV === "production" → 404
//   2) DEV_AUTO_LOGIN_TOKEN ausente → 404
//   3) ?token= não bate → 401
// Sem opt-in via env var, o endpoint é invisível.
export async function GET(req: NextRequest) {
  const decision = evaluateAutoLogin({
    vercelEnv: process.env.VERCEL_ENV,
    expectedToken: env.DEV_AUTO_LOGIN_TOKEN,
    providedToken: req.nextUrl.searchParams.get("token"),
    nextPath: req.nextUrl.searchParams.get("next"),
  });

  if (decision.kind === "not-found") {
    return new NextResponse("Not Found", { status: 404 });
  }
  if (decision.kind === "unauthorized") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const emailParam = req.nextUrl.searchParams.get("email");
  const seller = emailParam
    ? await db.seller.findUnique({ where: { email: emailParam } })
    : (await db.seller.findMany({ orderBy: { createdAt: "asc" }, take: 1 }))[0];

  if (!seller) {
    return new NextResponse("No seller available", { status: 404 });
  }

  await createSession(seller.id);

  console.log(
    `[dev-auto-login] vercelEnv=${process.env.VERCEL_ENV ?? "local"} sellerId=${seller.id} email=${seller.email} next=${decision.nextPath}`,
  );

  return NextResponse.redirect(new URL(decision.nextPath, req.url));
}
