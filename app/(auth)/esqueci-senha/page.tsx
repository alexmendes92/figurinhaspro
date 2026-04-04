"use client";

import { useState } from "react";
import Link from "next/link";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setSent(true);
      } else {
        const data = await res.json();
        setError(data.error || "Erro ao enviar");
      }
    } catch {
      setError("Erro de conexao");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#0b0e14]">
      <div className="w-full max-w-sm slide-up">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20">
            <span className="text-white text-xl font-black font-[family-name:var(--font-geist-mono)]">F</span>
          </div>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
              <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white">Verifique seu email</h2>
            <p className="text-sm text-gray-400">
              Se existe uma conta com <strong className="text-white">{email}</strong>, voce recebera um link para redefinir sua senha.
            </p>
            <Link href="/login" className="inline-flex px-6 py-3 rounded-xl border border-white/10 text-gray-300 text-sm font-medium hover:bg-white/[0.04] transition-all">
              Voltar ao login
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-black text-white mb-1">Esqueci minha senha</h1>
            <p className="text-sm text-gray-500 mb-8">Enviaremos um link para redefinir sua senha.</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[13px] font-medium">{error}</div>
              )}

              <div>
                <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/10 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-sm transition-all shadow-xl shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Enviando..." : "Enviar link de recuperacao"}
              </button>
            </form>

            <p className="text-center text-[13px] text-gray-500 mt-8">
              <Link href="/login" className="text-amber-400 hover:text-amber-300 font-semibold transition-colors">Voltar ao login</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
