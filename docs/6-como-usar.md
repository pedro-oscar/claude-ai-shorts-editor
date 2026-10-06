# 6. Como usar

Sempre comece abrindo o terminal e entrando na pasta do projeto:

```bash
cd ~/claude-ai-shorts-editor
```

---

## O comando principal

### Com um link do YouTube

```bash
./ae auto "https://www.youtube.com/watch?v=XXXX"
```

Coloque o link **entre aspas**.

### Com um arquivo do seu computador

```bash
./ae auto ~/Videos/meu-podcast.mp4
```

- No **Windows (WSL)**, um vídeo da sua pasta Vídeos fica em `/mnt/c/Users/SEU_USUARIO/Videos/meu-podcast.mp4`.
- Dica: digite `./ae auto ` e **arraste o arquivo** para a janela do terminal; o caminho aparece sozinho.

### O que você vai ver

```
== 1/5 Fonte                    baixa o vídeo (ou usa o seu arquivo)
== 2/5 Transcrição              transcreve o áudio
== 3/5 Roteiro (Claude)         o Claude lê, escolhe os cortes e escreve o roteiro
  → Read edit/takes_packed.md   (cada ação do Claude aparece com →)
  ...
== 4/5 Produção                 corta, enquadra, legenda, anima e renderiza cada reel
  [1/6] c01 — Título do corte
== 5/5 Revisão do Claude        o Claude olha os reels e corrige o que precisar
== Pronto em 34 min
```

Pode deixar rodando e ir fazer outra coisa. **Não feche o terminal** até aparecer "Pronto".

### Quanto tempo leva?

Os tempos abaixo são do teste numa RTX 4090 com um trecho de 10 minutos e 2 cortes, que terminou em 28 minutos.

| Etapa | Tempo |
|---|---|
| Download | Depende da internet. Com `--trecho`, o pedaço é recodificado e demora mais |
| Transcrição (NVIDIA) | Vídeos de até 30 min: cerca de 1/4 da duração (usa o modelo mais preciso). Acima disso: cerca de 1/20, ou seja, 1 h de vídeo em uns 3 min |
| Transcrição (sem NVIDIA) | Bem mais lenta, pode passar da duração do vídeo |
| Roteiro (Claude) | 5–15 min |
| Produção | 1–3 min por reel |
| Revisão (Claude) | 3–8 min |

---

## Opções

Coloque as opções depois do link ou do arquivo:

| Opção | O que faz | Exemplo |
|---|---|---|
| `--cortes N` | Quantos reels produzir (padrão: 6) | `--cortes 10` |
| `--rapido` | Prévia em meia resolução, bem mais rápida. Os vídeos vão para `publicar/rapido/` | `--rapido` |
| `--trecho INÍCIO FIM` | Usa só uma parte do vídeo do YouTube | `--trecho 30:00 1:15:00` |
| `--pedido "..."` | Instruções extras para o Claude | `--pedido "foco em finanças, títulos provocativos"` |
| `--revisoes N` | Quantas rodadas de revisão do Claude (padrão 1; 0 desliga) | `--revisoes 2` |
| `--modelo M` | Qual modelo do Claude usar | `--modelo opus` |

Exemplo completo:

```bash
./ae auto "https://www.youtube.com/watch?v=XXXX" --trecho 10:00 55:00 --cortes 8 --pedido "público jovem, tom leve" --rapido
```

> **Fluxo recomendado:** rode com `--rapido`, assista às prévias e, se gostar, rode `./ae produzir` para gerar a versão final em resolução cheia. Esse comando não chama o Claude de novo e só refaz o render.

---

## Onde ficam os resultados

| Pasta / arquivo | O que tem |
|---|---|
| `publicar/` | **Os reels prontos** (`<video>-c01.mp4`, `-c02.mp4`, …) |
| `publicar/rapido/` | As prévias, quando você usou `--rapido` |
| `edit/roteiros/<video>.md` | **O roteiro explicado:** por que cada corte foi escolhido, o gancho, a conclusão, a legenda e as animações |
| `edit/cortes/<chave>/revisao.png` | Folha com quadros de cada reel, a mesma que o Claude usou para revisar |
| `bruto/` | O vídeo original baixado |
| `edit/logs/` | Tudo o que o Claude fez, passo a passo |

Para abrir uma pasta: `explorer.exe publicar` (Windows), `open publicar` (macOS) ou `xdg-open publicar` (Linux).

---

## Não gostou de algo? Peça em português

```bash
./ae revisar --pedido "o c02 começa devagar, comece pela frase do salário; e use menos texto na tela"
./ae produzir
```

- `./ae revisar` faz o Claude ajustar o roteiro do último vídeo.
- `./ae produzir` refaz **só o que mudou**.

Exemplos de pedidos:
- "troque o título do c03 por algo mais curto"
- "deixe a legenda em letras minúsculas"
- "use azul no lugar do vermelho"
- "o c05 está longo, deixe com no máximo 45 segundos"
- "no c01 o rosto está cortado aos 12 segundos"
- "crie uma animação de uma balança no c04 quando ele fala de justiça"

Para produzir só alguns cortes: `./ae produzir --so c01,c03`.

---

## Ver e mexer no navegador (opcional)

```bash
./ae studio
```

Abra http://localhost:3000 no navegador. Cada reel aparece como `reel-<chave>`, e dá para assistir e ver as animações quadro a quadro. Para fechar, `Ctrl+C` no terminal.

---

## Todos os comandos

| Comando | Para quê |
|---|---|
| `./ae auto <link ou arquivo>` | Faz tudo |
| `./ae verificar` | Confere se a instalação está OK |
| `./ae demo` | Reel de demonstração |
| `./ae baixar <link> [INÍCIO FIM]` | Só baixa |
| `./ae transcrever <arquivo>` | Só transcreve |
| `./ae roteirizar <arquivo>` | Só o Claude escreve o roteiro |
| `./ae validar` | Confere o roteiro |
| `./ae produzir` | Renderiza os reels do roteiro mais recente |
| `./ae revisar --pedido "..."` | O Claude ajusta o roteiro |
| `./ae studio` | Abre o Remotion Studio |
| `./ae limpar <prefixo>` | Apaga reels e cortes gerados de um vídeo (mantém o original, a transcrição e o roteiro) |
| `./ae ajuda` | Lista tudo |

---

## Dicas para cortes melhores

- **Vídeos com gente falando para a câmera** dão os melhores resultados: podcast, entrevista, pregação, aula.
- **Áudio limpo** melhora a transcrição e a legenda.
- **Nomes difíceis?** Coloque no pedido: `--pedido "os nomes certos são Fulano de Tal e Empresa Exemplo"`. O Claude corrige a legenda.
- **Gravações de tela** com a câmera num cantinho não ficam boas: o enquadramento segue o rosto e a tela some.
- O Claude aprende com você. Quando você pede algo como "nunca use emoji nos títulos", ele pode guardar como regra para os próximos vídeos, em `skill/corte-viral/references/aprendizados.md`.
- Os cortes ficam entre **35 e 60 segundos**, e chegam a **90 s** quando a história precisa. Terminam numa frase completa, com uma saída suave.
- Textos e animações **nunca ficam em cima do rosto**: o programa calcula o espaço livre sozinho.

---

## Como funciona por dentro (para curiosos)

1. O **Whisper** gera o texto com o tempo de cada palavra (`edit/transcripts/`).
2. O **Claude** escreve `edit/roteiros/<video>.json`: os trechos de cada corte, o título, as palavras em destaque, correções de legenda e as animações sincronizadas com as palavras. Se precisar de uma ilustração que ainda não existe, ele **programa uma nova** em `remotion/src/scenes/`.
3. O **video-use** corta os trechos e trata cor e áudio.
4. O **OpenCV** acha o rosto em cada momento para enquadrar o vertical.
5. O **Remotion** monta o reel: vídeo, legenda, animações e saída suave.
6. O **Claude** olha a folha de revisão de cada reel e corrige o roteiro se precisar.

O formato completo do roteiro está em `skill/corte-viral/references/roteiro.md`.
