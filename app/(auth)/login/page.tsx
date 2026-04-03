"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
      <div className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden bg-gradient-to-br from-emerald-950 via-[#0b0e14] to-[#0b0e14]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(16,185,129,0.12),transparent_60%)]" />
        <div className="relative text-center px-12">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-500/30">
            <span className="text-white text-3xl font-black font-[family-name:var(--font-geist-mono)]">F</span>
          </div>
          <h2 className="text-4xl font-black text-white tracking-tight mb-3">
            Figurinhas<span className="text-emerald-400">Pro</span>
          </h2>
          <p className="text-gray-400 text-sm max-w-xs mx-auto leading-relaxed">
            A plataforma profissional para revendedores de figurinhas Panini de Copa do Mundo.
          </p>
          <div className="flex items-center justify-center gap-8 mt-10">
            {[{ v: "7.122", l: "figurinhas" }, { v: "13", l: "Copas" }, { v: "1970–2022", l: "cobertura" }].map((s) => (
              <div key={s.l} className="text-center">
                <p className="text-lg font-bold font-[family-name:var(--font-geist-mono)] text-emerald-400">{s.v}</p>
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
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
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
                name="email" type="email" required defaultValue="admin@figurinhas.com"
                className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/10 transition-all"
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Senha</label>
              <input
                name="password" type="password" required defaultValue="123456"
                className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/10 transition-all"
              />
            </div>

            <button type="submit" disabled={loading} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold text-sm transition-all shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/30 disabled:opacity-50 cursor-pointer">
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <p className="text-center text-[13px] text-gray-500 mt-8">
            Não tem conta?{" "}
            <Link href="/registro" className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">Criar conta grátis</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
