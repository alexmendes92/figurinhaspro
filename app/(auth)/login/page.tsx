"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthLogo } from "@/components/auth/auth-logo";
import { AuthInput } from "@/components/auth/auth-input";
import { AuthButton } from "@/components/auth/auth-button";
import { AuthError } from "@/components/auth/auth-error";
import { AuthFooterLink } from "@/components/auth/auth-footer-link";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
    });
    if (!res.ok) { const d = await res.json(); setError(d.error || "Erro"); setLoading(false); return; }
    router.push("/painel");
  }

  return (
    <div className="min-h-screen flex bg-[#0b0e14]">
      {/* Lado esquerdo — branding */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden bg-gradient-to-br from-amber-950 via-[#0b0e14] to-[#0b0e14]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(245,158,11,0.12),transparent_60%)]" />
        {/* Grid pattern background */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        <div className="relative text-center px-12">
          <AuthLogo size="lg" showText />
          <p className="text-gray-400 text-sm max-w-xs mx-auto leading-relaxed mt-4">
            A plataforma profissional para revendedores de figurinhas Panini de Copa do Mundo.
          </p>
          <div className="flex items-center justify-center gap-8 mt-10">
            {[{ v: "7.122", l: "figurinhas" }, { v: "13", l: "Copas" }, { v: "1970–2026", l: "cobertura" }].map((s) => (
              <div key={s.l} className="text-center">
                <p className="text-lg font-bold font-[family-name:var(--font-geist-mono)] text-amber-400">{s.v}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lado direito — form */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm slide-up">
          <div className="lg:hidden text-center mb-10">
            <AuthLogo size="md" />
          </div>

          <h1 className="text-2xl font-black text-white mb-1">Entrar</h1>
          <p className="text-sm text-gray-500 mb-8">Acesse o painel da sua loja</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <AuthError message={error} />

            <AuthInput
              id="login-email"
              name="email"
              type="email"
              required
              label="Email"
              placeholder="seu@email.com"
              icon="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
              autoComplete="email"
            />

            <div>
              <AuthInput
                id="login-password"
                name="password"
                required
                label="Senha"
                placeholder="Sua senha"
                isPassword
                icon="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                autoComplete="current-password"
              />
              <div className="flex justify-end mt-2">
                <Link href="/esqueci-senha" className="text-[12px] text-gray-500 hover:text-amber-400 transition-colors">
                  Esqueci minha senha
                </Link>
              </div>
            </div>

            <AuthButton id="login-submit" type="submit" loading={loading}>
              Entrar
            </AuthButton>
          </form>

          <AuthFooterLink text="Não tem conta?" linkText="Criar conta gratis" href="/registro" />
        </div>
      </div>
    </div>
  );
}
