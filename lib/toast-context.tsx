"use client";

import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from "react";

interface ToastMessage {
  id: number;
  text: string;
  exiting: boolean;
}

interface ToastContextType {
  messages: ToastMessage[];
  show: (text: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);
  const timers = useRef<Map<number, NodeJS.Timeout>>(new Map());

  const show = useCallback((text: string) => {
    const id = nextId++;
    setMessages((prev) => [...prev.slice(-2), { id, text, exiting: false }]);

    // Inicia saída após 2s
    const exitTimer = setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, exiting: true } : m))
      );
      // Remove após animação
      const removeTimer = setTimeout(() => {
        setMessages((prev) => prev.filter((m) => m.id !== id));
        timers.current.delete(id);
      }, 300);
      timers.current.set(id, removeTimer);
    }, 2000);
    timers.current.set(id, exitTimer);
  }, []);

  return (
    <ToastContext.Provider value={{ messages, show }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast precisa estar dentro de ToastProvider");
  return ctx;
}
