---
fase: estrategia-marketing
gerado-em: 2026-04-28T21:45:00-03:00
versao: 1
projeto-alvo: C:\Users\conta\Projetos\ArenaCards\P8-FigurinhasPro
agents-usados: [analista-gerador]
status: completo
sumario: "Marketing em validação inicial, zero budget, fundador solo: 1 persona prioritária (Rodrigo), 3 canais orgânicos (cross-sell P1, outreach grupos WhatsApp, conteúdo IG/TikTok 1×/sem), mensagem central 'venda perdida evitada', janela útil 12 semanas até pico Copa 2026."
gaps-identificados: 4
prox-fase: estrutura
restricoes-decisao:
  estagio: validacao-inicial
  orcamento: zero
  time: fundador-solo
janela-copa: "28/04/2026 → 19/07/2026 (≈12 semanas)"
---

# Estratégia de Marketing — P8-FigurinhasPro

> Plano derivado da Estratégia Geral (`output/01-estrategia-geral.md`). Restrições do operador: validação inicial / sem orçamento / fundador solo. Janela Copa 2026 começa em ~6 semanas.

## 1. Análise comercial

### a. Cliente real hoje (não o ideal projetado)

**Quem o produto efetivamente atende hoje:**
O produto foi construído pensando em Rodrigo (§8, Persona 1), mas o vendedor que o produto consegue atender sem atrito no momento é mais próximo de Camila (§8, Persona 2): volume baixo, 1 álbum, sem necessidade de bot WhatsApp, sem preços por seção. O plano FREE acomoda essa persona por completo — 100 figurinhas, 10 pedidos/mês, 1 álbum, vitrine básica.

A razão não é decisão de produto: é que as funcionalidades voltadas para Rodrigo têm falhas que bloqueiam confiança nesse perfil. `/api/bot/quote` aceita `unitPrice` do payload sem validar, não decrementa inventário (G2, §18), o que significa que o Rodrigo que integrou o bot WhatsApp da infra Arena Cards está vendendo a mesma figurinha duas vezes sem saber. O sistema de 3 eixos de preço existe e funciona — mas sem telemetria (§15 b.5, G7), não há como saber se algum vendedor profissional está de fato usando.

**Quem o produto QUER atender (alvo PRO/UNLIMITED):**
Rodrigo, 400-800 figurinhas/mês, multi-álbum, integração bot WhatsApp, preços customizados por seção. O PRO (R$ 29/mês) é a unidade econômica que valida o modelo.

**O gap entre os dois (3 componentes):**

1. **Confiança técnica:** G2 (inventário não decrementado) e G4 (Stripe silencioso) afetam Rodrigo diretamente — ele é quem usa bot e tenta upgrade.
2. **Tamanho do catálogo:** Copa 2026 tem 980 figurinhas (recorde). FREE limita em 100 — Rodrigo bate o teto em dias. PRO libera 1.000, mas o caminho de upgrade está comprometido pelo G4.
3. **Observabilidade zero:** sem telemetria (§15 b.5), não há como confirmar se existe algum Rodrigo real usando o produto hoje. Cockpit `BizLead` populado por seed (§11, Divergência 5).

### b. O que ele já paga ou pagaria

**Pricing real:** FREE R$ 0 / PRO R$ 29/mês / UNLIMITED R$ 59/mês (§4, hardcoded em `src/app/painel/planos/page.tsx:8-43`).

**Teste do café (não dói pagar):** R$ 29/mês passa o teste para Rodrigo sem discussão — menos que 2 pacotes de figurinha/dia. Para Camila, R$ 29 não passa: ela fatura R$ 200-300/mês em mês bom (§10 P9), conta não fecha. Camila é usuária natural do FREE.

**Teste de ROI (cobre vendas perdidas):** Rodrigo perde 10-15 vendas/semana por demora ou estoque errado (§10 P3 — confiança Médio). Cada venda vale R$ 2-5 em margem. R$ 29/mês = ~7-10 figurinhas especiais ou ~4-6 vendas. ROI se paga **na primeira semana de Copa**. Modelo passa o teste — falta a comunicação do upgrade fazer essa conta para o Rodrigo real.

**Sellers PRO/UNLIMITED ativos hoje:** **não inferível a partir do código.** `SubscriptionEvent.stripeEventId @unique` confirma pelo menos 1 evento Stripe real, mas pode ter sido teste do operador (§11 Divergência 5, §15 b.1). Sem query `SELECT plan, COUNT(*) FROM "Seller" GROUP BY plan` rodando em dashboard automatizado. Cockpit existe mas vazio de dados reais (G13). **Resposta honesta: tração mensurável a partir do código não existe.**

### c. Unidade de valor entregue

Três candidatos extraídos das personas (§8, §10):

1. **"Tempo economizado por venda perdida evitada" (Rodrigo)** — 1h30-2h/dia gastos respondendo sobre disponibilidade (§10 P8). 10-15 vendas perdidas/semana (P3). Mais quantificável.
2. **"Aparência de loja profissional sem complicação" (Camila)** — "foto do caderno no Stories fica feio" (P4). Aspiracional, menos quantificável.
3. **"Vitrine confiável que não mente sobre estoque" (Paulo)** — "10 em estoque + vendedor responde 'acabou' = nunca mais usa". Paulo não paga; valor indireto.

**Mais defensável como pitch comercial:** "venda perdida evitada" (Rodrigo). Única unidade com valor monetário aproximável pelo próprio usuário — "você perde 10 vendas/semana; R$ 29/mês te devolve essas vendas" é argumento testável na primeira semana.

**Ressalva:** unidade de valor de Rodrigo só é entregável se G2 estiver fechado (inventário decrementado) e vitrine carregar em <500ms mobile (G9, parcialmente atacado em Etapa 3 do roteiro §19). Sem isso, o pitch promete algo que o produto ainda não entrega de forma confiável.

### d. Sinais de tração existem hoje

| Sinal | O que é de fato | Interpretação correta |
|---|---|---|
| 90 commits no repo | Produto construído ativamente | Sinal de desenvolvimento, não de tração comercial |
| 9 modelos `Biz*` no cockpit | Estrutura para operar SaaS | Populada por seed com backlog interno (§11 Div 5); 0 leads reais |
| `SubscriptionEvent.stripeEventId @unique` | Pelo menos 1 evento Stripe real entrou | Pode ser teste do operador; nenhuma query confirma sellers pagantes |
| Vercel Analytics + Speed Insights | Page views instrumentados | Apenas pageviews — sem eventos custom (§15 b.5, G7) |
| Stripe webhook funcional | 4 eventos processados (caminho feliz) | Eventos sem `metadata.sellerId` são silenciosos (§11 Div 4) |
| Sem cron MRR/churn (G13) | Cockpit sem dados automáticos | Operador não sabe MRR sem rodar query manual |
| 0 leads reais em `BizLead` | CRM vazio de dados comerciais | Canal de aquisição não em operação (G8) |
| 0 canal de aquisição em operação | Nenhum Ads, parceria, cross-sell P1 ativo | Gap Crítico para janela Copa (§15 c.1, §18 G8) |

**Conclusão honesta sobre tração:** o produto está em estado **pré-tração validável**. Código pronto para receber usuários, monetização configurada (Stripe funcional, gates ativos), mas sem evidência de que algum Rodrigo real tenha pago ou esteja usando em volume.

**Estado de marketing atual:** zero canal em operação. Janela Copa começa em ~6 semanas. Unidade de valor é clara e quantificável, pricing passa teste de ROI para Rodrigo, não há concorrente SaaS direto no Brasil — mas esses 3 ativos são inúteis sem distribuição. **Step 2 precisa responder: qual o canal mínimo que coloca o primeiro Rodrigo real no produto antes de 15/06/2026.**

## 2. Escopo

### a. Público-alvo prioritário

**Rodrigo é a única persona para os próximos 90 dias.** Não é gosto — é aritmética de restrição:

- **Estado do produto.** Validação. Ainda não há sellers PRO documentados além do possível teste do fundador (§4 Div 5). Validar com uma persona é o máximo que cabe no estágio. Duas personas = dois ICPs, dois feedbacks, dois critérios — pulveriza o sinal.
- **Rodrigo converte antes de Camila.** Camila vive confortável no FREE (80-180 figurinhas/mês). Rodrigo já sente a dor: 10-15 vendas perdidas/sem × R$ 2-5 = R$ 80-300/sem que escapa. PRO R$ 29 se paga em 3-4 dias de Copa.
- **Rodrigo aguenta os gaps atuais; Camila não.** G10 (onboarding 772 linhas) é bloqueador para Camila ("configurar muito = não vou fazer", §10 confiança Alta). Rodrigo tolera porque tem stake financeiro. Produto no estado atual é mais adequado para Rodrigo mesmo sem mudanças.
- **Zero budget + solo.** Rodrigo articula problema em números → outreach direto possível ("você perde X, isso cobre 3 meses de PRO"). Camila exige copy emocional + volume de ativação que solo não sustenta.
- **Paulo fica como beneficiário indireto.** Mais Rodrigos com vitrines completas = mais Paulos satisfeitos = loop de retenção.

**Por que não Camila como primária:** volume potencial existe (15.638 grupos), mas MRR por Camila é zero em 80% dos cenários. Construir volume custa mais atenção/real. Em validação, Camila é ruído.
**Por que não Paulo:** não paga. Marketing direto sem vitrines decentes é desperdício.

### b. Hipótese de mensagem central

**Unidade de valor mais defensável (§4, §10):** "venda perdida evitada" — não "loja profissional", não "organização de estoque". Rodrigo não compra software; compra o tempo no ônibus sem responder clientes.

**Mensagem-raiz:** "Seu cliente pergunta se você tem a BRA-5 às 22h. Você está no ônibus. Ele compra de outro. Isso acontece toda semana."

**5 variantes testáveis por canal:**

| # | Canal | Texto | Hipótese |
|---|---|---|---|
| **V1** | WhatsApp / outreach DM | "Oi [nome], vi que você vende figurinhas. Cria uma vitrine no FigurinhasPro em 10 minutos e seu cliente vê o estoque sozinho — sem precisar te perguntar. FREE até 100 figurinhas. Link: [URL]" | Tom pessoal + friction zero (grátis) converte em DM melhor que copy publicitário |
| **V2** | Banner pós-checkout P1 | "Você compra figurinhas. Outros as vendem. Se você revende repetidas, crie sua loja em 10 min — grátis. [Criar loja]" | Comprador de figurinha do P1 tem sobreposição com vendedor potencial do P8 |
| **V3** | Stories Instagram (legenda + visual, 15s) | "800 figurinhas. 120 pessoas no grupo. Cada uma me perguntando se tem a 'tal'. Criei loja online. Nunca mais respondo isso. [Link na bio]" | Arquétipo Rodrigo narrado em 1ª pessoa converte melhor que atributos do produto |
| **V4** | TikTok / Reels (gancho 3s) | "Eu perdia 10 vendas por semana respondendo no WhatsApp. Olha o que mudou." | Gancho de perda (não de ganho) segura atenção no feed |
| **V5** | Landing page (hero) | "Sua vitrine responde por você." (sub: "Suba seu estoque em 10 minutos. Seu cliente filtra o que falta, monta o pedido, te chama já decidido. Grátis até 100 figurinhas.") | Promessa de delegação ressoa mais que economia de tempo |

**Ordem de teste:** V1 → V2 → V3. V4 e V5 dependem de produção mais cara em tempo.

### c. Canais escolhidos (e os que NÃO entraram)

**Três canais. Nenhum requer verba.**

#### Canal 1 — Cross-sell P1 (Arena Cards)

- **Por que cabe:** audiência já formada de compradores de figurinha — sobrepõe com perfil de quem revende repetidas. Infra existe (P1 com checkout Firebase). Custo monetário zero. Custo de tempo: 1-2 dias para banner com UTM no fluxo pós-checkout do P1.
- **Execução concreta:** banner ou card na confirmação de pedido em `arenacards.com.br`, após `checkout.session.completed`. Copy V2. UTM: `utm_source=p1&utm_medium=pos-checkout&utm_campaign=copa2026`.
- **Custo de tempo:** ~2 dias implementação + 30 min/sem monitoramento.
- **Métrica primária:** sellers cadastrados no P8 com `utm_source=p1` em 30 dias. Fórmula: `COUNT(Seller WHERE createdAt > hoje AND utm_source = 'p1')` via parâmetro UTM persistido em `Seller.acquisitionSource` (campo a adicionar) ou Vercel Analytics evento `seller_signup`.
- **Hipótese a validar:** "comprador ativo de figurinha no P1 tem interseção suficiente com revendedor-alvo do P8 para gerar ≥3 cadastros em 30 dias". Se falhar, audiência P1 ≠ ICP P8.

#### Canal 2 — Outreach manual em grupos WhatsApp

- **Por que cabe:** é onde Rodrigo já opera (§8: "grupo de WhatsApp, 120 membros, vendo via grupo"). 15.638 grupos detectados em `gruposwhats.app/category/figurinhas-e-stickers` (§5). Custo monetário zero. Custo de tempo: 2-4h mapeamento + 30-60 min/sem follow-up.
- **Execução concreta:** fundador seleciona 8-10 grupos por tamanho (>200 membros) e categoria (Copa 2026 explícita). DM ao admin: "Admin, organizo vendas de figurinhas — posso oferecer 30 dias PRO grátis para 2-3 vendedores do grupo que quiserem testar vitrine online?" Não é spam — proposta de valor para o grupo. Tracking: planilha manual.
- **Custo de tempo:** 2-4h mapeamento inicial + 30-60 min/sem.
- **Métrica primária:** sellers em trial PRO via outreach. Fórmula: `COUNT(Seller WHERE plan = 'PRO' AND acquisitionSource = 'whatsapp-group')` cruzado com `SubscriptionEvent`.
- **Hipótese a validar:** "admin de grupo grande aceita facilitar acesso a 2-3 vendedores em troca de benefício PRO, e ao menos 1 converte para pago em 60 dias". Se admins não aceitam ou ninguém converte, canal exige abordagem diferente.

#### Canal 3 — Conteúdo orgânico no perfil do fundador (Instagram/TikTok)

- **Por que cabe:** custo zero, fundador tem presença. Cadência sustentável para solo: **1 vídeo/semana** (não 3 — 3 é o que quebra a consistência em 3 semanas). Temática alinhada com Copa.
- **Execução concreta:** 1 vídeo curto (30-90s) por semana, terças (menor concorrência). Screen recording da vitrine + narração 1ª pessoa (V3 ou V4). Link na bio com `utm_source=ig&utm_medium=bio`. CTA: "link na bio pra criar grátis".
- **Custo de tempo:** 2-3h/vídeo (gravar + editar mínimo + publicar). Total: ~2-3h/semana.
- **Métrica primária:** cliques no link da bio com conversão em cadastro. Fórmula: `cadastros com utm_source=ig` rastreados via Vercel Analytics.
- **Hipótese a validar:** "audiência do fundador no IG/TikTok tem sobreposição com revendedor — ao menos 1 cadastro/semana desse canal". Se 4 semanas sem cadastros, audiência atual não é ICP.

#### Canais que NÃO entraram

| Canal | Motivo |
|---|---|
| **Mercado Livre Ads / Meta Ads / Google Ads** | Verba zero |
| **Parceria com banca física** | Ciclo longo, prospecção/reunião/piloto, fora de 90 dias |
| **Conteúdo SEO próprio (blog)** | SEO leva 3-6 meses; janeiro/27 não serve para Copa 2026 |
| **Email Listmonk para 3.298 customers P3** | Tecnicamente bloqueado (SMTP relay + DNS pendentes) |
| **Podcast / webinar** | Exige audiência prévia para ROI; não em pré-tração |
| **Afiliados** | Em modo passivo desde 2026-04-20 (CLAUDE.md raiz) |

### d. O que NÃO está no escopo dos próximos 90 dias

1. **Camila como público primário de campanha** — bem-vinda no FREE, converte organicamente; não é alvo.
2. **Paulo como alvo de comunicação direta** — beneficia de produto bom para Rodrigo.
3. **Mídia paga de qualquer natureza** (Meta, Google, TikTok Ads, ML Ads, patrocínio).
4. **Construção de presença em novos canais** (YouTube longo, LinkedIn, Discord, Telegram).
5. **Parcerias formais com influenciadores, bancas físicas ou distribuidoras Panini** — ciclo incompatível com solo + 90 dias.

## 3. Plano

### a. Calendário 30/60/90

#### Dias 0-30 (28/04 → 28/05) — Pré-pico: produto pronto para receber tráfego

Álbum Copa 2026 lançado em 30/04. Mercado secundário demora 2-4 semanas para aquecer. Janela pequena, mas real, para colocar canais no ar antes do pico.

1. **Implementar banner cross-sell em P1 pós-checkout.** *Critério de feito:* banner em produção com UTM, ≥1 clique em Vercel Analytics. *Prazo:* até 05/05.
2. **Mapear e contatar admins de 8-10 grupos WhatsApp Copa 2026.** *Critério:* mensagem enviada para cada admin, resposta/silêncio documentados. *Prazo:* até 12/05.
3. **Publicar 3-4 vídeos no perfil do fundador** (arquétipo Rodrigo). *Critério:* publicados, link na bio com UTM, cliques documentados semana a semana. *Prazo:* 1 vídeo/semana a partir de 02/05.
4. **Abrir trial PRO manual para 2-3 sellers que entrarem via outreach.** *Critério:* `Seller.plan = 'PRO'` setado manualmente, data registrada, follow-up agendado para 14 dias depois.
5. **Registrar todas as conversas de feedback em documento central.** *Critério:* ≥3 registros de feedback real (não seed).

**Hipótese principal:** "cross-sell P1 traz ≥3 cadastros rastreáveis em 30 dias". Se falhar, sobreposição P1↔P8 menor que esperado.

#### Dias 31-60 (28/05 → 28/06) — Entrada da Copa: dobrar o que funcionou

Copa começa em junho. Mercado secundário em aquecimento.

1. **Análise dos dados dos primeiros 30 dias.** *Critério:* tabela com cadastros por canal, conversão FREE→PRO, feedback qualitativo organizado por tema — feito até 31/05.
2. **Dobrar canal com melhor razão cadastro/hora.** *Critério:* decisão documentada com dado, não intuição.
3. **Ativar trial PRO Copa para novos cadastros** (01/06 → 15/07, 14 dias automático sem cartão). Requer `Seller.trialEndsAt` + lógica de gate. *Critério:* 1 seller novo em junho recebe PRO automaticamente.
4. **Entrevistar ≥3 sellers que cadastraram mas não voltaram** via WhatsApp direto. *Critério:* 3 conversas com perguntas dos §9, transcrições resumidas.
5. **Continuidade de conteúdo:** 1 vídeo/semana com dados reais ("essa semana a vitrine recebeu X visitas"). *Critério:* publicado com engajamento documentado.

**Pivô possível:** se 30 dias = 0 cadastros via UTM rastreado, parar de ampliar. Hipótese de posicionamento cai. Ação: 1 semana de conversas qualitativas com 5 vendedores de grupos sem pitch — só diagnóstico de dor.

#### Dias 61-90 (28/06 → 28/07) — Pico Copa: conversão ou diagnóstico

Final Copa: 19/07/2026. Última chance para gerar MRR real na Copa 2026.

1. **Converter trials ativos em pagantes.** Follow-up por WhatsApp 3 dias antes do vencimento: "seu trial vence em 3 dias — veja seus números do mês" + link de upgrade. *Critério:* ≥30% dos trials que chegaram ao fim fizeram upgrade.
2. **Medir resultado da janela Copa.** *Critério:* tabela com sellers cadastrados, sellers PRO pagantes, MRR, fonte de aquisição — pronta até 20/07.
3. **Decidir o que vem depois.** *Critério:* decisão explícita documentada (não "vamos ver"). Se ≥10 PRO pagantes em 31/07 → produto validado, investir em remover fricção. Se <5 → diagnóstico antes de Brasileirão 2026 / temporada 2027.
4. **Não lançar features novas durante pico.** *Critério:* zero commits de feature-nova entre 15/07 e 31/07, apenas hotfix e observability.
5. **Consolidar feedback via NPS simples** (escala 0-10 via WhatsApp): "de 0 a 10, qual a chance de você recomendar?" *Critério:* ≥5 respostas documentadas.

### b. Métricas-chave por canal

| Canal | Métrica primária | Meta 30d | Meta 60d | Meta 90d | Como medir |
|---|---|---|---|---|---|
| Cross-sell P1 | Sellers cadastrados via `utm_source=p1` | 3 | 8 | 15 | Vercel Analytics evento `seller_signup` + `Seller.acquisitionSource` |
| Outreach grupos WhatsApp | Sellers em trial PRO | 2 | 5 | 10 | Planilha + `Seller.plan = 'PRO'` + `Seller.acquisitionSource = 'whatsapp-group'` |
| Conteúdo IG/TikTok | Cliques no link da bio com cadastro | 5 | 15 | 25 | `utm_source=ig` em Vercel Analytics |
| **Saúde geral** | **Sellers PRO pagantes (não trial)** | **0-2** | **3-6** | **≥10** | `Seller.plan = 'PRO'` + `SubscriptionEvent` com `invoice.payment_succeeded` |

Metas conservadoras por design — produto em validação, zero tráfego confirmado. Metas agressivas seriam teatro.

**Fórmulas:**
- Taxa de conversão cadastro→PRO pago: `sellers PRO pagantes ÷ sellers cadastrados` (excluindo trials ativos). Meta: ≥20% até 90d.
- Tempo médio FREE→PRO: mediana de dias entre `Seller.createdAt` e primeiro `SubscriptionEvent` de PRO. Meta informativa.
- Taxa trial→pago: `trials convertidos ÷ trials vencidos`. Meta: ≥30%.

### c. Critério de pivô por canal

- **Cross-sell P1:** se em 30 dias <2 cadastros rastreados, audiência P1 não é ICP suficiente. Ação: rever copy V2 ou aceitar que P1 ≠ P8. Investigar antes de cortar.
- **Outreach grupos:** se em 45 dias nenhum dos sellers em trial demonstrar uso real (acessou painel ≥3 vezes), produto não resolve a dor no contexto. Ação: voltar para diagnóstico — entrevistar trials sobre onde pararam. Possível causa: G10 não resolvido.
- **Conteúdo IG/TikTok:** se 4 semanas (4 vídeos) com 0 cadastros via UTM, audiência atual não é ICP. Ação: parar — não é qualidade, é audiência errada. Retomar quando produto tiver casos reais.

**Regra geral:** nenhum canal cortado por underperformance em <4 semanas. Cortar antes é reagir a ruído.

### d. Hipóteses a validar antes de escalar

| # | Hipótese | Invalidação | Prioridade |
|---|---|---|---|
| **H1** | Rodrigo reconhece o produto como solução para perda de venda (não "app de estoque") | Feedbacks dos primeiros 5 sellers não mencionam "venda perdida" / "tempo de resposta"; só "organização" / "parecer profissional" | **Crítica** |
| **H2** | Audiência do P1 tem sobreposição real com vendedor-alvo do P8 | <2 cadastros via `utm_source=p1` em 30d com ≥500 pageviews no banner | Alta |
| **H3** | Trial PRO 14 dias converte ≥30% para pagante | Trials com 14+ dias de uso, <20% upgrade | Alta |
| **H4** | Onboarding atual (G10) bloqueia Camila mas não Rodrigo | Sellers Rodrigo abandonam onboarding antes de adicionar 10 figurinhas | Média |
| **H5** | "Lista de faltantes" (G11) aumenta retenção quando promovida | Nenhuma diferença observável na retenção 14d entre quem recebeu tutorial e quem não | Média |
| **H6** | Limite FREE 100 converte Rodrigo durante Copa | Sellers que atingem teto fazem downgrade de estoque ou abandonam | Média |
| **H7** | Fundador consegue executar 1 vídeo/sem + outreach + banner P1 em paralelo com dev | Em 2 semanas consecutivas, uma das 3 atividades = zero | Operacional |

### e. Riscos do plano

1. **Conteúdo semanal colapsa em competição com bugs.** 1 vídeo/sem é sustentável no papel; bug em pico Copa consome 1-2 dias. *Mitigação:* vídeo é o canal de menor obrigação — primeiro a ceder em semana pesada (não outreach, não banner P1). Aceitar essa hierarquia antes de começar.
2. **Outreach depende de admins externos.** Sem controle sobre resposta. *Mitigação:* expandir para 15-20 grupos. Framing como benefício para o grupo, não pitch. Aceitar 30-50% sem resposta; 5-6 positivos de 15-20 é razoável.
3. **Cross-sell P1 exige coordenação de dev em dois projetos.** Banner em P1 é mudança em projeto separado (Firebase Hosting). *Mitigação:* limitar escopo ao mínimo: banner estático com link UTM hardcoded. Sem integração de dados.
4. **G1-G8 não resolvidos antes do marketing.** Roteiro §19 prevê Etapa 1 (sangria, 5d) antes da Etapa 4 (aquisição). Se marketing começa antes de fechar G2/G4/G5, qualquer seller que tente upgrade pode receber 500 sem fundador saber. *Mitigação direta:* prioridade absoluta = fechar G2 + G4 antes de ligar qualquer canal (especialmente cross-sell P1). Banner P1 só vai ao ar depois de Stripe seguro.
5. **Janela Copa finita; resultado pode ser "0 sellers PRO em 90 dias".** É legítimo. Não é fracasso de produto — é dado. Causas prováveis: (a) Rodrigo não existe em volume suficiente como persona pré-Copa, ou (b) produto não remove fricção em tempo adequado. **Não existe "trial PRO infinito" como resposta a zero tração — treina o mercado a nunca pagar.** Se 90d = <3 sellers PRO pagantes, decisão correta é diagnosticar e pivotar.

## 4. Relatório executivo

**Estado atual.** P8-FigurinhasPro está em pré-tração validável: monetização configurada (FREE / PRO R$ 29 / UNLIMITED R$ 59), gates ativos, mas zero sellers PRO documentados a partir do código. Cockpit comercial existe mas populado por seed. Sem canal de aquisição em operação (G8 — Crítico).

**Persona prioritária (90d).** **Rodrigo apenas** — alvo PRO, ROI claro (PRO R$ 29 se paga em 1 semana de Copa), valor monetário aproximável pelo próprio usuário. Camila e Paulo saem do escopo de campanha.

**Mensagem central.** "Venda perdida evitada" — única unidade quantificável pelo usuário sem benchmark externo. 5 variantes testáveis por canal (DM WhatsApp, banner P1, Stories IG, Reels/TikTok, landing).

**3 canais orgânicos** (zero verba, fundador solo):

1. **Cross-sell P1 (Arena Cards)** — banner pós-checkout com UTM. Custo: 2 dias dev. Meta 90d: 15 cadastros via UTM.
2. **Outreach manual em 8-10 grupos WhatsApp Copa 2026** — proposta de valor para admin, 2-3 vendedores por grupo recebem 30 dias PRO grátis. Custo: 2-4h mapeamento + 30-60 min/sem. Meta 90d: 10 sellers em trial PRO.
3. **Conteúdo orgânico Instagram/TikTok** — 1 vídeo/semana, arquétipo Rodrigo. Custo: 2-3h/sem. Meta 90d: 25 cadastros via `utm_source=ig`.

**Saúde geral 90d:** ≥10 sellers PRO pagantes (não trial). Meta agressiva mas não ridícula dada validação inicial.

**4 gaps identificados nesta fase:**

- **GM1** — Falta `Seller.acquisitionSource` para tracking de UTM (campo não existe no schema).
- **GM2** — Falta lógica de trial PRO automático (`Seller.trialEndsAt` + cron de downgrade).
- **GM3** — Falta upgrade contextual disparado por `plan_limit_hit` (G7 da estratégia geral, ainda aberto).
- **GM4** — Falta script de mapeamento de grupos WhatsApp e planilha de tracking manual (zero infra de outreach).

**Pré-condição absoluta para ligar canais:** fechar G2 (`/api/bot/quote` falsificável) + G4 (Stripe 500 silencioso) + G5 (Sentry capturando handlers que engolem erros) **antes** do banner P1 ir ao ar. Isso significa Etapa 1 do roteiro §19 (sangria, 5 dias) em paralelo com mapeamento de grupos (que não passa por Stripe ainda).

**Decisão crítica em 31/07/2026.** Se ≥10 sellers PRO pagantes → produto validado, investir em remover fricção (G10 onboarding, G11 lista de faltantes). Se <5 → diagnosticar antes de Brasileirão 2026 / Copa América 2027.

**Próxima fase Oracle:** `/oracle:estrategia-estrutura` — re-analisar código sob luz dos achados (Geral + Marketing) e propor nova organização técnica/de pastas.
