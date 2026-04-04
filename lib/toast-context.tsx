"use client";

import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from "react";

type ToastVariant = "default" | "success" | "error";

interface ToastMessage {
  id: number;
  text: string;
  variant: ToastVariant;
  exiting: boolean;
}

interface ToastContextType {
  messages: ToastMessage[];
  show: (text: string, variant?: ToastVariant) => void;
  success: (text: string) => void;
  error: (text: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);
  const timers = useRef<Map<number, NodeJS.Timeout>>(new Map());

  const show = useCallback((text: string, variant: ToastVariant = "default") => {
    const id = nextId++;
    setMessages((prev) => [...prev.slice(-2), { id, text, variant, exiting: false }]);

    const duration = variant === "error" ? 4000 : 2500;

    const exitTimer = setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, exiting: true } : m))
      );
      const removeTimer = setTimeout(() => {
        setMessages((prev) => prev.filter((m) => m.id !== id));
        timers.current.delete(id);
      }, 300);
      timers.current.set(id, removeTimer);
    }, duration);
    timers.current.set(id, exitTimer);
  }, []);

  const success = useCallback((text: string) => show(text, "success"), [show]);
  const error = useCallback((text: string) => show(text, "error"), [show]);

  return (
    <ToastContext.Provider value={{ messages, show, success, error }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast precisa estar dentro de ToastProvider");
  return ctx;
}
