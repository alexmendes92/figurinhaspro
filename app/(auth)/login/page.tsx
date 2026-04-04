"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
        <div className="relative text-center px-12">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-amber-500/30">
            <span className="text-white text-3xl font-black font-[family-name:var(--font-geist-mono)]">F</span>
          </div>
          <h2 className="text-4xl font-black text-white tracking-tight mb-3">
            Figurinhas<span className="text-amber-400">Pro</span>
          </h2>
          <p className="text-gray-400 text-sm max-w-xs mx-auto leading-relaxed">
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
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20">
              <span className="text-white text-xl font-black font-[family-name:var(--font-geist-mono)]">F</span>
            </div>
          </div>

          <h1 className="text-2xl font-black text-white mb-1">Entrar</h1>
          <p className="text-sm text-gray-500 mb-8">Acesse o painel da sua loja</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[13px] font-medium">{error}</div>
            )}

            <div>
              <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Email</label>
              <input
                name="email" type="email" required
                placeholder="seu@email.com"
                className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/10 transition-all"
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Senha</label>
              <div className="relative">
                <input
                  name="password" type={showPassword ? "text" : "password"} required
                  placeholder="Sua senha"
                  className="w-full px-4 py-3 pr-11 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="flex justify-end mt-2">
                <Link href="/esqueci-senha" className="text-[12px] text-gray-500 hover:text-amber-400 transition-colors">
                  Esqueci minha senha
                </Link>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-sm transition-all shadow-xl shadow-amber-500/20 hover:shadow-amber-500/30 disabled:opacity-50 cursor-pointer">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Entrando...
                </span>
              ) : "Entrar"}
            </button>
          </form>

          <p className="text-center text-[13px] text-gray-500 mt-8">
            Não tem conta?{" "}
            <Link href="/registro" className="text-amber-400 hover:text-amber-300 font-semibold transition-colors">Criar conta gratis</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
