"use client";

import { useId } from "react";
import { Button } from "@/components/ui/button";
import { useDialog } from "@/lib/use-dialog";

interface ConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  /** Quando true, desabilita botões e mostra spinner no Confirmar. */
  isConfirming?: boolean;
}

export default function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "default",
  isConfirming = false,
}: ConfirmDialogProps) {
  const dialogRef = useDialog<HTMLDivElement>(open, onCancel);
  const titleId = useId();
  const descId = useId();

  if (!open) return null;

  const dialogRole = variant === "danger" ? "alertdialog" : "dialog";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div
        ref={dialogRef}
        role={dialogRole}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className="relative w-full max-w-sm rounded-2xl border border-white/[0.08] bg-card-elevated p-6 shadow-2xl fade-in"
      >
        <h3 id={titleId} className="text-base font-bold text-white mb-1">
          {title}
        </h3>
        {description && (
          <p id={descId} className="text-sm text-gray-400 leading-relaxed mb-6">
            {description}
          </p>
        )}
        <div className="flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={onCancel} disabled={isConfirming}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === "danger" ? "danger" : "primary"}
            onClick={onConfirm}
            isLoading={isConfirming}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
