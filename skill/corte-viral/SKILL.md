---
name: corte-viral
description: Transforma vídeos longos (podcast, live, entrevista, aula) em cortes verticais 9:16 prontos para Reels/TikTok/Shorts. O Claude transcreve localmente, escolhe sozinho os melhores trechos (gancho → desenvolvimento → payoff) e escreve um roteiro completo (trechos, título, legenda, ênfases, correções, motion graphics e cenas ilustradas); o usuário só roda `./ae produzir` para renderizar tudo. Use quando o usuário pedir cortes, clipes, reels, shorts, "corte viral", "cortar podcast", "achar os melhores momentos", "deixar na vertical" ou "colocar motion/legenda" em um vídeo.
---

# Corte viral

**Divisão de trabalho:**
- **O Claude escreve tudo:** transcreve, seleciona, escreve o roteiro, cria cenas e valida.
- **O usuário só roda um comando:** `./ae produzir`.
- **Não peça ao usuário para escolher cortes, escrever JSON ou editar arquivos.** Decida, documente o porquê no roteiro e entregue.

Fluxo: **fonte → transcrição → seleção → roteiro → cenas → validação → (usuário produz) → revisão → aprendizado.**

**Modo 100% automático:** `./ae auto <video|URL>` faz o fluxo todo e chama o Claude em modo não interativo (`claude -p`) com `prompts/roteirizar.md` e depois `prompts/revisar.md`.
- Quando você estiver rodando a partir desses prompts, siga-os: eles têm prioridade sobre as instruções de entrega desta skill.
- Numa conversa normal, o caminho mais simples é dizer ao usuário para rodar `./ae auto <video>`, ou fazer as etapas 1–6 abaixo e entregar `./ae produzir`.

## Caminhos

- `<skill>` = pasta deste SKILL.md (caminho absoluto).
- `<vu>` = `<skill>/../video-use`.
- Python dos scripts: `<py>` = `<skill>/.venv/bin/python` (Windows: `.venv/Scripts/python`).
- Comandos rodam na raiz do projeto.
- Se o projeto tiver o script `./ae` (atalhos), use-o. Se não tiver, copie `<skill>/scripts/ae` para a raiz do projeto e dê `chmod +x`.

```
<projeto>/
├── ae                        atalhos (./ae ajuda)
├── bruto/                    vídeos inteiros, nunca alterados
├── edit/
│   ├── transcripts/          transcrições em cache (uma por vídeo)
│   ├── takes_packed.md       transcrição compacta: é o que você lê
│   ├── roteiros/<video>.json o roteiro que você escreve (+ .md gerado pela validação)
│   ├── cortes/<chave>/       edl.json, cut.mp4, verify_face/, revisao.png (gerados)
│   └── producao.json         resumo da última produção (gerado)
├── remotion/                 cópia de <skill>/template
└── publicar/                 reels finais
```

## 0. Verificação rápida

Rode `./ae verificar`; deve terminar em "Tudo pronto". Se faltar algo:
- `remotion/`: copie `<skill>/template/` e rode `npm install`;
- venv: `uv venv <skill>/.venv`, depois `uv pip install --python <py> -r <skill>/scripts/requirements.txt` e o `requirements-gpu.txt`.

Leia `references/aprendizados.md`: são regras aprovadas pelo usuário e valem mais que este arquivo.

## 1. Fonte

- **Arquivo em `bruto/`:** use-o direto.
- **Link:** `./ae baixar "<URL>"` (vídeo inteiro) ou `./ae baixar "<URL>" INI FIM` (só um trecho).
- **Direito de uso:** se o conteúdo for claramente de terceiros e o usuário não disse que tem direito (canal próprio, cliente, licença), pergunte uma vez antes de baixar.
- **Hotwords:** pegue o título para descobrir os nomes próprios com `yt-dlp --print title "<URL>"` ou pelo nome do arquivo.

## 2. Transcrição (você roda; fica em cache)

```bash
./ae transcrever bruto/<video>.mp4 "Nome do Convidado, Apresentador, Marca, Jargão"
```

Whisper large-v3 local na GPU, literal, com pontuação. Gera `edit/transcripts/<video>.json` e `edit/takes_packed.md`. Um podcast de 2–3 h leva alguns minutos; rode em segundo plano e espere.

Alternativa (o usuário tem chave ElevenLabs em `<vu>/.env`): `<vu>/.venv/bin/python <vu>/helpers/transcribe_batch.py bruto --edit-dir edit`.

**Nunca** cole a transcrição no chat nem leia o JSON bruto: leia `edit/takes_packed.md`. Em vídeos longos, leia em blocos. Para precisão de palavra, consulte o JSON só com `grep`/`python` em janelas pequenas.

## 3. Seleção (você decide)

Leia `references/rubrica-viral.md` e o `takes_packed.md` inteiro.

- Liste mentalmente de 10 a 16 candidatos e dê nota.
- **Produza** os melhores: por padrão até 6, com nota ≥ 7, ou o número que o usuário pedir. Prefira variedade de categorias.
- Os outros entram no roteiro com `"status": "reserva"`.
- Não pare para pedir aprovação.

## 4. Roteiro (você escreve)

Escreva `edit/roteiros/<video>.json` no formato de **`references/roteiro.md`**. Todos os tempos são **da fonte**, os mesmos do `takes_packed.md`.

Para cada corte:

- **`trechos`:**
  - Comece no gancho mais forte. *Cold open* é permitido se não distorcer o sentido.
  - Tire só o que é lixo de verdade: digressões, falsos começos, repetições e pausas mortas (> 1 s). Prefira **poucos trechos longos** a muitos picotes: pausas curtas e o ritmo natural da fala ficam.
  - Duração: **alvo 60–90 s**. Use o tempo para dar o contexto completo, desenvolver e deixar o payoff respirar; não encurte uma boa história para caber num número. Abaixo de 45 s só se a ideia estiver realmente completa (a validação avisa). Acima de 90 s a validação falha.
  - **Final sem corte seco:** o último trecho termina numa frase completa que fecha a ideia, de preferência seguida de uma pausa natural (reação, riso, respiro). Ponha o fim do trecho **depois** da pausa, não na última sílaba. O produzir aproveita até 1,2 s do som depois da última palavra, congela o último quadro se o falante emendar outra frase, e só então escurece; a validação avisa se o corte acabar sem fim de frase.
  - O produzir ajusta os limites às palavras, então tempos aproximados de frase bastam.
- **`titulo`:** manchete do gancho, até 6 palavras, sem repetir a primeira frase.
- **`enfase`:** de 3 a 8 palavras-chave da legenda.
- **`correcoes`** (global): nomes próprios, marcas e termos que o Whisper errou. Procure no `takes_packed.md` grafias estranhas de nomes. Ex.: "Cloud" quando o assunto é Claude.
- **`motions`:** siga `references/motion-guide.md`. A posição é automática e **nunca fica sobre o rosto**; você só escolhe tipo, conteúdo e tempo. Mantenha os textos curtos para não encolherem.
  - Um elemento novo a cada 3–6 s.
  - Use `word` + `at` para sincronizar com a palavra exata.
  - Números viram `counter`; punchlines, `zoom`; viradas, `flash`.
  - Explicações pedem `scene` (card ou full).
  - Deixe ao menos 40% do corte com o rosto limpo.
- **`gancho`, `payoff`, `porque`, `nota`, `categoria`:** preencha sempre. É o que o usuário lê no resumo.

## 5. Cenas ilustradas (você cria, se precisar)

Se um motion `scene` precisar de ilustração que não existe em `remotion/src/scenes/` (existem `Grafico`, `Comparacao`, `Dinheiro`):
- crie o componente seguindo o motion-guide (caixa 940×760, SVG desenhado em código, padrão de `Dinheiro.tsx`) e registre em `index.ts`;
- se forem várias, use **um sub-agente por cena, em paralelo**;
- valide com `cd remotion && npx tsc --noEmit` e um still da cena: `npx remotion still reel-demo out/x.png --frame=…` com props de teste, ou um corte já produzido.

## 6. Validação (você roda antes de entregar)

```bash
./ae validar edit/roteiros/<video>.json
```

Confere:
- trechos dentro do vídeo, ajustados às palavras;
- âncoras `word` encontradas na legenda;
- motions dentro do corte e sem sobreposição;
- cenas registradas;
- durações.

Também gera `edit/roteiros/<video>.md`, o resumo legível. Corrija até sair sem erro e sem avisos relevantes.

**Entrega ao usuário:**
- uma tabela curta dos cortes (id, duração, título, por quê);
- o caminho do resumo `.md`;
- o comando, num bloco próprio: `./ae produzir` (ou `./ae produzir --rapido` para uma prévia em meia resolução).

Não renderize os reels você mesmo, a menos que o usuário peça.

## 7. Revisão (depois que o usuário produzir)

Quando o usuário disser que rodou, ou pedir revisão:
1. leia `edit/producao.json` (avisos e erros);
2. abra cada `edit/cortes/<chave>/revisao.png` e verifique:
   - rosto inteiro no quadro, principalmente depois das trocas de câmera;
   - legenda legível e sem nada por cima;
   - contraste;
   - texto sem vazar;
   - motion no momento certo;
3. se o enquadramento estiver errado, abra `verify_face/` e acrescente `pin` ao corte;
4. ajuste o roteiro, rode `./ae validar` e diga ao usuário para rodar `./ae produzir` de novo. O cache só refaz o que mudou.

## 8. Aprendizado

Quando o usuário aprovar, reprovar ou corrigir algo que deve valer para os próximos vídeos (estilo, ritmo, tipo de corte, erro recorrente), acrescente uma linha datada em `references/aprendizados.md`, sem pedir permissão.

## Problemas conhecidos

- **`faceRatio` baixo:** rosto de perfil, escuro ou pequeno. Confira `verify_face/` e use `pin`.
- **Plano aberto com duas pessoas:** o rastreio fica na maior ou na que já estava. Use `pin` para quem fala.
- **YouTube:** legendas dão HTTP 429; vídeo só com áudio → use o `./ae baixar`, que força https/H.264.
- **Licença do Remotion:** grátis para pessoas físicas e empresas pequenas; empresas maiores precisam de licença (remotion.pro).
