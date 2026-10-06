# 5. Baixar e instalar o projeto

Tudo no terminal (no Windows, no terminal do Ubuntu).

## Passo 1: baixe o projeto

```bash
cd ~
git clone https://github.com/pedro-oscar/claude-ai-shorts-editor.git
cd claude-ai-shorts-editor
```

Isso cria a pasta `claude-ai-shorts-editor` na sua pasta pessoal e entra nela.

> **Daqui em diante, sempre que for usar o projeto, abra o terminal e entre na pasta:**
>
> ```bash
> cd ~/claude-ai-shorts-editor
> ```

## Passo 2: dê permissão de execução aos scripts

```bash
chmod +x instalar.sh ae skill/corte-viral/scripts/ae
```

Isso deixa rodar o instalador e o `./ae`, o atalho que você vai usar para tudo (ele aponta para `skill/corte-viral/scripts/ae`). Não aparece nenhuma mensagem: é normal. Se algum dia aparecer `Permission denied` ao rodar `./ae` ou `./instalar.sh`, rode este comando de novo.

## Passo 3: rode o instalador

```bash
./instalar.sh
```

Ele leva de **5 a 15 minutos** (depende da internet) e faz tudo sozinho:

1. confere se os programas do guia do seu sistema estão instalados (se faltar algo, ele avisa o quê);
2. instala o `uv`, que gerencia o Python;
3. liga a skill **corte-viral** (as instruções do Claude) em `~/.claude/skills/`;
4. baixa a skill **video-use**, que corta os vídeos;
5. instala o Whisper (transcrição) e o OpenCV (detecção de rosto), e as bibliotecas da GPU se você tiver NVIDIA;
6. instala o `yt-dlp` (download do YouTube);
7. cria a pasta `remotion/` e baixa o Remotion e o navegador que ele usa para desenhar os vídeos;
8. no fim, roda a verificação.

O resultado esperado é **Tudo pronto.**:

```
== Ferramentas
  ✓ ffmpeg …
  ✓ claude …
== GPU
  ✓ GPU 0: NVIDIA …      (ou "! sem GPU NVIDIA", que também funciona)
…
Tudo pronto.
```

Se aparecer algum **✗**, a própria linha diz como resolver. Veja também [Problemas comuns](7-problemas.md).

> Na **primeira transcrição** o programa baixa o modelo do Whisper (cerca de 3 GB). Isso acontece uma vez só.

## Passo 4: teste com o vídeo de demonstração

```bash
./ae demo
```

Gera `publicar/demo.mp4`, um reel de exemplo com todos os tipos de animação (sem vídeo de fundo). Para abrir a pasta:

- **Windows (WSL):** `explorer.exe publicar`
- **macOS:** `open publicar`
- **Linux:** `xdg-open publicar`

Se o vídeo abriu, a instalação está completa. 🎉

➡️ Próximo: [6. Como usar](6-como-usar.md)

---

## Atualizar para a versão mais nova

```bash
cd ~/claude-ai-shorts-editor
git pull
./instalar.sh
```

## Desinstalar

```bash
rm -rf ~/claude-ai-shorts-editor ~/.claude/skills/corte-viral ~/.claude/skills/video-use
```

> ⚠️ Isso apaga também os vídeos e reels que estiverem nas pastas do projeto. Copie antes o que quiser guardar.
