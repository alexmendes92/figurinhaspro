# Conteúdo Institucional Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar páginas institucionais `/sobre`, `/contato`, `/faq` usando o padrão visual já estabelecido em `/privacidade` e `/termos`, e atualizar `sitemap.ts` + footer com os novos links.

**Architecture:** Extrai o shell visual repetido de `/privacidade` (header + main + footer + componente `Section`) em `src/components/institutional/InstitutionalShell.tsx`. As 3 páginas novas viram Server Components que compõem o shell com conteúdo próprio. Form de contato simples em `/contato` com Server Action — sem banco, apenas envia email via provider (TODO: decidir provider no Task 3).

**Tech Stack:** Next.js 16 App Router (Server Components + Server Actions), Tailwind 4, TypeScript strict, Playwright para validação visual obrigatória (regra `arenacards.md`).

**Project rules:** Após cada commit, rodar `npx vercel deploy --prod`. Toda mudança visual exige screenshot Playwright antes de declarar pronto.

**Prerequisitos:** Plano de Hardening (2026-04-21-launch-hardening.md) recomendado (mas não obrigatório) concluído antes, para que `env.NEXT_PUBLIC_APP_URL` esteja garantido.

---

### Task 1: Extrair shell institucional reutilizável

**Files:**
- Create: `src/components/institutional/InstitutionalShell.tsx`
- Modify: `src/app/privacidade/page.tsx`
- Modify: `src/app/termos/page.tsx`

**Context:** `/privacidade` hoje tem ~145 linhas de shell visual inline. `/termos` tem outro shell similar. Extraindo o shell, as páginas novas ficam curtas (só conteúdo) e qualquer mudança visual futura aplica a todas.

- [ ] **Step 1: Criar `src/components/institutional/InstitutionalShell.tsx`**

```tsx
import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footerLink?: { href: string; label: string };
};

export function InstitutionalShell({ title, subtitle, children, footerLink }: Props) {
  return (
    <div className="min-h-screen bg-[#0b0e14]">
      <header className="border-b border-white/[0.04] bg-[#0b0e14]">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center">
              <span className="text-white text-[9px] font-black font-[family-name:var(--font-geist-mono)]">
                F
              </span>
            </div>
            <span className="text-sm font-bold text-white">FigurinhasPro</span>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-black text-white mb-2">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mb-10">{subtitle}</p>}
        <div className="space-y-8">{children}</div>
      </main>

      <footer className="border-t border-white/[0.04] px-6 py-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <span className="text-xs text-gray-600">FigurinhasPro</span>
          {footerLink && (
            <Link
              href={footerLink.href}
              className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
            >
              {footerLink.label}
            </Link>
          )}
        </div>
      </footer>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="text-lg font-bold text-white mb-3">{title}</h2>
      <div className="text-sm text-gray-400 leading-relaxed">{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: Refatorar `src/app/privacidade/page.tsx` para usar o shell**

Substituir conteúdo inteiro:

```tsx
import type { Metadata } from "next";
import { InstitutionalShell, Section } from "@/components/institutional/InstitutionalShell";

export const metadata: Metadata = {
  title: "Política de Privacidade — FigurinhasPro",
  description: "Política de privacidade e proteção de dados da plataforma FigurinhasPro (LGPD).",
};

export default function PrivacidadePage() {
  return (
    <InstitutionalShell
      title="Política de Privacidade"
      subtitle="Última atualização: Abril de 2026 · Em conformidade com a LGPD (Lei 13.709/2018)"
      footerLink={{ href: "/termos", label: "Termos de Uso" }}
    >
      <Section title="1. Dados que coletamos">
        <ul className="list-disc list-inside space-y-1.5">
          <li>
            <strong className="text-gray-300">Dados de cadastro:</strong> nome, email, telefone
            (WhatsApp), nome da loja
          </li>
          <li>
            <strong className="text-gray-300">Dados de uso:</strong> figurinhas cadastradas,
            pedidos, preços configurados
          </li>
          <li>
            <strong className="text-gray-300">Dados de pagamento:</strong> processados pela Stripe —
            não armazenamos dados de cartão
          </li>
          <li>
            <strong className="text-gray-300">Dados técnicos:</strong> IP, navegador, sistema
            operacional (via cookies essenciais)
          </li>
        </ul>
      </Section>

      <Section title="2. Base legal (LGPD Art. 7)">
        <ul className="list-disc list-inside space-y-1.5">
          <li>
            <strong className="text-gray-300">Execução de contrato:</strong> dados necessários para
            fornecer o serviço contratado
          </li>
          <li>
            <strong className="text-gray-300">Consentimento:</strong> para comunicações de marketing
            (você pode revogar a qualquer momento)
          </li>
          <li>
            <strong className="text-gray-300">Interesse legítimo:</strong> melhoria do serviço e
            prevenção de fraudes
          </li>
        </ul>
      </Section>

      <Section title="3. Como usamos seus dados">
        Usamos seus dados para: fornecer e manter a plataforma, processar pagamentos, enviar
        notificações sobre pedidos, melhorar a experiência do usuário e cumprir obrigações legais.
        Não vendemos seus dados a terceiros.
      </Section>

      <Section title="4. Compartilhamento de dados">
        Seus dados podem ser compartilhados com:
        <ul className="list-disc list-inside space-y-1.5 mt-2">
          <li>
            <strong className="text-gray-300">Stripe:</strong> processamento de pagamentos
          </li>
          <li>
            <strong className="text-gray-300">Vercel:</strong> hospedagem da plataforma
          </li>
          <li>
            <strong className="text-gray-300">Compradores:</strong> nome da loja e WhatsApp (quando
            você configura na vitrine)
          </li>
        </ul>
        Todos os parceiros seguem padrões adequados de proteção de dados.
      </Section>

      <Section title="5. Seus direitos (LGPD Art. 18)">
        Você tem direito a:
        <ul className="list-disc list-inside space-y-1.5 mt-2">
          <li>Confirmar a existência de tratamento de seus dados</li>
          <li>Acessar, corrigir ou atualizar seus dados</li>
          <li>Solicitar anonimização, bloqueio ou eliminação de dados desnecessários</li>
          <li>Revogar consentimento a qualquer momento</li>
          <li>Solicitar portabilidade dos dados</li>
          <li>Solicitar exclusão da conta e dados associados</li>
        </ul>
      </Section>

      <Section title="6. Retenção de dados">
        Mantemos seus dados enquanto sua conta estiver ativa ou conforme necessário para fornecer o
        serviço. Após exclusão da conta, dados são removidos em até 30 dias, exceto dados que
        devemos reter por obrigação legal (fiscal, por exemplo).
      </Section>

      <Section title="7. Segurança">
        Adotamos medidas técnicas e organizacionais para proteger seus dados, incluindo:
        criptografia de senhas (bcrypt), sessões seguras (iron-session), HTTPS e acesso restrito ao
        banco de dados.
      </Section>

      <Section title="8. Cookies">
        Utilizamos apenas cookies essenciais para manter sua sessão de login. Não utilizamos cookies
        de rastreamento ou marketing de terceiros.
      </Section>

      <Section title="9. Alterações nesta política">
        Podemos atualizar esta política periodicamente. Mudanças significativas serão comunicadas
        por email ou pela plataforma.
      </Section>

      <Section title="10. Contato e DPO">
        Para exercer seus direitos ou esclarecer dúvidas sobre o tratamento de dados, entre em
        contato pela página <Link href="/contato" className="text-amber-400 hover:underline">/contato</Link>.
      </Section>
    </InstitutionalShell>
  );
}
```

- [ ] **Step 3: Refatorar `src/app/termos/page.tsx` para usar o shell**

Ler o conteúdo atual:

```bash
cat src/app/termos/page.tsx | head -200
```

Aplicar o mesmo padrão: importar `InstitutionalShell` + `Section`, substituir o shell inline. Preservar todo o texto do conteúdo intacto — apenas troca da casca visual.

- [ ] **Step 4: Validar build**

```bash
npm run build
```

Esperado: build completa, zero erros de tipo.

- [ ] **Step 5: Validar visualmente via Playwright**

```bash
npm run dev
```

Com Playwright MCP:
1. `browser_navigate` → `http://localhost:3009/privacidade` → `browser_take_screenshot`
2. `browser_navigate` → `http://localhost:3009/termos` → `browser_take_screenshot`
3. `browser_console_messages` — nenhum erro

Comparar com screenshots originais (opcional, git stash + reload): visual deve ser idêntico.

- [ ] **Step 6: Commit**

```bash
git add src/components/institutional/InstitutionalShell.tsx src/app/privacidade/page.tsx src/app/termos/page.tsx
git commit -m "refactor(institutional): extrai InstitutionalShell reutilizável"
git push
npx vercel deploy --prod
```

---

### Task 2: Criar `/sobre`

**Files:**
- Create: `src/app/sobre/page.tsx`

**Context:** Explica o produto para um vendedor novo que chegou via busca orgânica ou indicação. Conteúdo: proposta de valor, para quem é, como funciona (3 passos), por que escolher, CTA para `/registro`.

- [ ] **Step 1: Criar `src/app/sobre/page.tsx`**

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { InstitutionalShell, Section } from "@/components/institutional/InstitutionalShell";

export const metadata: Metadata = {
  title: "Sobre — FigurinhasPro",
  description:
    "FigurinhasPro é a plataforma para revendedores de figurinhas avulsas. Estoque, preços, vitrine e pedidos — tudo em um lugar.",
};

export default function SobrePage() {
  return (
    <InstitutionalShell
      title="Sobre o FigurinhasPro"
      subtitle="Feito para quem vende figurinhas de verdade"
      footerLink={{ href: "/contato", label: "Falar com a gente" }}
    >
      <Section title="O que é">
        FigurinhasPro é a plataforma que transforma a venda de figurinhas avulsas em negócio
        profissional. Vendedor cadastra o estoque, define preços por tipo e seção, e ganha uma
        vitrine online para compartilhar com compradores via WhatsApp.
      </Section>

      <Section title="Para quem">
        <ul className="list-disc list-inside space-y-1.5">
          <li>Revendedores que vendem figurinhas em marketplaces e querem centralizar pedidos</li>
          <li>Colecionadores que viraram comerciantes e precisam organizar estoque grande</li>
          <li>Lojas físicas que querem uma vitrine digital sem montar um site do zero</li>
        </ul>
      </Section>

      <Section title="Como funciona — 3 passos">
        <ol className="list-decimal list-inside space-y-3 mt-2">
          <li>
            <strong className="text-gray-300">Cadastra o estoque:</strong> importa a lista de
            figurinhas que tem, por álbum e código. Suporta ranges (1-670), prefixos (BRA1-BRA20) e
            listas mistas.
          </li>
          <li>
            <strong className="text-gray-300">Configura preços:</strong> 3 eixos de precificação —
            por tipo (Normal / Especial / Brilhante), por seção/país dentro do álbum, e desconto
            progressivo por quantidade no carrinho.
          </li>
          <li>
            <strong className="text-gray-300">Compartilha a vitrine:</strong> cada vendedor ganha
            URL única (<code>figurinhaspro.com.br/loja/seu-slug</code>). Comprador escolhe
            figurinhas, pede orçamento via WhatsApp e fecha.
          </li>
        </ol>
      </Section>

      <Section title="O que inclui">
        <ul className="list-disc list-inside space-y-1.5">
          <li>13 Copas do Mundo catalogadas + álbuns customizados do vendedor</li>
          <li>Importação de lista faltante do comprador (filtra só o que você tem)</li>
          <li>Sistema de pedidos com workflow (orçamento → confirmado → pago → enviado)</li>
          <li>Cobrança via Stripe com plano FREE, PRO e UNLIMITED</li>
          <li>Vitrine mobile-first (seus compradores estão no celular)</li>
        </ul>
      </Section>

      <Section title="Por que escolher">
        <ul className="list-disc list-inside space-y-1.5">
          <li>
            <strong className="text-gray-300">Feito para o nicho:</strong> entende ranges, seções,
            tipos — não é um marketplace genérico adaptado.
          </li>
          <li>
            <strong className="text-gray-300">Copa 2026 chegando:</strong> prepare o estoque antes
            da demanda explodir.
          </li>
          <li>
            <strong className="text-gray-300">Você é dono do relacionamento:</strong> WhatsApp
            direto, sem intermediário cobrando comissão por mensagem.
          </li>
        </ul>
      </Section>

      <Section title="Comece grátis">
        <Link
          href="/registro"
          className="inline-block mt-2 px-6 py-3 rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 text-[#0b0e14] font-bold text-sm hover:from-amber-300 hover:to-amber-400 transition-colors"
        >
          Criar minha conta
        </Link>
      </Section>
    </InstitutionalShell>
  );
}
```

- [ ] **Step 2: Validar build**

```bash
npm run build
```

- [ ] **Step 3: Validar visualmente via Playwright**

```bash
npm run dev
```

1. `browser_navigate` → `http://localhost:3009/sobre`
2. `browser_take_screenshot` — verificar hierarquia, espaçamento, CTA
3. `browser_resize` 375x812 → screenshot mobile
4. `browser_resize` 1280x800 → screenshot desktop
5. `browser_click` no CTA "Criar minha conta" → deve navegar para `/registro`
6. `browser_console_messages` — nenhum erro

- [ ] **Step 4: Commit**

```bash
git add src/app/sobre/page.tsx
git commit -m "feat(sobre): adiciona página institucional com proposta de valor e CTA"
git push
npx vercel deploy --prod
```

---

### Task 3: Criar `/contato` com Server Action

**Files:**
- Create: `src/app/contato/page.tsx`
- Create: `src/app/contato/actions.ts`

**Context:** Formulário simples (nome, email, mensagem) que dispara email para `ADMIN_EMAIL`. Como não há provider de email configurado ainda, implementar com um fallback pragmático: gravar em tabela `ContactMessage` (Prisma) e notificar via Sentry breadcrumb. Melhorias futuras (SMTP, Resend) ficam TODO.

**Alternativa simples (no-DB):** usar `mailto:` link para `ADMIN_EMAIL` e não ter form. Discutir com product owner antes — se optar por mailto, pular Task 3 Step 2-5 e só fazer uma página com link.

- [ ] **Step 1: Decisão de escopo**

Confirmar com product owner:
- **Opção A (simples):** só `mailto:contato@arenacards.com.br` + WhatsApp + endereço físico. Zero DB, zero complexidade. **Recomendada para launch.**
- **Opção B (completa):** form → Server Action → tabela `ContactMessage` no Prisma → listagem em `/painel/comercial/contatos`.

Se **Opção A**, executar apenas Step 2. Se **Opção B**, executar Step 3 em diante.

- [ ] **Step 2: [Opção A] Criar `src/app/contato/page.tsx` com links de contato**

```tsx
import type { Metadata } from "next";
import { InstitutionalShell, Section } from "@/components/institutional/InstitutionalShell";

export const metadata: Metadata = {
  title: "Contato — FigurinhasPro",
  description: "Entre em contato com a equipe FigurinhasPro — suporte, vendas e parcerias.",
};

export default function ContatoPage() {
  return (
    <InstitutionalShell
      title="Fale com a gente"
      subtitle="Respondemos em até 1 dia útil"
      footerLink={{ href: "/sobre", label: "Sobre o FigurinhasPro" }}
    >
      <Section title="Email">
        Para suporte, vendas ou parcerias:{" "}
        <a href="mailto:contato@arenacards.com.br" className="text-amber-400 hover:underline">
          contato@arenacards.com.br
        </a>
      </Section>

      <Section title="WhatsApp">
        Para atendimento rápido:{" "}
        <a
          href="https://wa.me/5511999999999"
          target="_blank"
          rel="noopener noreferrer"
          className="text-amber-400 hover:underline"
        >
          (11) 99999-9999
        </a>
        <p className="mt-2 text-xs text-gray-500">
          Substituir pelo número real antes do launch.
        </p>
      </Section>

      <Section title="Proteção de dados (LGPD)">
        Para exercer direitos previstos na LGPD (acesso, correção, exclusão), use o mesmo email
        acima com o assunto "LGPD — [seu pedido]". Prazo de resposta: 15 dias.
      </Section>

      <Section title="Horário de atendimento">
        Segunda a sexta, das 9h às 18h (horário de Brasília). Mensagens fora desse horário
        respondemos no próximo dia útil.
      </Section>
    </InstitutionalShell>
  );
}
```

> **Nota:** número de WhatsApp placeholder `(11) 99999-9999` DEVE ser substituído antes do launch. Criar follow-up issue se necessário.

- [ ] **Step 3: [Opção B] Criar schema `ContactMessage` no Prisma**

Adicionar em `prisma/schema.prisma`:

```prisma
model ContactMessage {
  id        String   @id @default(cuid())
  name      String
  email     String
  message   String
  userAgent String?
  status    String   @default("NEW") // NEW, READ, ARCHIVED
  createdAt DateTime @default(now())

  @@index([status, createdAt])
}
```

Rodar:

```bash
npx prisma db push
npx prisma generate
```

- [ ] **Step 4: [Opção B] Criar `src/app/contato/actions.ts`**

```ts
"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";

const contactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  message: z.string().min(10).max(2000),
});

export type ContactFormState = {
  ok: boolean;
  error?: string;
};

export async function submitContact(
  _prev: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
  };

  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Preencha todos os campos corretamente." };
  }

  const hdrs = await headers();
  const userAgent = hdrs.get("user-agent") ?? undefined;

  await prisma.contactMessage.create({
    data: { ...parsed.data, userAgent },
  });

  return { ok: true };
}
```

- [ ] **Step 5: [Opção B] Criar `src/app/contato/page.tsx` com form**

```tsx
"use client";

import { useActionState } from "react";
import Link from "next/link";
import { InstitutionalShell, Section } from "@/components/institutional/InstitutionalShell";
import { submitContact, type ContactFormState } from "./actions";

const initialState: ContactFormState = { ok: false };

export default function ContatoPage() {
  const [state, action, pending] = useActionState(submitContact, initialState);

  return (
    <InstitutionalShell
      title="Fale com a gente"
      subtitle="Respondemos em até 1 dia útil"
      footerLink={{ href: "/sobre", label: "Sobre o FigurinhasPro" }}
    >
      {state.ok ? (
        <Section title="Mensagem enviada">
          Obrigado pelo contato. Respondemos em até 1 dia útil para o email informado.
          <div className="mt-4">
            <Link href="/" className="text-amber-400 hover:underline text-xs">
              ← Voltar para a home
            </Link>
          </div>
        </Section>
      ) : (
        <Section title="Envie uma mensagem">
          <form action={action} className="space-y-4 mt-2">
            <div>
              <label htmlFor="name" className="block text-xs text-gray-400 mb-1.5">
                Nome
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                minLength={2}
                maxLength={100}
                className="w-full px-3 py-2 rounded-md bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-xs text-gray-400 mb-1.5">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-3 py-2 rounded-md bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-xs text-gray-400 mb-1.5">
                Mensagem
              </label>
              <textarea
                id="message"
                name="message"
                required
                minLength={10}
                maxLength={2000}
                rows={6}
                className="w-full px-3 py-2 rounded-md bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

            {state.error && (
              <p className="text-xs text-red-400">{state.error}</p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="px-6 py-2 rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 text-[#0b0e14] font-bold text-sm hover:from-amber-300 hover:to-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pending ? "Enviando..." : "Enviar"}
            </button>
          </form>
        </Section>
      )}

      <Section title="Outros canais">
        Email direto:{" "}
        <a href="mailto:contato@arenacards.com.br" className="text-amber-400 hover:underline">
          contato@arenacards.com.br
        </a>
      </Section>
    </InstitutionalShell>
  );
}
```

- [ ] **Step 6: Validar build**

```bash
npm run build
```

- [ ] **Step 7: Validar visualmente via Playwright**

```bash
npm run dev
```

1. `browser_navigate` → `http://localhost:3009/contato` → screenshot
2. [Opção B] `browser_fill_form` (name, email, message válidos) → `browser_click` enviar → screenshot de sucesso
3. [Opção B] `browser_navigate` de volta, tentar enviar vazio → screenshot de erro
4. `browser_console_messages` — nenhum erro

- [ ] **Step 8: Commit**

```bash
git add src/app/contato/
# [Opção B] git add prisma/schema.prisma
git commit -m "feat(contato): adiciona página de contato [Opção A: links | Opção B: form + Server Action]"
git push
npx vercel deploy --prod
```

---

### Task 4: Criar `/faq` e atualizar sitemap + navegação

**Files:**
- Create: `src/app/faq/page.tsx`
- Modify: `src/app/sitemap.ts`
- Modify: `src/app/privacidade/page.tsx` (footerLink opcional)
- Modify: `src/app/termos/page.tsx` (footerLink opcional)

**Context:** FAQ reduz tickets de suporte e atrito no onboarding. Conteúdo inicial: 8-12 perguntas cobrindo planos, pagamento, como funciona a vitrine, política de estoque, suporte. Shell igual ao das outras institucionais.

- [ ] **Step 1: Criar `src/app/faq/page.tsx`**

```tsx
import type { Metadata } from "next";
import { InstitutionalShell, Section } from "@/components/institutional/InstitutionalShell";

export const metadata: Metadata = {
  title: "FAQ — FigurinhasPro",
  description:
    "Perguntas frequentes sobre planos, pagamento, como funciona a vitrine e suporte do FigurinhasPro.",
};

export default function FaqPage() {
  return (
    <InstitutionalShell
      title="Perguntas Frequentes"
      subtitle="Não achou sua resposta? Fale com a gente em /contato"
      footerLink={{ href: "/contato", label: "Falar com a gente" }}
    >
      <Section title="Como funciona o plano FREE?">
        O plano FREE permite cadastrar um número limitado de figurinhas e criar 1 álbum customizado.
        É ideal pra testar a plataforma antes de migrar para um plano pago.
      </Section>

      <Section title="Qual a diferença entre PRO e UNLIMITED?">
        <strong className="text-gray-300">PRO</strong>: aumenta os limites de estoque e pedidos, libera
        regras de preço por seção e desconto por quantidade.{" "}
        <strong className="text-gray-300">UNLIMITED</strong>: remove todos os limites e inclui suporte
        prioritário.
      </Section>

      <Section title="Como faço upgrade ou cancelamento?">
        Acesse <strong className="text-gray-300">Painel &gt; Planos</strong>. O pagamento é
        processado pela Stripe e você pode cancelar a qualquer momento pelo portal do assinante.
      </Section>

      <Section title="Vocês cobram comissão sobre as vendas?">
        Não. A cobrança é só a mensalidade do plano. Os pedidos acontecem direto entre você e o
        comprador (WhatsApp). Não ficamos no meio.
      </Section>

      <Section title="Como o comprador paga?">
        No launch atual, o fechamento é via WhatsApp — o vendedor envia link de Pix, transferência
        ou combina o método direto com o comprador. Pagamento integrado na vitrine está no roadmap.
      </Section>

      <Section title="Posso cadastrar álbuns que não estão na lista?">
        Sim. Em <strong className="text-gray-300">Painel &gt; Estoque &gt; Novo</strong> você cria
        um álbum customizado com seus próprios códigos. Suporta ranges (1-670) e prefixos
        (BRA1-BRA20).
      </Section>

      <Section title="Como funciona o sistema de preços?">
        São 3 eixos de precificação:
        <ol className="list-decimal list-inside space-y-1.5 mt-2">
          <li>Por tipo (Normal / Especial / Brilhante) — global ou por álbum</li>
          <li>Por seção/país dentro de um álbum (FLAT ou OFFSET sobre o tipo)</li>
          <li>Desconto percentual progressivo por quantidade no carrinho</li>
        </ol>
      </Section>

      <Section title="Meus dados estão seguros?">
        Sim. Senhas são criptografadas (bcrypt), sessões usam cookies assinados e criptografados
        (iron-session), pagamentos passam pela Stripe (certificada PCI-DSS). Detalhes em{" "}
        <a href="/privacidade" className="text-amber-400 hover:underline">
          /privacidade
        </a>
        .
      </Section>

      <Section title="Posso exportar meus dados?">
        Sim. A LGPD garante portabilidade. Solicite pelo email de contato e enviamos um arquivo JSON
        com seu estoque, pedidos e configurações em até 15 dias.
      </Section>

      <Section title="Quem está por trás do FigurinhasPro?">
        Somos a Arena Cards, operação de figurinhas brasileira. O FigurinhasPro é nossa plataforma
        SaaS para outros revendedores.
      </Section>

      <Section title="Como reporto um bug ou sugiro uma feature?">
        Envie um email pelo <a href="/contato" className="text-amber-400 hover:underline">/contato</a>
        {" "}com "BUG" ou "FEATURE" no assunto. Lemos tudo e priorizamos por volume de pedidos.
      </Section>
    </InstitutionalShell>
  );
}
```

- [ ] **Step 2: Atualizar `src/app/sitemap.ts` com as 3 novas páginas**

Substituir conteúdo:

```ts
import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = env.NEXT_PUBLIC_APP_URL ?? "https://album-digital-ashen.vercel.app";
  const now = new Date();

  return [
    { url: baseUrl, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${baseUrl}/sobre`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/contato`, lastModified: now, changeFrequency: "yearly", priority: 0.6 },
    { url: `${baseUrl}/privacidade`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/termos`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
```

- [ ] **Step 3: Atualizar landing (`src/app/page.tsx`) adicionando links de footer**

Identificar seção de footer da landing:

```bash
grep -n "footer\|Sobre\|FAQ\|Contato" src/app/page.tsx
```

Adicionar links pra `/sobre`, `/faq`, `/contato`, `/privacidade`, `/termos` no footer da landing. Se não houver footer estruturado, criar um no fim da `<main>` da landing — padrão:

```tsx
<footer className="border-t border-white/[0.04] mt-20 py-8 px-6">
  <div className="max-w-5xl mx-auto flex flex-wrap gap-x-6 gap-y-3 items-center justify-center text-xs text-gray-600">
    <a href="/sobre" className="hover:text-gray-400 transition-colors">Sobre</a>
    <a href="/faq" className="hover:text-gray-400 transition-colors">FAQ</a>
    <a href="/contato" className="hover:text-gray-400 transition-colors">Contato</a>
    <a href="/privacidade" className="hover:text-gray-400 transition-colors">Privacidade</a>
    <a href="/termos" className="hover:text-gray-400 transition-colors">Termos</a>
    <span className="text-gray-700">·</span>
    <span>© {new Date().getFullYear()} FigurinhasPro</span>
  </div>
</footer>
```

- [ ] **Step 4: Validar build**

```bash
npm run build
```

- [ ] **Step 5: Validar visualmente via Playwright**

```bash
npm run dev
```

1. `browser_navigate` → `http://localhost:3009/faq` → screenshot
2. `browser_navigate` → `http://localhost:3009/` → rolar até o footer → screenshot
3. `browser_click` em "FAQ" no footer → deve navegar
4. `browser_click` em "Sobre" no footer → deve navegar
5. `browser_navigate` → `http://localhost:3009/sitemap.xml` → conferir que contém as 6 URLs
6. `browser_console_messages` — nenhum erro

- [ ] **Step 6: Commit**

```bash
git add src/app/faq/page.tsx src/app/sitemap.ts src/app/page.tsx
git commit -m "feat(institutional): adiciona FAQ, atualiza sitemap e links no footer da landing"
git push
npx vercel deploy --prod
```

- [ ] **Step 7: Validar em produção**

```bash
curl -s https://album-digital-ashen.vercel.app/sitemap.xml | grep -c "<url>"
```

Esperado: 6 (ou mais, se plano de hardening já estiver deployed).

---

## Critérios de conclusão do plano

- [ ] `InstitutionalShell` reutilizado em `/privacidade`, `/termos`, `/sobre`, `/contato`, `/faq`
- [ ] `/sobre` apresenta proposta de valor + 3 passos + CTA para `/registro`
- [ ] `/contato` funciona — Opção A (mailto/WhatsApp) ou Opção B (form + DB)
- [ ] `/faq` cobre planos, pagamento, preços, LGPD, suporte
- [ ] `sitemap.xml` contém as 6 páginas públicas
- [ ] Footer da landing linka todas as páginas institucionais
- [ ] Screenshots Playwright confirmando visual correto em mobile e desktop
- [ ] 4 commits em `master`, 4 deploys em produção
