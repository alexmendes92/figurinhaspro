"use client";

import { useState } from "react";
import { useToast } from "@/lib/toast-context";

interface LojaEditorProps {
  shopName: string;
  phone: string | null;
  email: string;
  plan: string;
}

export default function LojaEditor({ shopName: initialName, phone: initialPhone, email, plan }: LojaEditorProps) {
  const toast = useToast();
  const [shopName, setShopName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/seller", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopName, phone }),
      });
      if (res.ok) {
        setSaved(true);
        setEditing(false);
        toast.success("Dados da loja salvos");
        setTimeout(() => setSaved(false), 2000);
      } else {
        toast.error("Erro ao salvar dados da loja");
      }
    } catch {
      toast.error("Erro de conexão ao salvar");
    }
    setSaving(false);
  }

  const infoItems = [
    {
      label: "Nome da loja",
      value: editing ? (
        <input
          value={shopName}
          onChange={(e) => setShopName(e.target.value)}
          className="bg-transparent border border-[var(--border)] rounded-lg px-2 py-1 text-sm font-medium w-48 text-right focus:outline-none focus:border-[var(--accent)]"
        />
      ) : (
        <span className="text-sm font-medium">{shopName}</span>
      ),
    },
    {
      label: "WhatsApp",
      value: editing ? (
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="(11) 99999-9999"
          className="bg-transparent border border-[var(--border)] rounded-lg px-2 py-1 text-sm font-medium w-48 text-right focus:outline-none focus:border-[var(--accent)]"
        />
      ) : (
        <span className={`text-sm font-medium ${!phone ? "text-zinc-600" : ""}`}>
          {phone || "Não configurado"}
        </span>
      ),
    },
    {
      label: "Email",
      value: <span className="text-sm font-medium">{email}</span>,
    },
    {
      label: "Plano",
      value: <span className="badge badge-amber">{plan}</span>,
    },
  ];

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden mb-6">
      <div className="px-5 py-3 border-b border-[var(--border)] flex items-center justify-between">
        <p className="text-xs font-semibold text-[var(--muted)]">Informações</p>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-[10px] text-[var(--success)] flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Salvo
            </span>
          )}
          {editing ? (
            <div className="flex gap-1.5">
              <button
                onClick={() => {
                  setShopName(initialName);
                  setPhone(initialPhone || "");
                  setEditing(false);
                }}
                className="text-[10px] text-zinc-500 hover:text-white px-2 py-1 rounded-lg border border-[var(--border)] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="text-[10px] text-black font-semibold bg-[var(--accent)] hover:brightness-110 px-2.5 py-1 rounded-lg transition-all disabled:opacity-50"
              >
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="text-[10px] text-[var(--accent)] hover:underline font-medium"
            >
              Editar
            </button>
          )}
        </div>
      </div>
      {infoItems.map((item, i) => (
        <div
          key={item.label}
          className={`px-5 py-3 flex items-center justify-between ${
            i > 0 ? "border-t border-[var(--border)]" : ""
          }`}
        >
          <span className="text-xs text-[var(--muted)]">{item.label}</span>
          {item.value}
        </div>
      ))}
    </div>
  );
}
