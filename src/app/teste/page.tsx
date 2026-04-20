"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

type StepStatus = "idle" | "running" | "pass" | "fail" | "skip";

interface Step {
  id: string;
  label: string;
  description: string;
  status: StepStatus;
  result?: string;
  duration?: number;
}

interface FlowConfig {
  email: string;
  password: string;
  name: string;
  shopName: string;
  phone: string;
}

const DEFAULT_CONFIG: FlowConfig = {
  email: `teste${Date.now()}@figurinhaspro.com`,
  password: "Teste@123",
  name: "Vendedor Teste",
  shopName: `Loja Teste ${Date.now()}`,
  phone: "(11) 99999-0000",
};

const INITIAL_STEPS: Step[] = [
  { id: "register", label: "1. Registro", description: "Criar conta de vendedor", status: "idle" },
  { id: "logout-1", label: "2. Logout", description: "Deslogar da conta criada", status: "idle" },
  { id: "login", label: "3. Login", description: "Autenticar com a conta criada", status: "idle" },
  {
    id: "dashboard",
    label: "4. Dashboard",
    description: "Verificar painel carrega com dados",
    status: "idle",
  },
  {
    id: "prices",
    label: "5. Precos",
    description: "Verificar regras de preco padrao criadas",
    status: "idle",
  },
  {
    id: "update-price",
    label: "6. Atualizar Preco",
    description: "Alterar preco de figurinha regular",
    status: "idle",
  },
  {
    id: "inventory",
    label: "7. Estoque",
    description: "Adicionar figurinha ao estoque",
    status: "idle",
  },
  {
    id: "store-public",
    label: "8. Loja Publica",
    description: "Verificar vitrine publica do vendedor",
    status: "idle",
  },
  {
    id: "create-order",
    label: "9. Criar Pedido",
    description: "Simular pedido via API da loja",
    status: "idle",
  },
  {
    id: "check-order",
    label: "10. Verificar Pedido",
    description: "Checar pedido aparece nos pedidos do vendedor",
    status: "idle",
  },
  {
    id: "update-order",
    label: "11. Atualizar Status",
    description: "Confirmar pedido (QUOTE → CONFIRMED)",
    status: "idle",
  },
  {
    id: "seller-update",
    label: "12. Editar Loja",
    description: "Atualizar nome da loja e telefone",
    status: "idle",
  },
];

async function timed<T>(fn: () => Promise<T>): Promise<{ data: T; ms: number }> {
  const t0 = performance.now();
  const data = await fn();
  return { data, ms: Math.round(performance.now() - t0) };
}

export default function TestPage() {
  const [steps, setSteps] = useState<Step[]>(INITIAL_STEPS);
  const [config, setConfig] = useState<FlowConfig>(DEFAULT_CONFIG);
  const [running, setRunning] = useState(false);
  const [shopSlug, setShopSlug] = useState("");
  const [orderId, setOrderId] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const [showConfig, setShowConfig] = useState(false);

  const addLog = useCallback((msg: string) => {
    setLog((prev) => [...prev, `[${new Date().toLocaleTimeString("pt-BR")}] ${msg}`]);
  }, []);

  const updateStep = useCallback((id: string, update: Partial<Step>) => {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, ...update } : s)));
  }, []);

  async function runAll() {
    setRunning(true);
    setLog([]);
    setSteps(INITIAL_STEPS);
    addLog("Iniciando fluxo de teste e2e...");
    addLog(`Email: ${config.email}`);
    addLog(`Loja: ${config.shopName}`);

    let currentSlug = "";
    let currentOrderId = "";

    // 1. Registro
    updateStep("register", { status: "running" });
    try {
      const { data: res, ms } = await timed(() =>
        fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: config.name,
            email: config.email,
            password: config.password,
            shopName: config.shopName,
            phone: config.phone,
          }),
        })
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
      currentSlug = body.shopSlug;
      setShopSlug(body.shopSlug);
      updateStep("register", { status: "pass", result: `Slug: ${body.shopSlug}`, duration: ms });
      addLog(`Registro OK — slug: ${body.shopSlug} (${ms}ms)`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      updateStep("register", { status: "fail", result: msg });
      addLog(`Registro FALHOU: ${msg}`);
      setRunning(false);
      return;
    }

    // 2. Logout
    updateStep("logout-1", { status: "running" });
    try {
      const { ms } = await timed(() => fetch("/api/auth/logout", { method: "POST" }));
      updateStep("logout-1", { status: "pass", result: "Sessao encerrada", duration: ms });
      addLog(`Logout OK (${ms}ms)`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      updateStep("logout-1", { status: "fail", result: msg });
      addLog(`Logout FALHOU: ${msg}`);
    }

    // 3. Login
    updateStep("login", { status: "running" });
    try {
      const { data: res, ms } = await timed(() =>
        fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: config.email, password: config.password }),
        })
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
      updateStep("login", { status: "pass", result: `User: ${body.name}`, duration: ms });
      addLog(`Login OK — ${body.name} (${ms}ms)`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      updateStep("login", { status: "fail", result: msg });
      addLog(`Login FALHOU: ${msg}`);
      setRunning(false);
      return;
    }

    // 4. Dashboard (verifica sessao funciona)
    updateStep("dashboard", { status: "running" });
    try {
      const { data: res, ms } = await timed(() =>
        fetch("/api/inventory?album=panini_fifa_world_cup_2022")
      );
      if (!res.ok) throw new Error(`HTTP ${res.status} — sessao invalida?`);
      const body = await res.json();
      updateStep("dashboard", {
        status: "pass",
        result: `${body.length} itens no estoque`,
        duration: ms,
      });
      addLog(`Dashboard OK — estoque acessivel (${ms}ms)`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      updateStep("dashboard", { status: "fail", result: msg });
      addLog(`Dashboard FALHOU: ${msg}`);
    }

    // 5. Verificar precos padrao
    updateStep("prices", { status: "running" });
    try {
      const { data: res, ms } = await timed(() => fetch("/api/prices"));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const rules = await res.json();
      const types = rules.map((r: { stickerType: string }) => r.stickerType).join(", ");
      updateStep("prices", {
        status: rules.length >= 3 ? "pass" : "fail",
        result: `${rules.length} regras: ${types}`,
        duration: ms,
      });
      addLog(`Precos OK — ${rules.length} regras (${ms}ms)`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      updateStep("prices", { status: "fail", result: msg });
      addLog(`Precos FALHOU: ${msg}`);
    }

    // 6. Atualizar preco
    updateStep("update-price", { status: "running" });
    try {
      const { data: res, ms } = await timed(() =>
        fetch("/api/prices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stickerType: "regular", price: 3.0, albumSlug: null }),
        })
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
      updateStep("update-price", {
        status: "pass",
        result: `Regular: R$${body.price}`,
        duration: ms,
      });
      addLog(`Preco atualizado — regular: R$${body.price} (${ms}ms)`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      updateStep("update-price", { status: "fail", result: msg });
      addLog(`Preco FALHOU: ${msg}`);
    }

    // 7. Adicionar estoque
    updateStep("inventory", { status: "running" });
    try {
      const { data: res, ms } = await timed(() =>
        fetch("/api/inventory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            albumSlug: "panini_fifa_world_cup_2022",
            stickerCode: "QAT1",
            quantity: 3,
            customPrice: null,
          }),
        })
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
      updateStep("inventory", { status: "pass", result: `QAT1 x${body.quantity}`, duration: ms });
      addLog(`Estoque OK — QAT1 x${body.quantity} (${ms}ms)`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      updateStep("inventory", { status: "fail", result: msg });
      addLog(`Estoque FALHOU: ${msg}`);
    }

    // 8. Loja publica
    updateStep("store-public", { status: "running" });
    try {
      const { data: res, ms } = await timed(() => fetch(`/loja/${currentSlug}`));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      const hasShopName = html.includes(config.shopName);
      updateStep("store-public", {
        status: hasShopName ? "pass" : "fail",
        result: hasShopName
          ? `Loja renderiza com "${config.shopName}"`
          : "Nome da loja nao encontrado no HTML",
        duration: ms,
      });
      addLog(`Loja publica ${hasShopName ? "OK" : "FALHOU"} (${ms}ms)`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      updateStep("store-public", { status: "fail", result: msg });
      addLog(`Loja publica FALHOU: ${msg}`);
    }

    // 9. Criar pedido
    updateStep("create-order", { status: "running" });
    try {
      const { data: res, ms } = await timed(() =>
        fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sellerSlug: currentSlug,
            customerName: "Cliente Teste",
            customerPhone: "(11) 98888-0000",
            channel: "SYSTEM",
            items: [
              {
                albumSlug: "panini_fifa_world_cup_2022",
                stickerCode: "QAT1",
                stickerName: "Qatar - Escudo",
                quantity: 2,
                unitPrice: 3.0,
              },
            ],
          }),
        })
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
      currentOrderId = body.id;
      setOrderId(body.id);
      updateStep("create-order", {
        status: "pass",
        result: `Pedido ${body.id.slice(0, 8)}... R$${body.totalPrice}`,
        duration: ms,
      });
      addLog(`Pedido criado — ID: ${body.id} Total: R$${body.totalPrice} (${ms}ms)`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      updateStep("create-order", { status: "fail", result: msg });
      addLog(`Pedido FALHOU: ${msg}`);
    }

    // 10. Verificar pedido nos pedidos do vendedor
    updateStep("check-order", { status: "running" });
    try {
      const { data: res, ms } = await timed(() => fetch("/api/orders"));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const orders = await res.json();
      const found = orders.find((o: { id: string }) => o.id === currentOrderId);
      updateStep("check-order", {
        status: found ? "pass" : "fail",
        result: found
          ? `Status: ${found.status} — ${found.items.length} itens`
          : "Pedido nao encontrado",
        duration: ms,
      });
      addLog(`Verificacao pedido ${found ? "OK" : "FALHOU"} (${ms}ms)`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      updateStep("check-order", { status: "fail", result: msg });
      addLog(`Verificacao pedido FALHOU: ${msg}`);
    }

    // 11. Atualizar status do pedido
    updateStep("update-order", { status: "running" });
    if (!currentOrderId) {
      updateStep("update-order", { status: "skip", result: "Sem pedido para atualizar" });
      addLog("Update status SKIP — sem pedido");
    } else {
      try {
        const { data: res, ms } = await timed(() =>
          fetch(`/api/orders/${currentOrderId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "CONFIRMED" }),
          })
        );
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
        updateStep("update-order", {
          status: body.status === "CONFIRMED" ? "pass" : "fail",
          result: `Status: ${body.status}`,
          duration: ms,
        });
        addLog(`Status atualizado — ${body.status} (${ms}ms)`);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        updateStep("update-order", { status: "fail", result: msg });
        addLog(`Update status FALHOU: ${msg}`);
      }
    }

    // 12. Editar loja
    updateStep("seller-update", { status: "running" });
    try {
      const { data: res, ms } = await timed(() =>
        fetch("/api/seller", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shopName: `${config.shopName} Editada`,
            phone: "(11) 91111-2222",
          }),
        })
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
      updateStep("seller-update", {
        status: "pass",
        result: `Loja: ${body.shopName}`,
        duration: ms,
      });
      addLog(`Loja editada — ${body.shopName} (${ms}ms)`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      updateStep("seller-update", { status: "fail", result: msg });
      addLog(`Editar loja FALHOU: ${msg}`);
    }

    // Resumo
    setSteps((prev) => {
      const passed = prev.filter((s) => s.status === "pass").length;
      const failed = prev.filter((s) => s.status === "fail").length;
      const skipped = prev.filter((s) => s.status === "skip").length;
      addLog(
        `\nRESUMO: ${passed} passed, ${failed} failed, ${skipped} skipped de ${prev.length} steps`
      );
      return prev;
    });

    setRunning(false);
  }

  const passed = steps.filter((s) => s.status === "pass").length;
  const failed = steps.filter((s) => s.status === "fail").length;
  const total = steps.length;

  const statusIcon: Record<StepStatus, string> = {
    idle: "text-zinc-600",
    running: "text-amber-400 animate-pulse",
    pass: "text-emerald-400",
    fail: "text-red-400",
    skip: "text-zinc-500",
  };

  const statusEmoji: Record<StepStatus, string> = {
    idle: "○",
    running: "◉",
    pass: "✓",
    fail: "✗",
    skip: "—",
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#09090b]/80 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/painel" className="text-zinc-500 hover:text-white transition-colors">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-sm font-bold">Teste E2E</h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
              Manual
            </span>
          </div>
          {passed + failed > 0 && (
            <div className="flex items-center gap-3 text-xs font-[family-name:var(--font-geist-mono)]">
              <span className="text-emerald-400">{passed} pass</span>
              {failed > 0 && <span className="text-red-400">{failed} fail</span>}
              <span className="text-zinc-500">/ {total}</span>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Descricao */}
        <div className="mb-6">
          <p className="text-zinc-400 text-sm">
            Executa o fluxo completo: Registro &rarr; Login &rarr; Dashboard &rarr; Precos &rarr;
            Estoque &rarr; Loja Publica &rarr; Pedido &rarr; Status
          </p>
        </div>

        {/* Config colapsavel */}
        <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="w-full px-4 py-3 flex items-center justify-between text-sm font-medium text-zinc-300 hover:bg-zinc-800/50 transition-colors"
          >
            <span>Configuracao do teste</span>
            <svg
              className={`w-4 h-4 text-zinc-500 transition-transform ${showConfig ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showConfig && (
            <div className="px-4 pb-4 space-y-3 border-t border-zinc-800">
              <div className="grid grid-cols-2 gap-3 pt-3">
                {(Object.keys(config) as (keyof FlowConfig)[]).map((key) => (
                  <div key={key}>
                    <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
                      {key}
                    </label>
                    <input
                      value={config[key]}
                      onChange={(e) => setConfig({ ...config, [key]: e.target.value })}
                      disabled={running}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-xs font-[family-name:var(--font-geist-mono)] focus:outline-none focus:border-amber-500/50 disabled:opacity-50"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Botao principal */}
        <button
          onClick={runAll}
          disabled={running}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-sm transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mb-8"
        >
          {running ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Executando...
            </span>
          ) : (
            "Executar Fluxo Completo"
          )}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Steps */}
          <div>
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
              Steps
            </h2>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 divide-y divide-zinc-800/50">
              {steps.map((step) => (
                <div key={step.id} className="px-4 py-3 flex items-start gap-3">
                  <span
                    className={`font-[family-name:var(--font-geist-mono)] text-sm font-bold mt-0.5 ${statusIcon[step.status]}`}
                  >
                    {statusEmoji[step.status]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white">{step.label}</p>
                      {step.duration !== undefined && (
                        <span className="text-[10px] text-zinc-600 font-[family-name:var(--font-geist-mono)]">
                          {step.duration}ms
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-500">{step.description}</p>
                    {step.result && (
                      <p
                        className={`text-[11px] font-[family-name:var(--font-geist-mono)] mt-1 ${
                          step.status === "pass"
                            ? "text-emerald-400/70"
                            : step.status === "fail"
                              ? "text-red-400/70"
                              : "text-zinc-500"
                        }`}
                      >
                        {step.result}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Log */}
          <div>
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
              Log
            </h2>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 h-[560px] overflow-y-auto">
              {log.length === 0 ? (
                <p className="text-zinc-600 text-xs text-center mt-8">
                  Clique em &quot;Executar&quot; para iniciar
                </p>
              ) : (
                <pre className="text-[11px] text-zinc-400 font-[family-name:var(--font-geist-mono)] whitespace-pre-wrap leading-relaxed">
                  {log.join("\n")}
                </pre>
              )}
            </div>
          </div>
        </div>

        {/* Links uteis */}
        {shopSlug && (
          <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
              Links do teste
            </h3>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/loja/${shopSlug}`}
                target="_blank"
                className="text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors"
              >
                Loja publica &rarr;
              </Link>
              {orderId && (
                <span className="text-xs text-zinc-500 font-[family-name:var(--font-geist-mono)]">
                  Pedido: {orderId.slice(0, 12)}...
                </span>
              )}
              <Link
                href="/painel"
                className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                Dashboard &rarr;
              </Link>
              <Link
                href="/painel/pedidos"
                className="text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors"
              >
                Pedidos &rarr;
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
