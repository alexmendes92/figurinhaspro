"use client";

import { useEffect, useState } from "react";
import { AuthButton } from "@/components/auth/auth-button";
import { AuthFooterLink } from "@/components/auth/auth-footer-link";
import { AuthLogo } from "@/components/auth/auth-logo";

export default function VerificarEmailPage() {
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  async function handleResend() {
    setResending(true);
    // Placeholder — integrar com Resend quando implementado
    await new Promise((r) => setTimeout(r, 1500));
    setResent(true);
    setResending(false);
    setCountdown(60);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#0b0e14]">
      <div className="w-full max-w-sm slide-up text-center">
        <div className="mb-8">
          <AuthLogo size="md" />
        </div>

        {/* Email icon */}
        <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-9 h-9 text-amber-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-black text-white mb-2">Verifique seu email</h1>
        <p className="text-sm text-gray-400 leading-relaxed mb-8">
          Enviamos um link de confirmação para o seu email.
          <br />
          Clique no link para ativar sua conta.
        </p>

        {/* Dicas */}
        <div className="space-y-3 mb-8">
          {[
            {
              icon: "M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859",
              text: "Verifique a caixa de spam",
            },
            {
              icon: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z",
              text: "O link expira em 24 horas",
            },
          ].map((tip) => (
            <div key={tip.text} className="flex items-center gap-3 text-left">
              <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
                <svg
                  className="w-4 h-4 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d={tip.icon} />
                </svg>
              </div>
              <p className="text-[13px] text-gray-400">{tip.text}</p>
            </div>
          ))}
        </div>

        {/* Resend */}
        <AuthButton
          variant="ghost"
          onClick={handleResend}
          loading={resending}
          disabled={countdown > 0 && !resent ? false : countdown > 0}
        >
          {resent && countdown > 0
            ? `Reenviado! Aguarde ${countdown}s`
            : "Reenviar email de confirmação"}
        </AuthButton>

        <AuthFooterLink text="" linkText="Voltar ao login" href="/login" />
      </div>
    </div>
  );
}
