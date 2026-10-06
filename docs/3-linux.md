# 3. Preparar o Linux

Também vale para o **Ubuntu dentro do WSL** no Windows: siga a seção Ubuntu / Debian e **pule a parte do driver NVIDIA**.

Os comandos com `sudo` pedem a sua senha. Ao digitar, nada aparece na tela; é normal.

---

## Ubuntu / Debian

Ubuntu 22.04 ou mais novo, Debian 12 ou mais novo.

### 1. Programas básicos

```bash
sudo apt update
sudo apt install -y git curl ca-certificates ffmpeg python3 python3-venv
```

### 2. Bibliotecas que o Remotion usa para desenhar os vídeos

```bash
sudo apt install -y libnss3 libdbus-1-3 libatk1.0-0 libatk-bridge2.0-0 libgbm1 libxrandr2 libxkbcommon0 libxfixes3 libxcomposite1 libxdamage1 libpango-1.0-0 libcairo2 libcups2 fonts-noto-color-emoji
sudo apt install -y libasound2 || sudo apt install -y libasound2t64
```

> A última linha tenta os dois nomes do mesmo pacote: o Ubuntu 24.04 mudou o nome.

### 3. Node.js 22

A versão do Node que vem no Ubuntu costuma ser antiga. Instale a oficial:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

### 4. Confira

```bash
git --version
node -v
python3 --version
ffmpeg -version | head -1
```

Precisa de `node` **v18** ou maior e `python3` **3.10** ou maior.

### 5. Driver NVIDIA (só Linux instalado direto no computador, **não** no WSL)

Se você tem placa NVIDIA:

```bash
sudo ubuntu-drivers install
sudo reboot
```

Depois de reiniciar, `nvidia-smi` deve mostrar a sua placa. Não precisa instalar o "CUDA Toolkit": o projeto baixa o que precisa sozinho.

---

## Fedora

```bash
sudo dnf install -y git curl python3 nodejs ffmpeg-free nss atk at-spi2-atk libdrm libxkbcommon libXcomposite libXdamage libXrandr mesa-libgbm pango cairo alsa-lib cups-libs google-noto-emoji-color-fonts
```

> O `ffmpeg-free` do Fedora não tem alguns codecs. Se der erro ao cortar vídeos, instale o `ffmpeg` completo pelo [RPM Fusion](https://rpmfusion.org/Configuration).

## Arch / Manjaro

```bash
sudo pacman -S --needed git curl python nodejs npm ffmpeg nss atk at-spi2-atk libxkbcommon libxcomposite libxdamage libxrandr mesa pango cairo alsa-lib libcups noto-fonts-emoji
```

---

Depois: ➡️ [4. Instale e conecte o Claude Code](4-claude.md)
