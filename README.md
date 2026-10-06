# Claude AI Shorts Editor

Transforme um vídeo longo (podcast, pregação, aula, live, entrevista) em **vários cortes verticais prontos** para Reels, TikTok e Shorts, com **um comando**.

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
./instalar.sh
./ae auto "https://www.youtube.com/watch?v=XXXX" --rapido
```

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
