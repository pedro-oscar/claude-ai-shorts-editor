# Claude AI Shorts Editor

Transforme um vídeo longo (podcast, pregação, aula, live, entrevista) em **vários cortes verticais prontos** para Reels, TikTok e Shorts, com **um comando**.

**Site do projeto:** [pedro-oscar.github.io/claude-ai-shorts-editor](https://pedro-oscar.github.io/claude-ai-shorts-editor/): como funciona, exemplos e instalação passo a passo (em português e inglês).

```bash
./ae auto "https://www.youtube.com/watch?v=XXXX"
```

Você escolhe o vídeo. O resto é automático:

| | O que acontece | Quem faz |
|---|---|---|
| 1 | Baixa o vídeo do YouTube (ou usa um arquivo seu) | o programa |
| 2 | Transcreve tudo o que foi falado, no seu computador | o programa (Whisper) |
| 3 | Escolhe os melhores trechos (gancho → desenvolvimento → conclusão) e escreve um roteiro: onde cortar, título, palavras em destaque, animações | **Claude** |
| 4 | Corta, deixa na vertical seguindo o rosto de quem fala, coloca legenda palavra por palavra e animações | o programa (video-use + Remotion) |
| 5 | Confere o resultado quadro a quadro, corrige o roteiro e refaz o que precisar | **Claude** |

No fim, a pasta `publicar/` tem os reels em MP4 e a pasta `edit/roteiros/` explica por que cada corte foi escolhido.

## O que você precisa

- Um computador com **Windows 10/11**, **macOS 13+** ou **Linux** (Ubuntu 22.04 ou mais novo).
- **Placa de vídeo NVIDIA** recomendada: deixa a transcrição muitas vezes mais rápida. Sem ela também funciona, só demora mais.
- Uns **20 GB livres** no disco.
- Uma conta **Claude Pro, Max, Team ou Enterprise**, ou uma chave de API da Anthropic. O plano gratuito não inclui o Claude Code.
- Internet.

## Passo a passo

Siga na ordem. Cada guia diz exatamente o que digitar.

1. **Prepare o computador** (só uma vez), escolhendo o seu sistema:
   - [Windows](docs/1-windows.md)
   - [macOS](docs/2-macos.md)
   - [Linux](docs/3-linux.md)
2. [Instale e conecte o Claude Code](docs/4-claude.md)
3. [Baixe e instale o projeto](docs/5-instalar-projeto.md)
4. [Como usar](docs/6-como-usar.md)
5. [Problemas comuns](docs/7-problemas.md)

Já sabe mexer com terminal? Versão curta:

```bash
git clone https://github.com/pedro-oscar/claude-ai-shorts-editor.git
cd claude-ai-shorts-editor
chmod +x instalar.sh ae skill/corte-viral/scripts/ae
./instalar.sh
./ae auto "https://www.youtube.com/watch?v=XXXX" --rapido
```

O `chmod +x` dá permissão de execução ao instalador e ao `./ae` (que é um atalho para `skill/corte-viral/scripts/ae`). Se aparecer `Permission denied` ao rodar qualquer um deles, é esse comando que resolve.

## Receitas

Sempre dentro da pasta do projeto (`cd ~/claude-ai-shorts-editor`). Coloque links **entre aspas**.

| Quero… | Comando |
|---|---|
| Cortar só um trecho de um vídeo longo do YouTube | `./ae auto "URL" --trecho 30:00 1:15:00` |
| Usar um vídeo do meu computador | `./ae auto ~/Videos/meu-podcast.mp4` (no WSL: `/mnt/c/Users/SEU_USUARIO/Videos/…`) |
| Mais ou menos reels | `./ae auto "URL" --cortes 10` |
| Ver uma prévia rápida antes | `./ae auto "URL" --rapido` e, se gostar, `./ae produzir` |
| Dar instruções ao Claude | `./ae auto "URL" --pedido "público jovem, tom leve, títulos curtos"` |
| Corrigir algo depois | `./ae revisar --pedido "o c02 começa devagar"` e depois `./ae produzir` |
| Renderizar só alguns cortes | `./ae produzir --so c01,c03` |
| Refazer tudo ignorando o cache | `./ae produzir --forcar` |
| Só baixar um trecho, sem processar | `./ae baixar "URL" 30:00 1:15:00` |
| Ajudar a transcrição com nomes próprios | `./ae transcrever bruto/video.mp4 "Fulano, Empresa, Termo"` |
| Apagar os reels gerados de um vídeo | `./ae limpar abc1` (o começo dos nomes em `publicar/`) |

## Todos os comandos

`./ae ajuda` mostra esta lista no terminal.

**`./ae auto <video.mp4 | URL> [opções]`**: faz tudo de uma vez (baixa, transcreve, o Claude escreve o roteiro, valida, produz e o Claude revisa).

| Opção | O que faz |
|---|---|
| `--cortes N` | Quantos reels produzir (padrão 6) |
| `--rapido` | Reels em meia resolução (prévia), em `publicar/rapido/` |
| `--trecho INÍCIO FIM` | (link) Baixa só esse trecho, ex. `--trecho 30:00 1:10:00` |
| `--pedido "..."` | Instrução extra para o Claude |
| `--revisoes N` | Rodadas de revisão do Claude depois de produzir (padrão 1; 0 desliga) |
| `--modelo M` | Modelo do Claude (padrão: o seu padrão), ex. `--modelo opus` |

**Etapas separadas**

| Comando | O que faz |
|---|---|
| `./ae verificar` | Confere ferramentas, GPU, skills, Claude e permissões |
| `./ae baixar URL [INÍCIO FIM]` | Baixa para `bruto/` (inteiro ou só um trecho) |
| `./ae transcrever ARQUIVO ["nomes"]` | Transcrição local + `edit/takes_packed.md` |
| `./ae roteirizar ARQUIVO [--cortes N] [--pedido "..."]` | O Claude escreve `edit/roteiros/<video>.json` |
| `./ae validar [ROTEIRO]` | Confere o roteiro e gera o resumo `.md` |
| `./ae produzir [ROTEIRO] [--rapido] [--so c01,c02] [--forcar]` | Renderiza os reels em `publicar/` |
| `./ae revisar [ROTEIRO] [--pedido "..."]` | O Claude revisa as folhas de revisão e ajusta o roteiro |

**Utilidades**

| Comando | O que faz |
|---|---|
| `./ae studio` | Remotion Studio em http://localhost:3000 |
| `./ae still CHAVE SEGUNDOS` | Imagem de um instante de um reel, em `remotion/out/` |
| `./ae cena NOME SEGUNDOS [card\|full]` | Prévia de uma cena ilustrada |
| `./ae tsc` | Checagem de tipos do Remotion |
| `./ae limpar PREFIXO` | Apaga reels e cortes gerados de um vídeo (mantém o original, a transcrição e o roteiro) |
| `./ae demo` | Reel de demonstração em `publicar/demo.mp4` |

`ROTEIRO` é opcional: o padrão é o mais recente em `edit/roteiros/`. Os logs do Claude ficam em `edit/logs/`.

## Do que o projeto é feito

- [Claude Code](https://code.claude.com): escolhe os cortes, escreve o roteiro e revisa.
- [video-use](https://github.com/browser-use/video-use): corta e trata o vídeo.
- [Remotion](https://www.remotion.dev): monta o reel (legendas, animações, enquadramento).
- [faster-whisper](https://github.com/SYSTRAN/faster-whisper): transcrição local.
- [yt-dlp](https://github.com/yt-dlp/yt-dlp): download do YouTube.
- OpenCV (YuNet): detecção de rosto.

## Avisos importantes

- **Direitos de uso:** só corte vídeos que são seus ou que você tem autorização para usar.
- **Licença do Remotion:** é gratuito para pessoas físicas e empresas pequenas. Empresas maiores precisam de uma licença: veja [remotion.pro](https://www.remotion.pro).
- **Privacidade:** o vídeo fica no seu computador. Apenas o **texto** da transcrição é enviado ao Claude para escolher os cortes.
