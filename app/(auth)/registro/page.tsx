"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthLogo } from "@/components/auth/auth-logo";
import { AuthInput } from "@/components/auth/auth-input";
import { AuthButton } from "@/components/auth/auth-button";
import { AuthError } from "@/components/auth/auth-error";
import { AuthFooterLink } from "@/components/auth/auth-footer-link";
import { PasswordStrength } from "@/components/auth/auth-password-strength";

export default function RegistroPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
        shopName: form.get("shopName"),
        phone: form.get("phone") || undefined,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Erro ao criar conta");
      setLoading(false);
      return;
    }
    router.push("/onboarding");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-[#0b0e14]">
      <div className="w-full max-w-md slide-up">
        <div className="rounded-2xl border border-white/[0.06] bg-[#0f1219]/95 p-8 shadow-2xl shadow-black/50 backdrop-blur-sm">
          {/* Logo */}
          <div className="text-center mb-8">
            <AuthLogo size="md" />
            <h1 className="text-2xl font-bold tracking-tight text-white mt-5">Criar conta</h1>
            <p className="text-sm text-gray-400 mt-1">Comece a vender figurinhas avulsas</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AuthError message={error} />

            <div className="grid grid-cols-2 gap-3">
              <AuthInput
                id="registro-name"
                name="name"
                required
                label="Seu nome"
                placeholder="João Silva"
                icon="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                autoComplete="name"
              />
              <AuthInput
                id="registro-phone"
                name="phone"
                type="tel"
                label="WhatsApp"
                placeholder="(11) 99999-9999"
                icon="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
              />
            </div>

            <AuthInput
              id="registro-shopName"
              name="shopName"
              required
              label="Nome da loja"
              placeholder="Figurinhas do João"
              hint="Será a URL da sua vitrine: /loja/figurinhas-do-joao"
              icon="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016A3.001 3.001 0 0021 9.349"
            />

            <AuthInput
              id="registro-email"
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
                id="registro-password"
                name="password"
                required
                minLength={6}
                label="Senha"
                placeholder="Mínimo 6 caracteres"
                isPassword
                icon="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                autoComplete="new-password"
                onChange={(e) => setPassword(e.target.value)}
              />
              <PasswordStrength password={password} />
            </div>

            <AuthButton id="registro-submit" type="submit" loading={loading}>
              Criar conta grátis
            </AuthButton>
          </form>

          <AuthFooterLink text="Já tem conta?" linkText="Entrar" href="/login" />
        </div>
      </div>
    </div>
  );
}
