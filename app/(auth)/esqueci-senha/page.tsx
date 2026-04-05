"use client";

import { useState } from "react";
import { AuthLogo } from "@/components/auth/auth-logo";
import { AuthInput } from "@/components/auth/auth-input";
import { AuthButton } from "@/components/auth/auth-button";
import { AuthError } from "@/components/auth/auth-error";
import { AuthSuccess } from "@/components/auth/auth-success";
import { AuthFooterLink } from "@/components/auth/auth-footer-link";

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
      setError("Erro de conexão");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#0b0e14]">
      <div className="w-full max-w-sm slide-up">
        <div className="text-center mb-8">
          <AuthLogo size="md" />
        </div>

        {sent ? (
          <AuthSuccess
            icon="email"
            title="Verifique seu email"
            description={
              <>
                Se existe uma conta com <strong className="text-white">{email}</strong>, você receberá um link para redefinir sua senha.
              </>
            }
            actionLabel="Voltar ao login"
            actionHref="/login"
          />
        ) : (
          <>
            <h1 className="text-2xl font-black text-white mb-1">Esqueci minha senha</h1>
            <p className="text-sm text-gray-500 mb-8">Enviaremos um link para redefinir sua senha.</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <AuthError message={error} />

              <AuthInput
                id="forgot-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                label="Email"
                placeholder="seu@email.com"
                icon="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                autoComplete="email"
              />

              <AuthButton id="forgot-submit" type="submit" loading={loading}>
                Enviar link de recuperação
              </AuthButton>
            </form>

            <AuthFooterLink text="" linkText="Voltar ao login" href="/login" />
          </>
        )}
      </div>
    </div>
  );
}
