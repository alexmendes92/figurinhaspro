"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AuthButton } from "@/components/auth/auth-button";
import { AuthError } from "@/components/auth/auth-error";
import { AuthInput } from "@/components/auth/auth-input";
import { AuthLogo } from "@/components/auth/auth-logo";
import { PasswordStrength } from "@/components/auth/auth-password-strength";
import { AuthSuccess } from "@/components/auth/auth-success";

export default function ResetSenhaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("As senhas não coincidem");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (res.ok) {
        setDone(true);
        setTimeout(() => router.push("/login"), 3000);
      } else {
        const data = await res.json();
        setError(data.error || "Erro ao redefinir senha");
      }
    } catch {
      setError("Erro de conexão");
    }
    setLoading(false);
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#0b0e14]">
        <div className="text-center space-y-4 slide-up">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
            <svg
              className="w-7 h-7 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
          <p className="text-red-400 font-medium">Link inválido ou expirado</p>
          <Link
            href="/esqueci-senha"
            className="inline-flex px-6 py-3 rounded-xl border border-white/10 text-gray-300 text-sm font-medium hover:bg-white/[0.04] transition-all"
          >
            Solicitar novo link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#0b0e14]">
      <div className="w-full max-w-sm slide-up">
        <div className="text-center mb-8">
          <AuthLogo size="md" />
        </div>

        {done ? (
          <AuthSuccess
            icon="check"
            title="Senha redefinida!"
            description="Redirecionando para o login..."
          />
        ) : (
          <>
            <h1 className="text-2xl font-black text-white mb-1">Nova senha</h1>
            <p className="text-sm text-gray-500 mb-8">Defina uma nova senha para sua conta.</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <AuthError message={error} />

              <div>
                <AuthInput
                  id="reset-password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  label="Nova senha"
                  placeholder="Mínimo 6 caracteres"
                  isPassword
                  icon="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                  autoComplete="new-password"
                />
                <PasswordStrength password={password} />
              </div>

              <AuthInput
                id="reset-confirm"
                required
                minLength={6}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                label="Confirmar senha"
                placeholder="Repita a senha"
                isPassword
                icon="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                autoComplete="new-password"
              />

              <AuthButton id="reset-submit" type="submit" loading={loading}>
                Redefinir senha
              </AuthButton>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
