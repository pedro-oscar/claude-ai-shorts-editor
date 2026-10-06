Você está rodando **sem ninguém para responder** (chamado por `./ae auto`/`./ae revisar`). Não faça perguntas.

Use a skill **corte-viral**. Leia `{SKILL}/SKILL.md` (seção 7, Revisão), `{SKILL}/references/roteiro.md` e `{SKILL}/references/aprendizados.md`.

## Tarefa

Os reels do roteiro `{ROTEIRO}` acabaram de ser produzidos.

1. Leia `edit/producao.json`: lista de reels, avisos e erros.
2. Abra **cada** `revisao.png` listada (quadros do reel com o tempo no canto) e verifique:
   - rosto inteiro no quadro, sobretudo depois de trocas de câmera;
   - legenda legível e sem nada por cima;
   - contraste do texto com o fundo;
   - nenhum texto vazando da tela;
   - motion no momento certo;
   - nenhum texto ou card cobrindo o rosto de quem está em foco. O layout já evita isso; se acontecer, é sinal de rosto mal detectado: adicione `pin` ou encurte o texto;
   - final suave: o último quadro fecha uma frase e não corta no meio de uma palavra ou ideia;
   - nenhuma cena em tela cheia escondendo o rosto tempo demais. Cards podem virar tela cheia sozinhos quando não há espaço; se forem muitos, troque alguns por keyword/counter.
3. Se o rosto estiver errado, olhe `edit/cortes/<chave>/verify_face/` e adicione `pin` ao corte (tempos **do corte**).
4. Corrija o que for necessário **no roteiro** (trechos, motions, pin, ênfase, correções, estilo) e rode `./ae validar {ROTEIRO}` até passar. Para erros de cena, corrija o componente em `remotion/src/scenes/` e rode `./ae tsc`.
5. Só mude o que melhora de verdade. Não troque escolhas boas por gosto.
6. Se o pedido do usuário (abaixo) expressar uma **preferência geral**, que vale para os próximos vídeos (ex.: "nunca use emoji nos títulos", "prefiro legenda em minúsculas"), acrescente uma linha datada em `{SKILL}/references/aprendizados.md`, na seção certa. Pedidos sobre um corte específico não viram regra.

**Não** rode `./ae produzir`.
{EXTRA}
## Resposta final

Liste o que mudou, por corte (ou "nada"). A **última linha** deve ser exatamente `ROTEIRO_ATUALIZADO` se você alterou algum arquivo, ou `SEM_MUDANCAS` se não alterou.
