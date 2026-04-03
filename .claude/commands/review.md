Revisar as alteracoes atuais como reviewer externo:

## 1. Escopo

```bash
git diff --stat
```
Liste todos os arquivos alterados.

## 2. Checklist por arquivo

Para cada arquivo modificado, avalie:

- [ ] Segue os patterns existentes do projeto? (hooks para logica, componentes para UI)
- [ ] Tem testes cobrindo a mudanca? (obrigatorio para logica de negocio)
- [ ] Acesso direto ao Firestore fora de hooks/services?
- [ ] API keys ou secrets expostos em codigo?
- [ ] Imports desnecessarios ou codigo morto adicionado?
- [ ] Vocabulario BR na interface? ("brilhante" nao "foil", "faltante" nao "missing")
- [ ] AlbumPage continua unificada? (visitante + logado na mesma pagina)

## 3. Verificacao automatizada

```bash
npm run build && npm test && npx tsc --noEmit
```

Se qualquer um falhar, o review e automaticamente BLOQUEADO.

## 4. Veredito

Emita UM dos dois:
- **APROVADO** — pronto para deploy
- **BLOQUEADO** — liste cada problema com severidade (CRITICO / ALTO / MEDIO) e arquivo afetado

Problemas CRITICO ou ALTO devem ser corrigidos antes de prosseguir.
