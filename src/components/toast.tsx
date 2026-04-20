"use client";

import { useToast } from "@/lib/toast-context";

const variantStyles = {
  default: "bg-amber-500 text-black shadow-lg shadow-amber-500/20",
  success: "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20",
  error: "bg-red-500 text-white shadow-lg shadow-red-500/20",
};

export default function Toast() {
  const { messages } = useToast();

  if (messages.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`px-4 py-2.5 rounded-lg text-sm font-medium ${variantStyles[msg.variant]} ${
            msg.exiting ? "toast-exit" : "toast-enter"
          }`}
        >
          {msg.text}
        </div>
      ))}
    </div>
  );
}
