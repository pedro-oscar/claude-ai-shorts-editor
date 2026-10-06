Você está rodando **sem ninguém para responder** (chamado por `./ae auto`). Não faça perguntas: decida e documente o porquê no roteiro.

Use a skill **corte-viral**. Leia, nesta ordem:
- `{SKILL}/SKILL.md`
- `{SKILL}/references/aprendizados.md` (regras do usuário, têm prioridade)
- `{SKILL}/references/rubrica-viral.md`
- `{SKILL}/references/roteiro.md`
- `{SKILL}/references/motion-guide.md`

## Tarefa

O vídeo `{VIDEO}` já foi transcrito. A transcrição compacta está em `edit/takes_packed.md`, na seção `## {STEM}`; ignore as outras seções. Para precisão de palavra, consulte `edit/transcripts/{STEM}.json` só com `python3`/`grep` em janelas pequenas, nunca inteiro.

1. Leia a seção inteira (em blocos, se for longa) e avalie de 10 a 16 candidatos com a rubrica.
2. Escreva o roteiro em `{ROTEIRO}`, no formato de `references/roteiro.md`:
   - até **{CORTES}** cortes com `"status": "produzir"` (nota ≥ 7, categorias variadas); os demais bons candidatos como `"reserva"`;
   - `"fonte": "{VIDEO}"`;
   - para cada corte: `trechos` enxutos (sem enrolação, começando no gancho), `titulo`, `enfase`, `motions` sincronizados com `word` + `at`, e `gancho`, `payoff`, `porque`, `nota`, `categoria`;
   - duração ideal 35–60 s; **até 90 s só quando a história precisar**;
   - o **último trecho termina numa frase completa** que fecha a ideia, sem corte seco no meio de raciocínio;
   - a posição dos motions é automática e nunca cobre o rosto: escolha só tipo, conteúdo e tempo. Textos curtos (título ≤ 5 palavras, keyword ≤ 2), nada nos últimos 0,8 s. Em plano fechado, prefira keyword/counter a cards;
   - `correcoes` globais para nomes próprios e termos que o Whisper errou.
3. Se algum motion `scene` precisar de ilustração que não existe em `remotion/src/scenes/`, crie a cena:
   - padrão de `Dinheiro.tsx`, caixa 940×760, SVG em código;
   - registre em `SCENES` e coloque props de exemplo em `EXEMPLOS`, ambos no `index.ts`.
   - Se forem várias, use um sub-agente por cena, em paralelo; sub-agentes não rodam comandos, então quem valida é você.
   - Rode `./ae tsc` até passar e confira cada cena nova com `./ae cena <Nome> <segundos> card` (gera um PNG em `remotion/out/`; abra e olhe).
   - Não crie arquivos de pré-visualização avulsos.
4. Rode `./ae validar {ROTEIRO}` e corrija até não haver erros nem avisos relevantes.

Se o pedido do usuário (abaixo) expressar uma **preferência geral**, que vale para os próximos vídeos, registre-a com data em `{SKILL}/references/aprendizados.md`.

**Não** rode `./ae produzir`, não baixe nada e não altere arquivos fora de `edit/roteiros/`, `remotion/src/scenes/` e `{SKILL}/references/aprendizados.md`. Rascunhos e scripts auxiliares vão em `/tmp`.
{EXTRA}
## Resposta final

Uma tabela curta: id | duração | título | nota | por quê. Depois, uma linha por cena nova criada.
