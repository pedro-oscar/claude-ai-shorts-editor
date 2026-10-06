# 7. Problemas comuns

Primeiro passo sempre:

```bash
cd ~/claude-ai-shorts-editor
./ae verificar
```

Cada linha com ✗ diz o que corrigir.

---

## Instalação

### `claude: command not found`

O instalador do Claude coloca o programa em `~/.local/bin`, e o terminal ainda não sabe disso. Feche e abra o terminal. Se continuar:

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

No macOS, troque `~/.bashrc` por `~/.zshrc`.

### `Permission denied` ao rodar `./instalar.sh` ou `./ae`

```bash
chmod +x instalar.sh ae skill/corte-viral/scripts/ae
```

### macOS: `O ./ae precisa do bash 4 ou mais novo`

```bash
brew install bash
```

Depois feche e abra o Terminal. Confira com `bash --version`, que deve mostrar a versão 5.

### `ENETUNREACH` ou erro ao baixar o "Headless Shell" / Chrome

É comum no WSL, que não tem IPv6. O instalador já contorna; se acontecer ao renderizar:

```bash
cd remotion && NODE_OPTIONS=--dns-result-order=ipv4first npx remotion browser ensure && cd ..
```

### Render falha com `error while loading shared libraries` (Linux)

Faltam bibliotecas do sistema. Rode o comando do passo 2 de [3-linux.md](3-linux.md#2-bibliotecas-que-o-remotion-usa-para-desenhar-os-vídeos).

---

## Uso

### `claude -p não respondeu` / o roteiro não é gerado

O Claude não está logado. Rode `claude`, faça login e saia com `/exit`. Teste com:

```bash
claude -p "Responda só: OK"
```

Em máquina sem navegador, use o token. Veja [4-claude.md, alternativas](4-claude.md#alternativas-de-login-opcional).

### `HTTP Error 429` no YouTube

O YouTube bloqueou temporariamente. Espere alguns minutos e tente de novo. Se continuar, baixe o vídeo de outra forma e use `./ae auto arquivo.mp4`.

### O vídeo baixado veio só com áudio

Use sempre `./ae auto` ou `./ae baixar`, que já pedem o formato certo. Se persistir, atualize o yt-dlp:

```bash
uv tool upgrade yt-dlp
```

### A transcrição está muito lenta

- `./ae verificar` mostra se a GPU NVIDIA foi encontrada.
- Sem NVIDIA (Mac, por exemplo), use `--trecho` para processar só uma parte do vídeo.

### O rosto aparece cortado num reel

```bash
./ae revisar --pedido "no c02 o rosto está cortado perto dos 15 segundos"
./ae produzir
```

O Claude ajusta o enquadramento desse trecho.

### A legenda escreveu um nome errado

```bash
./ae revisar --pedido "o nome certo é Fulano, não Fulana"
./ae produzir
```

### Muitas animações em tela cheia escondendo o rosto

Acontece quando o vídeo tem o rosto muito grande ou muito alto no quadro: não há espaço para os cartões, e eles viram tela cheia.

```bash
./ae revisar --pedido "use menos ilustrações e mais palavras-chave"
./ae produzir
```

### `Permission denied` ou `EACCES` em arquivos do projeto (WSL)

Se você editou arquivos do projeto pelo Explorer do Windows, eles podem ter ficado com outro dono:

```bash
sudo chown -R $(whoami): ~/claude-ai-shorts-editor
```

### Quero começar um vídeo do zero

```bash
./ae limpar <prefixo>
```

O prefixo é o começo dos nomes em `publicar/`, por exemplo `abc1`. Para refazer também o roteiro, apague `edit/roteiros/<video>.json`.

---

Não achou o seu problema? Abra uma [issue no GitHub](https://github.com/pedro-oscar/claude-ai-shorts-editor/issues) com:
- a saída do `./ae verificar`;
- o erro que apareceu;
- se for erro do Claude, o arquivo mais recente de `edit/logs/`.
