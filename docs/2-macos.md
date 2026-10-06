# 2. Preparar o macOS

**Requisitos:** macOS 13 (Ventura) ou mais novo, Mac com chip Apple (M1, M2…) ou Intel.

> **Sobre velocidade:** Macs não têm placa NVIDIA, então a transcrição roda no processador. Funciona, mas é bem mais lenta que num PC com NVIDIA. Para vídeos longos, use a opção `--trecho` (veja [Como usar](6-como-usar.md)) para processar só a parte que interessa.

---

## Passo 1: abra o Terminal

Aperte `⌘ + Espaço`, digite **Terminal** e aperte Enter. Todos os comandos deste guia são digitados nessa janela.

## Passo 2: instale o Homebrew

O Homebrew é o "instalador de programas" do terminal no Mac. Cole:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

- Ele pede a **senha do seu Mac**. Ao digitar, nada aparece na tela; é normal.
- No final, o Homebrew mostra uma seção **"Next steps"** com 2 ou 3 comandos (começando com `echo` e `eval`). **Copie e rode esses comandos**: eles fazem o terminal encontrar o Homebrew.
- Feche o Terminal e abra de novo.

Confira:

```bash
brew --version
```

## Passo 3: instale os programas

```bash
brew install git python@3.12 node ffmpeg bash
```

Isso instala:
- **git:** baixa o projeto;
- **python e node:** linguagens que o projeto usa;
- **ffmpeg:** corta e converte vídeo;
- **bash:** uma versão nova do terminal. O macOS vem com uma de 2007, e os scripts do projeto precisam da nova.

Feche o Terminal, abra de novo e confira:

```bash
bash --version
node -v
python3 --version
ffmpeg -version | head -1
```

- `bash` deve mostrar versão **5** ou maior;
- `node`, **v18** ou maior;
- `python3`, **3.10** ou maior.

> Se `bash --version` ainda mostrar 3.2, rode `brew doctor` e confira se você executou os comandos do "Next steps" do Passo 2.

Depois: ➡️ [4. Instale e conecte o Claude Code](4-claude.md)
