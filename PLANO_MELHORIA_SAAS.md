# FigurinhasPro — Plano de Melhoria e Finalização para Vendas SaaS

> Data: 03/04/2026 | Status: EM EXECUCAO | Versao: 1.1 (atualizado 04/04/2026)
> **NOTA:** Este e o plano v1. Ver `PLANO_SAAS_V2.md` para a versao corrigida e ativa.

---

## 1. Diagnóstico do Estado Atual

O FigurinhasPro é um MVP funcional com stack moderna (Next.js 16 + Prisma 7 + SQLite), porém ainda **não monetiza**. Abaixo o mapa do que existe vs. o que falta para operar como SaaS de vendas:

| Área | Status | Detalhe |
|------|--------|---------|
| Landing page com pricing | ✅ Pronto | 3 planos (Starter/Pro/Ilimitado) com precos definidos |
| Registro e login | ✅ Pronto | iron-session + bcryptjs (seguro) |
| Catalogo de figurinhas | ✅ Pronto | 7.122 figurinhas, 13 Copas |
| Estoque visual | ✅ Pronto | Grid com edicao sticker-a-sticker + bulk update |
| Precos (global + custom) | ✅ Pronto | Normal/Especial/Brilhante + override por album |
| Vitrine publica (`/loja/[slug]`) | ✅ Pronto | Carrinho, checkout, geracao de orcamento |
| Pedidos com workflow | ✅ Pronto | QUOTE → CONFIRMED → PAID → SHIPPED → DELIVERED |
| WhatsApp (links) | ✅ Pronto | wa.me com mensagem formatada |
| **Banco de producao** | ✅ FEITO | Neon Postgres via PrismaNeon (migrado 04/04) |
| **Seguranca de senhas** | ✅ FEITO | bcryptjs hash + iron-session (migrado 04/04) |
| **SEO e conversao** | ✅ FEITO | Meta tags, OpenGraph, Twitter cards, keywords |
| **Onboarding do seller** | ✅ FEITO | Pagina `/onboarding` + checklist |
| **Mobile optimization** | ✅ FEITO | Viewport cover, safe-area, bottom nav, touch targets |
| **Legal (LGPD)** | ✅ FEITO | `/termos` + `/privacidade` |
| **Error pages** | ✅ FEITO | 404, error generico, loading states |
| **Pagamentos (Stripe)** | ⚠️ Parcial | SDK instalado, endpoints criados — falta ativar em producao |
| **Enforcement de planos** | ⚠️ Parcial | `plan-limits.ts` criado — guards temporariamente desabilitados |
| **Email transacional** | ❌ Ausente | Nenhuma notificacao por email |
| **Relatorios/Analytics** | ❌ Ausente | Dashboard com metricas basicas, sem graficos |

---

## 2. Arquitetura-Alvo para SaaS

```
┌──────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js 16)              │
│  Landing → Registro → Onboarding → Painel → Loja     │
└────────────────────────┬─────────────────────────────┘
                         │
           ┌─────────────┼─────────────────┐
           ▼             ▼                 ▼
    ┌────────────┐ ┌──────────┐  ┌──────────────────┐
    │ Stripe API │ │ Neon PG  │  │ Resend (email)   │
    │ Checkout   │ │ Produção │  │ Transacional     │
    │ Webhooks   │ │ Prisma 7 │  │                  │
    │ Portal     │ │          │  │                  │
    └────────────┘ └──────────┘  └──────────────────┘
```

---

## 3. Fases de Implementação

### FASE 1 — Infraestrutura de Produção (Pré-requisito)
**Estimativa: 2-3 dias | Prioridade: CRÍTICA**

#### 1.1 Migrar SQLite → Neon Postgres
O SQLite não funciona em deploy serverless (Vercel). Migrar para Neon Postgres (já usado nos projetos P4 e P6 do ecossistema Arena Cards).

Tarefas:
- Criar banco Neon para FigurinhasPro
- Atualizar `prisma.config.ts` para usar driver adapter `@prisma/adapter-pg`
- Trocar `@prisma/adapter-better-sqlite3` por `@prisma/adapter-pg` + `pg`
- Rodar `npx prisma db push` contra Neon
- Criar script de seed com dados do catálogo de álbuns
- Configurar variáveis de ambiente (`DATABASE_URL`, `DIRECT_URL`) na Vercel
- Testar todas as APIs contra Postgres

#### 1.2 Hash de Senhas
Senhas estão em texto puro — bloqueio total para produção.

Tarefas:
- Instalar `bcryptjs` (compatível com Edge/serverless)
- Atualizar `POST /api/auth/register` para hashear senha
- Atualizar `POST /api/auth/login` para comparar hash
- Criar migration para rehashear senhas existentes no primeiro login

#### 1.3 Variáveis de Ambiente
- Separar `.env.local` (dev) de `.env.production`
- Adicionar: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_APP_URL`

---

### FASE 2 — Integração Stripe para Assinaturas (Core SaaS)
**Estimativa: 4-5 dias | Prioridade: CRÍTICA**

#### 2.1 Modelo de Dados para Billing

Adicionar ao schema Prisma:

```prisma
model Seller {
  // ... campos existentes ...
  plan            String   @default("FREE")
  stripeCustomerId    String?  @unique
  stripeSubscriptionId String?
  stripePriceId       String?
  stripeCurrentPeriodEnd DateTime?
}

model SubscriptionEvent {
  id        String   @id @default(cuid())
  sellerId  String
  seller    Seller   @relation(fields: [sellerId], references: [id])
  type      String   // checkout.completed, invoice.paid, subscription.deleted, etc.
  stripeEventId String @unique
  data      String   // JSON payload
  createdAt DateTime @default(now())
}
```

#### 2.2 Produtos e Preços no Stripe
Criar no Stripe Dashboard (ou via API no seed):

| Produto | Price ID | Valor | Intervalo |
|---------|----------|-------|-----------|
| FigurinhasPro Starter | — | R$ 0 | — (free tier, sem subscription) |
| FigurinhasPro Pro | `price_pro_monthly` | R$ 29,00 | Mensal |
| FigurinhasPro Ilimitado | `price_unlimited_monthly` | R$ 59,00 | Mensal |

Opcionalmente adicionar preços anuais com desconto (ex: R$ 290/ano Pro = 2 meses grátis).

#### 2.3 Fluxo de Checkout

```
Seller clica "Assinar Pro" na landing ou no painel
    → POST /api/stripe/checkout  (cria Stripe Checkout Session)
    → Redirect para checkout.stripe.com
    → Pagamento aprovado
    → Stripe envia webhook checkout.session.completed
    → POST /api/stripe/webhook processa:
        - Atualiza seller.plan = "PRO"
        - Salva stripeCustomerId, stripeSubscriptionId
        - Salva stripeCurrentPeriodEnd
    → Seller redirecionado para /painel com plano ativo
```

#### 2.4 Endpoints Stripe

| Rota | Método | Função |
|------|--------|--------|
| `/api/stripe/checkout` | POST | Cria Checkout Session (plan como param) |
| `/api/stripe/webhook` | POST | Recebe eventos Stripe (raw body, signature verification) |
| `/api/stripe/portal` | POST | Cria portal de billing (cancelar, trocar cartão) |

#### 2.5 Eventos Webhook a Tratar

| Evento | Ação |
|--------|------|
| `checkout.session.completed` | Ativar plano, salvar IDs Stripe |
| `invoice.payment_succeeded` | Renovar `stripeCurrentPeriodEnd` |
| `invoice.payment_failed` | Marcar plano como "PAST_DUE", notificar seller |
| `customer.subscription.deleted` | Downgrade para FREE |
| `customer.subscription.updated` | Atualizar plano se upgrade/downgrade |

#### 2.6 Portal de Billing
Adicionar botão "Gerenciar assinatura" no painel que redireciona para o Stripe Customer Portal (gerenciar cartão, cancelar, ver faturas).

---

### FASE 3 — Enforcement de Limites por Plano (Gate de Features)
**Estimativa: 2-3 dias | Prioridade: ALTA**

#### 3.1 Definição de Limites

```typescript
const PLAN_LIMITS = {
  FREE: {
    maxStickers: 100,
    maxOrdersPerMonth: 10,
    maxAlbums: 1,
    features: ['basic_store'],
  },
  PRO: {
    maxStickers: 1000,
    maxOrdersPerMonth: 100,
    maxAlbums: 13, // todos
    features: ['basic_store', 'whatsapp', 'custom_prices'],
  },
  UNLIMITED: {
    maxStickers: Infinity,
    maxOrdersPerMonth: Infinity,
    maxAlbums: 13,
    features: ['basic_store', 'whatsapp', 'custom_prices', 'reports', 'priority_support'],
  },
} as const;
```

#### 3.2 Middleware de Verificação
Criar `lib/plan-guard.ts`:
- `checkLimit(sellerId, resource)` — verifica se seller atingiu limite
- Chamar nas APIs: `POST /api/inventory` (maxStickers), `POST /api/orders` (maxOrders), preços custom (feature gate)
- Retornar HTTP 403 com payload `{ error: "plan_limit", upgrade_url: "/pricing" }`

#### 3.3 UI de Upgrade Prompts
Quando seller atinge limite:
- Toast com mensagem clara: "Você atingiu o limite de 100 figurinhas do plano Starter"
- Botão "Fazer upgrade" que leva ao checkout Stripe
- Badge visual no sidebar indicando plano atual e uso (ex: "87/100 figurinhas")

---

### FASE 4 — Onboarding e Conversão
**Estimativa: 3-4 dias | Prioridade: ALTA**

#### 4.1 Fluxo de Onboarding Pós-Registro

Após criar conta, guiar seller por 4 passos:

```
Passo 1: Configurar loja (nome, WhatsApp, logo)
    ↓
Passo 2: Escolher álbum e adicionar primeiras figurinhas
    ↓
Passo 3: Definir preços
    ↓
Passo 4: Compartilhar link da vitrine
    ↓
Dashboard (com checklist de progresso)
```

Implementar como wizard (`/painel/onboarding`) com stepper visual e progresso salvo no banco (`Seller.onboardingStep`).

#### 4.2 Melhorias na Landing Page

- Adicionar meta tags SEO (`title`, `description`, `og:image`, `twitter:card`)
- Seção de "Como funciona" com 3 passos visuais
- Seção de depoimentos/social proof (mesmo que inicialmente fictícios/placeholder)
- Seção FAQ com perguntas comuns (accordion)
- CTA flutuante ou seção final de conversão
- Vídeo demonstrativo ou GIF animado do painel
- Link para demo ao vivo (seller de demonstração público)

#### 4.3 Seller Demo
Criar conta `demo@figurinhaspro.com` com estoque preenchido para que visitantes vejam a vitrine funcionando em `/loja/demo`.

#### 4.4 Trial do Plano Pro
Oferecer 7 ou 14 dias de trial Pro sem cartão. Campos adicionais no Seller:
- `trialEndsAt: DateTime?`
- Ao expirar, downgrade automático para FREE (job verificador ou check na API)

---

### FASE 5 — Comunicação e Retenção
**Estimativa: 2-3 dias | Prioridade: MÉDIA**

#### 5.1 Email Transacional (Resend)
Instalar SDK do Resend e criar templates para:

| Email | Trigger | Conteúdo |
|-------|---------|----------|
| Boas-vindas | Registro | Link do painel + primeiros passos |
| Novo pedido | Cliente faz pedido | Detalhes do pedido + link WhatsApp |
| Pedido atualizado | Status muda | Novo status para o cliente |
| Trial expirando | 3 dias antes do fim | CTA para assinar |
| Pagamento falhou | `invoice.payment_failed` | Link para atualizar cartão |
| Assinatura cancelada | `subscription.deleted` | Oferta de retenção |

#### 5.2 Notificações no Painel
Badge de notificações no sidebar com:
- Novos pedidos recebidos
- Pedidos aguardando ação
- Limites próximos de serem atingidos
- Avisos de cobrança

---

### FASE 6 — Relatórios e Analytics (Feature Premium)
**Estimativa: 3-4 dias | Prioridade: MÉDIA**

#### 6.1 Dashboard Melhorado
Para sellers Pro e Ilimitado:
- Gráfico de vendas (últimos 7/30/90 dias) usando Recharts
- Top figurinhas mais vendidas
- Taxa de conversão (visitas na loja → pedidos)
- Receita por álbum
- Ticket médio

#### 6.2 Métricas Internas (Admin)
Painel admin interno (`/admin`) para monitorar o SaaS:
- Total de sellers por plano
- MRR (Monthly Recurring Revenue)
- Churn rate
- Sellers ativos (com login nos últimos 7 dias)
- Pedidos processados por semana

---

### FASE 7 — Polimento e Go-to-Market
**Estimativa: 2-3 dias | Prioridade: MÉDIA**

#### 7.1 PWA e Performance
- Configurar `next-pwa` para instalar como app no celular
- Otimizar imagens (ativar `images.optimized`, configurar Sharp)
- Lazy loading nos grids de figurinhas
- Skeleton loaders durante carregamento

#### 7.2 Personalização da Loja
- Upload de logo do seller (salvar no Vercel Blob ou Cloudinary)
- Cor de destaque customizável (além do emerald padrão)
- Mensagem de boas-vindas personalizável na vitrine

#### 7.3 Ferramentas de Aquisição
- Importação em massa via CSV (upload de planilha com figurinhas)
- Compartilhamento de vitrine com preview social (OG image dinâmica)
- QR Code gerado automaticamente para imprimir e distribuir

#### 7.4 Deploy e Domínio
- Deploy em Vercel com domínio customizado (figurinhaspro.com.br)
- SSL automático
- Configurar Stripe em modo produção (sair do test mode)

---

## 4. Roadmap Visual

```
Semana 1      Semana 2      Semana 3      Semana 4      Semana 5
┌───────┐    ┌───────┐    ┌───────┐    ┌───────┐    ┌───────┐
│FASE 1 │    │FASE 2 │    │FASE 3 │    │FASE 5 │    │FASE 7 │
│Infra  │───▶│Stripe │───▶│Enforce│───▶│Email  │───▶│Polish │
│Neon+PW│    │Billing│    │Limits │    │Resend │    │PWA/GTM│
└───────┘    └───────┘    │       │    └───────┘    └───────┘
                          │FASE 4 │    ┌───────┐
                          │Onboard│    │FASE 6 │
                          └───────┘    │Reports│
                                       └───────┘
```

**Tempo total estimado: 5-6 semanas** (desenvolvimento solo, 4-6h/dia)

---

## 5. Métricas de Sucesso (KPIs)

| Métrica | Meta 30 dias | Meta 90 dias |
|---------|-------------|-------------|
| Sellers registrados | 50 | 200 |
| Conversão Free → Pro | 10% | 15% |
| MRR (Receita Recorrente Mensal) | R$ 500 | R$ 3.000 |
| Churn mensal | < 10% | < 8% |
| Pedidos processados/mês | 200 | 1.500 |
| NPS (satisfação) | > 40 | > 50 |

---

## 6. Stack de Serviços Externos

| Serviço | Uso | Custo Estimado |
|---------|-----|----------------|
| **Vercel** (Hobby/Pro) | Hosting Next.js | $0–$20/mês |
| **Neon** (Free/Launch) | Postgres serverless | $0–$19/mês |
| **Stripe** | Pagamentos | 3.49% + R$0.39 por transação |
| **Resend** | Email transacional | $0 (até 3.000/mês) → $20/mês |
| **Vercel Blob** | Upload de logos | Incluído no Vercel Pro |
| **Domínio .com.br** | figurinhaspro.com.br | ~R$ 40/ano |

**Custo fixo para iniciar: ~R$ 0 a R$ 100/mês** (tudo tem free tier generoso)

---

## 7. Riscos e Mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| SQLite em produção (Vercel) | Bloqueante | Fase 1 migra para Neon antes de tudo |
| Senhas em texto puro | Crítico (segurança) | Fase 1 implementa bcrypt |
| Stripe webhook fora do ar | Cobrança não processada | Implementar retry + logs + alerta |
| Churn alto por falta de valor | Perda de MRR | Onboarding guiado + trial Pro |
| Poucos sellers no início | Receita baixa | Demo público + marketing em grupos de figurinhas WhatsApp |
| Concorrência com planilhas | Baixa conversão | Mostrar valor visual vs. Excel (vídeo comparativo) |

---

## 8. Prioridade de Execução (Quick Wins)

Se quiser lançar o mais rápido possível, aqui está a **versão mínima viável para monetizar**:

1. **Migrar para Neon Postgres** (sem isso não deploya)
2. **Hashear senhas** (sem isso não pode aceitar usuários reais)
3. **Stripe Checkout + Webhook** (sem isso não cobra)
4. **Enforcement básico de limites** (sem isso o free tier não tem sentido)
5. **Deploy em Vercel com domínio** (ir ao ar)

Isso são as Fases 1 + 2 + parte da 3 = **~10 dias de trabalho**.

O restante (onboarding, email, relatórios, PWA) pode ser iterado com o produto já no ar e gerando receita.

---

## 9. Checklist de Go-Live

- [ ] Banco Neon criado e funcionando
- [ ] Senhas hasheadas com bcrypt
- [ ] Stripe configurado (produtos, preços, webhook)
- [ ] Checkout funcional para Pro e Ilimitado
- [ ] Portal de billing acessível no painel
- [ ] Limites do plano FREE enforçados
- [ ] Meta tags SEO na landing page
- [ ] Seller demo criado (`/loja/demo`)
- [ ] Deploy Vercel com domínio customizado
- [ ] Stripe em modo produção (não test)
- [ ] Email de boas-vindas configurado
- [ ] Teste end-to-end: registro → checkout → upgrade → uso → vitrine

---

*Documento gerado como referência para desenvolvimento. Executar fase a fase com `/plan` → `/develop` → `/review` conforme regras XP do projeto.*
