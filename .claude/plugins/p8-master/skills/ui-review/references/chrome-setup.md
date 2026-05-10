# `/chrome` — Setup + Troubleshooting

> Quick-start pra ativar Claude in Chrome no P8-FigurinhasPro. Carregado on-demand pela skill `/p8-master:ui-review` quando precisar diagnosticar problema de conexão.

## Pré-requisitos

- **Claude Code** versão 2.0.73+ — checar com `claude --version`
- **Plano Anthropic direto** — Pro, Max, Team ou Enterprise (não funciona via Bedrock/Vertex/Foundry sem conta claude.ai separada)
- **Browser** — Chrome ou Microsoft Edge (Brave, Arc, outros Chromium **não suportados**)
- **Ambiente** — Windows nativo, macOS, Linux nativo (**WSL não funciona**)
- **Extensão instalada** — [Claude in Chrome no Chrome Web Store](https://chromewebstore.google.com/detail/claude/fcoeoabgfenejglbffodgkkbkcdhcgfn), versão 1.0.36 ou superior

## Ativação

### Opção A — Iniciar sessão já com `/chrome`

```bash
claude --chrome
```

### Opção B — Ativar em sessão existente

Dentro do Claude Code:

```
/chrome
```

Aparece menu com opções de conexão. Selecione "Conectar extensão" se for primeira vez.

### Opção C — Sempre ativo no projeto

```
/chrome
```

→ selecione **"Enabled by default"**.

**Custo:** aumenta consumo de contexto em todas as sessões do projeto (tools sempre carregadas). Útil pra projeto que valida UI com frequência, evite em projetos backend-puro.

## Verificar conexão

```
/chrome
```

Mostra status (conectado/desconectado), permissões por site, e oferece reconectar.

Para ver tools disponíveis:

```
/mcp
```

Procurar `claude-in-chrome` na lista. Selecionando, lista todas as ferramentas (navigate, click, type, screenshot, console, etc.).

## P8-FigurinhasPro — Setup específico

### Dev server

A skill `/p8-master:ui-review` assume `localhost:3009`. Se estiver rodando em outra porta (override `next dev -p <PORTA>`), avisar a skill no argumento:

```
/p8-master:ui-review logout confirm --port 3001
```

(skill ainda não suporta esse flag — TODO se virar pattern frequente)

### Permissões por site

A primeira vez que a skill acessar `localhost:3009` ou `album-digital-ashen.vercel.app`, o Chrome perguntará permissão. Aprovar:
- **localhost:3009** — permite clicar e digitar (dev)
- **album-digital-ashen.vercel.app** — permite clicar e digitar (produção, só leitura idealmente)

### Login persistente

`/chrome` compartilha cookies do browser. Se já está logado no `/painel/comercial` ou em `/painel`, a skill testa direto. Não precisa mockar `fp_session` cookie.

## Problemas comuns

### "Browser extension is not connected"

1. Verifique que a extensão está habilitada em `chrome://extensions`
2. Reinicie Chrome + Claude Code
3. Execute `/chrome` → "Reconnect extension"

### "Extension not detected" no primeiro uso

Claude Code instala um native messaging host config. Chrome só lê na inicialização:

```
# Windows — verificar registro
reg query "HKCU\Software\Google\Chrome\NativeMessagingHosts" /s | grep claude
```

Se ausente, reinstalar Claude Code e reiniciar Chrome.

### "Receiving end does not exist"

Service worker da extensão hibernou. `/chrome` → "Reconnect extension".

### Connection drops em sessão longa

Mesmo problema (service worker idle). Reconectar.

### Named pipe conflict (Windows)

Outra sessão Claude Code está usando o mesmo named pipe.

```powershell
# Listar processos claude
Get-Process | Where-Object { $_.ProcessName -match "claude" }
```

Fechar sessões duplicadas, reiniciar.

## Quando fazer fallback pra Playwright MCP

A skill `/p8-master:ui-review` automaticamente cai pra Playwright se:

1. `claude --version` < 2.0.73
2. WSL detectado (`uname -r | grep -i microsoft`)
3. Plano não suportado (Bedrock/Vertex via terceiro sem claude.ai account)
4. `/chrome` não aparece em `/mcp` mesmo após reconexão
5. Browser ausente ou versão antiga

Para Playwright como fallback, ativar via `.mcp.json` do projeto (já existe install em `~/.claude/plugins/cache/claude-plugins-official/playwright/`):

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

Reiniciar sessão. Tools `mcp__playwright__browser_*` ficam disponíveis.

## Ver também

- [Claude Code Chrome docs (oficial)](https://code.claude.com/docs/en/chrome)
- [Claude in Chrome extension](https://chromewebstore.google.com/detail/claude/fcoeoabgfenejglbffodgkkbkcdhcgfn)
- [Computer use (apps nativos macOS)](https://code.claude.com/docs/en/computer-use) — não aplicável ao P8 (web app + Windows)
