import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";

export async function POST() {
  const seller = await getSession();
  if (!seller || !isAdmin(seller.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Check if already seeded
  const existing = await db.bizKpi.count();
  if (existing > 0) {
    return NextResponse.json({ error: "Already seeded" }, { status: 409 });
  }

  // ===== LEADS =====
  await db.bizLead.createMany({
    data: [
      {
        name: "Banca do Joao - Campinas",
        phone: "(19) 99999-1234",
        source: "INSTAGRAM",
        sourceDetail: "DM apos post de album Copa",
        stage: "NEGOTIATION",
        potentialValue: 79,
        nextStep: "Enviar proposta PRO com desconto de lancamento",
        priority: "HIGH",
        lastContactAt: new Date("2026-03-28"),
      },
      {
        name: "Figurinhas da Mari",
        phone: "(11) 98888-5678",
        email: "mari@figurinhas.com",
        source: "INDICACAO",
        sourceDetail: "Indicacao do cliente Pedro",
        stage: "DEMO",
        potentialValue: 39,
        nextStep: "Agendar demo da plataforma",
        priority: "HIGH",
      },
      {
        name: "Carlos Colecionador",
        email: "carlos.col@gmail.com",
        source: "GOOGLE",
        stage: "CONTACT",
        potentialValue: 39,
        nextStep: "Ligar para entender necessidades",
        priority: "MEDIUM",
      },
      {
        name: "Banca Central SP",
        phone: "(11) 97777-0000",
        source: "WHATSAPP",
        sourceDetail: "Grupo de colecionadores SP",
        stage: "PROSPECT",
        potentialValue: 79,
        priority: "MEDIUM",
      },
      {
        name: "Mundo Sticker",
        email: "contato@mundosticker.com.br",
        source: "GOOGLE",
        stage: "PROSPECT",
        potentialValue: 39,
        priority: "LOW",
      },
      {
        name: "Ana Figurinhas",
        phone: "(21) 96666-3333",
        source: "INSTAGRAM",
        stage: "WON",
        potentialValue: 39,
        nextStep: "Onboarding concluido",
        priority: "MEDIUM",
        lastContactAt: new Date("2026-03-15"),
      },
      {
        name: "Banca Falcao",
        phone: "(31) 95555-4444",
        source: "EVENTO",
        sourceDetail: "Encontro colecionadores BH",
        stage: "LOST",
        potentialValue: 79,
        lostReason: "Preco alto, prefere planilha manual",
        priority: "LOW",
      },
    ],
  });

  // ===== OFFERS =====
  await db.bizOffer.createMany({
    data: [
      {
        name: "Plano PRO - Lancamento",
        description: "Plano PRO com 30% de desconto nos 3 primeiros meses",
        price: 27.3,
        priceType: "MONTHLY",
        includes: "Ate 5 albums\nPrecos customizados\nCarrinho de compras\nLink da loja personalizado",
        status: "ACTIVE",
        validUntil: new Date("2026-06-30"),
        salesCount: 2,
        revenue: 54.6,
      },
      {
        name: "Plano UNLIMITED - Early Adopter",
        description: "Acesso ilimitado por R$59/mes (preco especial early adopter)",
        price: 59,
        priceType: "MONTHLY",
        includes: "Albums ilimitados\nTodos os recursos PRO\nSuporte prioritario\nBadge early adopter",
        status: "ACTIVE",
        validUntil: new Date("2026-05-31"),
        salesCount: 1,
        revenue: 59,
      },
      {
        name: "Setup de Loja Completo",
        description: "Configuracao completa: cadastro de estoque, precos, fotos e link personalizado",
        price: 97,
        priceType: "ONE_TIME",
        includes: "Cadastro de ate 3 albums\nFotos de capa\nPrecos configurados\n1h de treinamento",
        status: "ACTIVE",
        salesCount: 0,
        revenue: 0,
      },
      {
        name: "Pacote Banca Digital",
        description: "PRO anual + setup completo + suporte dedicado 3 meses",
        price: 497,
        priceType: "PACKAGE",
        includes: "12 meses PRO\nSetup completo\nSuporte WhatsApp 3 meses\nTreinamento 2h",
        status: "ACTIVE",
        salesCount: 0,
        revenue: 0,
      },
    ],
  });

  // ===== EXPERIMENTS =====
  await db.bizExperiment.createMany({
    data: [
      {
        hypothesis: "Se postarmos 3 reels/semana mostrando a loja de um vendedor real, conseguimos 5 leads/semana no Instagram",
        channel: "Instagram",
        priority: "HIGH",
        effort: "3h/sem",
        cost: 0,
        expectedResult: "5 leads/semana",
        status: "RUNNING",
        startedAt: new Date("2026-03-25"),
      },
      {
        hypothesis: "Se oferecermos 7 dias gratis do PRO, 30% dos free users convertem para pago",
        channel: "Email + In-app",
        priority: "HIGH",
        effort: "4h implementar",
        cost: 0,
        expectedResult: "30% conversao free→PRO",
        status: "PLANNED",
      },
      {
        hypothesis: "Se criarmos grupo WhatsApp de vendedores, aumentamos retencao em 20%",
        channel: "WhatsApp",
        priority: "MEDIUM",
        effort: "1h/sem moderacao",
        cost: 0,
        expectedResult: "20% aumento retencao 30d",
        status: "PLANNED",
      },
      {
        hypothesis: "Se fizermos parceria com 3 influencers de figurinhas, conseguimos 20 cadastros em 1 mes",
        channel: "Instagram/YouTube",
        priority: "MEDIUM",
        effort: "2h contato + negociacao",
        cost: 300,
        expectedResult: "20 cadastros/mes",
        status: "PLANNED",
      },
      {
        hypothesis: "Se adicionarmos checkout por WhatsApp, orders dobram vs checkout manual",
        channel: "WhatsApp",
        priority: "HIGH",
        effort: "8h dev",
        cost: 0,
        expectedResult: "2x orders/vendedor",
        status: "PLANNED",
      },
    ],
  });

  // ===== INITIATIVES =====
  const initiatives = await Promise.all([
    db.bizInitiative.create({
      data: {
        title: "Gate de Planos - Ativar limites FREE/PRO/UNLIMITED",
        category: "MONETIZATION",
        phase: "IN_PROGRESS",
        impact: "HIGH",
        effort: "MEDIUM",
        owner: "Dev",
        nextStep: "Restaurar guards no plan-limits.ts",
        notes: "Guards existem no codigo mas estao desabilitados. Reativar gradualmente.",
        sortOrder: 1,
      },
    }),
    db.bizInitiative.create({
      data: {
        title: "Funil de Onboarding - Reduzir abandono",
        category: "ACTIVATION",
        phase: "PLANNED",
        impact: "HIGH",
        effort: "MEDIUM",
        owner: "Dev",
        nextStep: "Mapear pontos de abandono no onboarding",
        notes: "Onboarding tem 4 steps. Medir onde users param.",
        sortOrder: 2,
      },
    }),
    db.bizInitiative.create({
      data: {
        title: "Checkout WhatsApp - Pedido direto pelo link",
        category: "PRODUCT",
        phase: "BACKLOG",
        impact: "HIGH",
        effort: "HIGH",
        owner: "Dev",
        nextStep: "Definir fluxo UX do checkout",
        sortOrder: 3,
      },
    }),
    db.bizInitiative.create({
      data: {
        title: "SEO + Conteudo - Blog de figurinhas",
        category: "ACQUISITION",
        phase: "BACKLOG",
        impact: "MEDIUM",
        effort: "MEDIUM",
        owner: "Marketing",
        nextStep: "Listar 10 keywords target",
        sortOrder: 4,
      },
    }),
    db.bizInitiative.create({
      data: {
        title: "Programa de Indicacao - Vendedor indica vendedor",
        category: "ACQUISITION",
        phase: "BACKLOG",
        impact: "MEDIUM",
        effort: "LOW",
        nextStep: "Definir mecanica de recompensa",
        sortOrder: 5,
      },
    }),
    db.bizInitiative.create({
      data: {
        title: "Dashboard de Estatisticas para Vendedor",
        category: "RETENTION",
        phase: "PLANNED",
        impact: "MEDIUM",
        effort: "MEDIUM",
        owner: "Dev",
        nextStep: "Definir metricas do dashboard",
        notes: "Sellers querem ver visualizacoes, pedidos, faturamento",
        sortOrder: 6,
      },
    }),
  ]);

  // ===== MILESTONES =====
  await db.bizMilestone.createMany({
    data: [
      { initiativeId: initiatives[0].id, title: "Restaurar checkStickerLimit", status: "DONE", completedAt: new Date() },
      { initiativeId: initiatives[0].id, title: "Restaurar checkAlbumLimit", status: "IN_PROGRESS" },
      { initiativeId: initiatives[0].id, title: "Restaurar checkOrderLimit", status: "PENDING" },
      { initiativeId: initiatives[0].id, title: "UI de upgrade quando atingir limite", status: "PENDING" },
      { initiativeId: initiatives[1].id, title: "Instrumentar analytics no onboarding", status: "PENDING", targetDate: new Date("2026-04-15") },
      { initiativeId: initiatives[1].id, title: "Otimizar step 2 (maior abandono)", status: "PENDING", targetDate: new Date("2026-04-22") },
      { initiativeId: initiatives[5].id, title: "MVP com 3 metricas basicas", status: "PENDING", targetDate: new Date("2026-04-20") },
    ],
  });

  // ===== TASKS =====
  await db.bizTask.createMany({
    data: [
      { title: "Reativar guards em plan-limits.ts", priority: "HIGH", status: "IN_PROGRESS", initiativeId: initiatives[0].id },
      { title: "Criar pagina de upgrade/upsell", priority: "HIGH", status: "TODO", initiativeId: initiatives[0].id },
      { title: "Configurar Stripe prices para PRO e UNLIMITED", priority: "HIGH", status: "DONE", completedAt: new Date("2026-03-20") },
      { title: "Postar 3 reels esta semana", priority: "HIGH", status: "TODO", deadline: new Date("2026-04-07") },
      { title: "Ligar para Figurinhas da Mari - agendar demo", priority: "HIGH", status: "TODO", deadline: new Date("2026-04-06") },
      { title: "Enviar proposta PRO para Banca do Joao", priority: "HIGH", status: "TODO", deadline: new Date("2026-04-05") },
      { title: "Escrever copy da landing page", priority: "MEDIUM", status: "TODO" },
      { title: "Mapear 10 keywords para SEO", priority: "MEDIUM", status: "TODO", initiativeId: initiatives[3].id },
      { title: "Criar template de email de boas-vindas", priority: "MEDIUM", status: "TODO" },
      { title: "Testar fluxo de checkout como comprador", priority: "HIGH", status: "DONE", completedAt: new Date("2026-03-25") },
      { title: "Implementar trial 7 dias PRO", priority: "HIGH", status: "TODO", initiativeId: initiatives[0].id },
      { title: "Definir mecanica do programa de indicacao", priority: "LOW", status: "TODO", initiativeId: initiatives[4].id },
    ],
  });

  // ===== KPIs =====
  const kpiData = [
    { name: "MRR", category: "REVENUE", unit: "CURRENCY", baseline: 0, target: 500, description: "Receita mensal recorrente" },
    { name: "Sellers Pagantes", category: "REVENUE", unit: "COUNT", baseline: 0, target: 15, description: "Vendedores em planos pagos" },
    { name: "ARR Projetado", category: "REVENUE", unit: "CURRENCY", baseline: 0, target: 6000, description: "Receita anual recorrente projetada" },
    { name: "Total Sellers", category: "GROWTH", unit: "COUNT", baseline: 0, target: 50, description: "Total de vendedores cadastrados" },
    { name: "Novos Sellers/Semana", category: "GROWTH", unit: "COUNT", baseline: 0, target: 5, description: "Cadastros por semana" },
    { name: "Conversao Free→PRO", category: "CONVERSION", unit: "PERCENT", baseline: 0, target: 15, description: "% de free users que viram PRO" },
    { name: "Conversao Lead→Seller", category: "CONVERSION", unit: "PERCENT", baseline: 0, target: 25, description: "% de leads que viram sellers" },
    { name: "Retencao 30d", category: "ENGAGEMENT", unit: "PERCENT", baseline: 0, target: 70, description: "% de sellers ativos apos 30 dias" },
    { name: "Pedidos/Semana", category: "ENGAGEMENT", unit: "COUNT", baseline: 0, target: 20, description: "Pedidos criados por semana" },
    { name: "CAC", category: "COST", unit: "CURRENCY", baseline: 0, target: 30, description: "Custo de aquisicao por cliente" },
    { name: "LTV", category: "REVENUE", unit: "CURRENCY", baseline: 0, target: 400, description: "Lifetime value medio por seller" },
    { name: "LTV/CAC", category: "COST", unit: "COUNT", baseline: 0, target: 3, description: "Razao LTV sobre CAC (ideal >3)" },
  ];

  const kpis = await Promise.all(
    kpiData.map((k) => db.bizKpi.create({ data: k }))
  );

  // ===== KPI SNAPSHOTS (dados iniciais) =====
  const snapshotData: { kpiName: string; values: { value: number; daysAgo: number }[] }[] = [
    { kpiName: "MRR", values: [{ value: 0, daysAgo: 30 }, { value: 27, daysAgo: 20 }, { value: 66, daysAgo: 10 }, { value: 113, daysAgo: 0 }] },
    { kpiName: "Sellers Pagantes", values: [{ value: 0, daysAgo: 30 }, { value: 1, daysAgo: 20 }, { value: 2, daysAgo: 10 }, { value: 3, daysAgo: 0 }] },
    { kpiName: "Total Sellers", values: [{ value: 1, daysAgo: 30 }, { value: 3, daysAgo: 20 }, { value: 5, daysAgo: 10 }, { value: 8, daysAgo: 0 }] },
    { kpiName: "Novos Sellers/Semana", values: [{ value: 0, daysAgo: 21 }, { value: 1, daysAgo: 14 }, { value: 1, daysAgo: 7 }, { value: 2, daysAgo: 0 }] },
    { kpiName: "Pedidos/Semana", values: [{ value: 0, daysAgo: 21 }, { value: 2, daysAgo: 14 }, { value: 5, daysAgo: 7 }, { value: 8, daysAgo: 0 }] },
    { kpiName: "Retencao 30d", values: [{ value: 50, daysAgo: 14 }, { value: 60, daysAgo: 0 }] },
    { kpiName: "Conversao Free→PRO", values: [{ value: 0, daysAgo: 14 }, { value: 10, daysAgo: 0 }] },
  ];

  for (const { kpiName, values } of snapshotData) {
    const kpi = kpis.find((k) => k.name === kpiName);
    if (!kpi) continue;
    for (const { value, daysAgo } of values) {
      const recordedAt = new Date();
      recordedAt.setDate(recordedAt.getDate() - daysAgo);
      await db.bizKpiSnapshot.create({
        data: { kpiId: kpi.id, value, recordedAt },
      });
    }
  }

  // ===== ACTIVITIES =====
  const leads = await db.bizLead.findMany({ take: 3, orderBy: { createdAt: "asc" } });
  if (leads.length >= 3) {
    await db.bizActivity.createMany({
      data: [
        { leadId: leads[0].id, type: "WHATSAPP", channel: "WHATSAPP", summary: "Primeiro contato via DM Instagram, migrou para WhatsApp", result: "Interessado, pediu mais detalhes sobre PRO" },
        { leadId: leads[0].id, type: "DEMO", channel: "VIDEO", summary: "Demo de 20min mostrando cadastro de estoque e loja publica", result: "Gostou, pediu proposta com desconto" },
        { leadId: leads[1].id, type: "CALL", channel: "PHONE", summary: "Ligacao de 10min, explicou necessidades", result: "Tem 3 albums, quer organizar estoque digital" },
        { leadId: leads[2].id, type: "EMAIL", channel: "EMAIL", summary: "Email de apresentacao enviado", result: "Aguardando resposta" },
      ],
    });
  }

  return NextResponse.json({ ok: true });
}
