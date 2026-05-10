---
data: <YYYY-MM-DD>
tipo: decisao
topico: <slug-curto>
autor: <email>
projeto: P8-FigurinhasPro
relacionados: [pesquisas/<arquivo>.md]
status: ativo
sha: <git short SHA>
branch: <branch>
adr_numero: <opcional, ex: 0001>
---

# Decisão: <título no imperativo>

## Contexto

<O que motivou esta decisão? Qual problema, qual constraint?>

## Decisão

<Resumo da decisão em 1-3 frases. No imperativo.>

## Razões

- <Por que esta opção e não outras>
- <Constraint que pesou>
- <Trade-off aceito>

## Alternativas consideradas

### Alternativa 1: <nome>

- Prós: <lista>
- Contras: <lista>
- Por que descartada: <razão>

### Alternativa 2: <nome>

- Prós: <lista>
- Contras: <lista>
- Por que descartada: <razão>

## Consequências

- <O que muda no projeto>
- <Quem precisa saber>
- <O que precisa ser revisitado em N meses>

## Quando rever

<Critério de revisão. Ex: "Quando atingir 10k vendedores ativos" ou "Em 6 meses">

---

> ADR — Architectural Decision Record. Decisões viram canônicas; reversões são novas decisões que citam esta como `relacionados`.
