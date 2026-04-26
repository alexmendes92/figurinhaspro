"use client";

import { useRef, useState } from "react";
import QRCode from "react-qr-code";
import {
  instagramStoriesCaption,
  whatsappGroupTemplate,
  whatsappOldClientTemplate,
} from "@/lib/share-templates";
import { useToast } from "@/lib/toast-context";

interface EmptyOrdersKitProps {
  shopUrl: string;
}

const TEMPLATES = [
  {
    id: "whatsapp-group",
    label: "Grupo de colecionadores",
    sub: "Cole no grupo do WhatsApp",
    builder: whatsappGroupTemplate,
  },
  {
    id: "whatsapp-old-client",
    label: "Cliente antigo",
    sub: "Mensagem 1-pra-1",
    builder: whatsappOldClientTemplate,
  },
  {
    id: "instagram-stories",
    label: "Instagram Stories",
    sub: "Caption pra Story do feed",
    builder: instagramStoriesCaption,
  },
] as const;

export default function EmptyOrdersKit({ shopUrl }: EmptyOrdersKitProps) {
  const toast = useToast();
  const qrRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function copyToClipboard(text: string, id: string, successMsg: string) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "absolute";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      toast.success(successMsg);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      toast.error("Não consegui copiar — selecione manualmente");
    }
  }

  function downloadQrAsPng() {
    const svgEl = qrRef.current?.querySelector("svg");
    if (!svgEl) {
      toast.error("QR code ainda não renderizou");
      return;
    }
    const serialized = new XMLSerializer().serializeToString(svgEl);
    const svgBlob = new Blob([serialized], { type: "image/svg+xml" });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const size = 1024;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        toast.error("Navegador não suporta canvas");
        return;
      }
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        if (!blob) {
          toast.error("Falha ao gerar PNG");
          return;
        }
        const link = document.createElement("a");
        const downloadUrl = URL.createObjectURL(blob);
        link.href = downloadUrl;
        link.download = "qr-vitrine.png";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
        toast.success("QR code baixado");
      }, "image/png");
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      toast.error("Falha ao carregar SVG");
    };
    img.src = url;
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-8">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-lg font-bold tracking-tight">
          Sua vitrine está no ar. Falta o mundo descobrir.
        </h2>
        <p className="text-sm text-[var(--muted)] mt-1.5">
          Compartilha em grupo, Stories ou conversa antiga. O primeiro pedido cai quando o cliente
          certo vê.
        </p>
      </div>

      {/* Bloco 1: link da vitrine */}
      <div className="mb-6 rounded-xl border border-[var(--border)] bg-white/[0.02] p-4 sm:p-5">
        <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">
          Link da sua vitrine
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          <code className="font-[family-name:var(--font-geist-mono)] text-xs sm:text-sm text-amber-300 break-all flex-1 min-w-0">
            {shopUrl}
          </code>
          <button
            type="button"
            onClick={() => copyToClipboard(shopUrl, "link", "Link copiado")}
            className="px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-colors min-h-[44px] sm:min-h-0 shrink-0"
          >
            {copiedId === "link" ? "Copiado" : "Copiar link"}
          </button>
        </div>
      </div>

      {/* Bloco 2: QR code */}
      <div className="mb-6 rounded-xl border border-[var(--border)] bg-white/[0.02] p-4 sm:p-5">
        <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-3">
          QR code para imprimir / loja física
        </p>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <div
            ref={qrRef}
            role="img"
            aria-label={`QR code da vitrine: ${shopUrl}`}
            className="bg-white rounded-lg p-3 sm:p-4 self-start"
          >
            <div className="w-[120px] sm:w-[160px]">
              <QRCode
                value={shopUrl}
                size={256}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                viewBox="0 0 256 256"
              />
            </div>
          </div>
          <div className="flex-1">
            <p className="text-xs text-[var(--muted)] mb-3">
              Imprime e cola na vitrine física, ou compartilha em foto/Stories.
            </p>
            <button
              type="button"
              onClick={downloadQrAsPng}
              className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs text-white font-medium transition-colors min-h-[44px] sm:min-h-0"
            >
              Baixar PNG
            </button>
          </div>
        </div>
      </div>

      {/* Bloco 3: templates de mensagem */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-3">
          Mensagens prontas pra colar
        </p>
        <div className="space-y-3">
          {TEMPLATES.map((t) => {
            const text = t.builder(shopUrl);
            const isCopied = copiedId === t.id;
            return (
              <div
                key={t.id}
                className="rounded-xl border border-[var(--border)] bg-white/[0.02] p-4"
              >
                <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">{t.label}</p>
                    <p className="text-[11px] text-[var(--muted)]">{t.sub}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(text, t.id, "Mensagem copiada")}
                    className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs text-white font-medium transition-colors min-h-[44px] sm:min-h-0 shrink-0"
                  >
                    {isCopied ? "Copiado" : "Copiar"}
                  </button>
                </div>
                <pre className="text-xs text-zinc-300 whitespace-pre-wrap font-sans bg-zinc-900/50 rounded-lg p-3 border border-zinc-800/50">
                  {text}
                </pre>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
