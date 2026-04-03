Antes de escrever qualquer codigo para "$ARGUMENTS":

1. Crie `docs/features/$ARGUMENTS.md` com:
   - **Objetivo**: O que muda para o usuario final (1-2 frases)
   - **Criterios de aceitacao**: Lista numerada, mensuravel (ex: "campo X aparece na tela Y")
   - **Invariantes de dominio afetados**: Quais regras de negocio essa feature toca?
     Consulte a skill `dominio-colecionador` se necessario.
   - **Edge cases**: Minimo 2 cenarios de borda identificados
   - **Arquivos impactados**: Lista completa de arquivos que serao criados ou modificados
   - **Risco**: Algo pode quebrar? Quais testes existentes cobrem a area afetada?

2. Se a feature envolve Firestore, consulte `firestore.rules` e a skill `firebase-patterns`.

3. Se a feature envolve albuns ou figurinhas, consulte a skill `catalogo-albuns`.

4. Apresente o plano e AGUARDE aprovacao explicita antes de escrever codigo.

NAO escreva codigo. NAO crie testes. Apenas planeje.
