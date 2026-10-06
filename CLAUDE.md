# claude-ai-shorts-editor

Fábrica de cortes virais: vídeo longo → reels 9:16 com rosto enquadrado, legenda animada e motion graphics.

## Como funciona
- O usuário roda **`./ae auto <video|URL>`**. O script baixa o vídeo, transcreve com Whisper local, chama o Claude (`claude -p`) para escrever o roteiro, valida, produz e chama o Claude de novo para revisar.
- O que precisa de inteligência fica no **roteiro** `edit/roteiros/<video>.json`, escrito pelo Claude. Formato: `skill/corte-viral/references/roteiro.md`.
- Fluxo e regras: skill `corte-viral` (`skill/corte-viral/SKILL.md`, ligada em `~/.claude/skills/corte-viral`). Prompts do modo automático: `skill/corte-viral/prompts/`.
- O usuário **não escreve nem escolhe nada**: o Claude decide e documenta o porquê no roteiro.

## Peças
- `./ae`: atalhos (`./ae ajuda`). O Claude pode rodar `./ae validar`, `./ae tsc`, `./ae still` e `./ae cena`. Quem roda `./ae produzir` e `./ae auto` é o usuário.
- Transcrição: `skill/corte-viral/scripts/whisper_local.py`, com faster-whisper na GPU NVIDIA ou no processador.
- Cortes horizontais: skill `video-use` (`~/.claude/skills/video-use`).
- Composição: `remotion/` (Remotion 4, criado pelo instalador a partir de `skill/corte-viral/template/`). Cada reel é `remotion/public/clips/<chave>/` → composição `reel-<chave>`. Cenas ilustradas em `remotion/src/scenes/`.
- O posicionamento de textos e cards é automático (`remotion/src/motions/layout.ts`) e nunca cobre o rosto.

## Pastas
- `bruto/`: fontes inteiras (não editar)
- `edit/`: transcrições, `takes_packed.md`, `roteiros/`, `cortes/<chave>/` (gerado), `logs/` (logs do Claude), `producao.json`
- `publicar/`: reels finais (`publicar/rapido/` = prévias em meia resolução)

## Regras
- Antes de baixar conteúdo de terceiros, confirmar que há direito de uso.
- Nunca colar a transcrição inteira no chat; ler `edit/takes_packed.md`.
