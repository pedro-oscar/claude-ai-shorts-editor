#!/usr/bin/env bash
# Instala tudo o que o projeto precisa (Linux, WSL ou macOS). Pode rodar de novo quantas vezes quiser.
# Uso: ./instalar.sh
set -euo pipefail

if [ "${BASH_VERSINFO[0]}" -lt 4 ]; then
  echo "Este script precisa do bash 4 ou mais novo (o seu é $BASH_VERSION)."
  echo "No macOS: brew install bash   e abra um terminal novo."
  exit 1
fi

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_SRC="$REPO/skill/corte-viral"
SKILLS="$HOME/.claude/skills"
VU="$SKILLS/video-use"
# ~/.local/bin: uv, yt-dlp, claude · /usr/lib/wsl/lib: nvidia-smi no WSL
export PATH="$HOME/.local/bin:$PATH:/usr/lib/wsl/lib"
cd "$REPO"

ok()   { printf '  \033[32m✓\033[0m %s\n' "$*"; }
aviso(){ printf '  \033[33m!\033[0m %s\n' "$*"; }
erro() { printf '  \033[31m✗\033[0m %s\n' "$*"; }
step() { printf '\n\033[1;36m== %s\033[0m\n' "$*"; }
falha(){ printf '\n\033[31mInstalação interrompida:\033[0m %s\n' "$*"; exit 1; }

versao_ok() { # versao_ok "3.10.12" 3 10
  local v="$1" maj="$2" min="$3"
  local a b; a=$(echo "$v" | cut -d. -f1); b=$(echo "$v" | cut -d. -f2)
  [ "$a" -gt "$maj" ] || { [ "$a" -eq "$maj" ] && [ "$b" -ge "$min" ]; }
}

# ---------------------------------------------------------------------------------------
step "1/7 Conferindo os programas básicos"
FALTANDO=0
for c in git curl ffmpeg ffprobe python3 node npm; do
  if command -v "$c" >/dev/null; then ok "$c"; else erro "$c não encontrado"; FALTANDO=1; fi
done
if command -v python3 >/dev/null; then
  pv=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
  versao_ok "$pv" 3 10 && ok "python $pv" || { erro "python $pv — precisa 3.10 ou mais novo"; FALTANDO=1; }
fi
if command -v node >/dev/null; then
  nv=$(node -v | tr -d v)
  versao_ok "$nv" 18 0 && ok "node $nv" || { erro "node $nv — precisa 18 ou mais novo"; FALTANDO=1; }
fi
[ "$FALTANDO" -eq 0 ] || falha "instale o que está faltando seguindo o guia do seu sistema em docs/ e rode ./instalar.sh de novo."

if ! command -v uv >/dev/null; then
  step "Instalando o uv (gerenciador de Python)"
  curl -LsSf https://astral.sh/uv/install.sh | sh
  export PATH="$HOME/.local/bin:$PATH"
fi
command -v uv >/dev/null && ok "uv $(uv --version | cut -d' ' -f2)" || falha "não consegui instalar o uv"

if command -v claude >/dev/null; then
  ok "claude $(claude --version 2>/dev/null | cut -d' ' -f1)"
else
  aviso "Claude Code não encontrado. Instale depois seguindo docs/4-claude.md (o resto da instalação continua)."
fi

# ---------------------------------------------------------------------------------------
step "2/7 Skill corte-viral → $SKILLS/corte-viral"
mkdir -p "$SKILLS"
if [ -e "$SKILLS/corte-viral" ] && [ ! -L "$SKILLS/corte-viral" ]; then
  bak="$SKILLS/corte-viral.bak-$(date +%Y%m%d-%H%M%S)"
  mv "$SKILLS/corte-viral" "$bak"
  aviso "já existia uma skill corte-viral; guardei uma cópia em $bak"
fi
ln -sfn "$SKILL_SRC" "$SKILLS/corte-viral"
ok "skill ligada a $SKILL_SRC (um 'git pull' no projeto atualiza a skill)"

# ---------------------------------------------------------------------------------------
step "3/7 Skill video-use (corta e renderiza os trechos)"
if [ -d "$VU/.git" ]; then
  git -C "$VU" pull --ff-only --quiet || aviso "não consegui atualizar o video-use (seguindo com a versão atual)"
  ok "video-use já instalado"
else
  git clone --quiet --depth 1 https://github.com/browser-use/video-use "$VU"
  ok "video-use baixado"
fi
(cd "$VU" && uv sync --quiet)
[ -f "$VU/.env" ] || cp "$VU/.env.example" "$VU/.env"
ok "dependências do video-use"

# ---------------------------------------------------------------------------------------
step "4/7 Python da corte-viral (Whisper, OpenCV)"
uv venv --quiet --allow-existing --python 3.12 "$SKILL_SRC/.venv"
uv pip install --quiet --python "$SKILL_SRC/.venv/bin/python" -r "$SKILL_SRC/scripts/requirements.txt"
# mesma checagem que o Whisper usa: se ele enxerga a GPU, precisa das bibliotecas CUDA
gpus=$("$SKILL_SRC/.venv/bin/python" -c 'import ctranslate2; print(ctranslate2.get_cuda_device_count())' 2>/dev/null || echo 0)
if [ "$(uname)" = "Linux" ] && [ "${gpus:-0}" -gt 0 ]; then
  uv pip install --quiet --python "$SKILL_SRC/.venv/bin/python" -r "$SKILL_SRC/scripts/requirements-gpu.txt"
  nome=$(nvidia-smi -L 2>/dev/null | head -1 | cut -d'(' -f1 || true)
  ok "GPU NVIDIA encontrada${nome:+: $nome}"
else
  aviso "sem GPU NVIDIA: a transcrição vai rodar no processador (funciona, só é mais lenta)"
fi
ok "ambiente Python pronto"

# ---------------------------------------------------------------------------------------
step "5/7 yt-dlp (baixa vídeos do YouTube)"
uv tool install --quiet --force "yt-dlp[default,curl-cffi]"
ok "yt-dlp $(yt-dlp --version)"

# ---------------------------------------------------------------------------------------
step "6/7 Remotion (monta os reels)"
if [ ! -d remotion ]; then
  cp -r "$SKILL_SRC/template" remotion
  ok "projeto Remotion criado em remotion/"
fi
(cd remotion && npm install --no-audit --no-fund --loglevel=error)
# alguns ambientes (WSL) não têm rota IPv6; forçar IPv4 evita falha no download do navegador
(cd remotion && NODE_OPTIONS=--dns-result-order=ipv4first npx remotion browser ensure >/dev/null)
ok "Remotion e navegador de renderização instalados"
if [ "$(uname)" = "Linux" ]; then
  if ! ldd remotion/node_modules/.remotion/chrome-headless-shell/*/chrome-headless-shell-*/chrome-headless-shell 2>/dev/null | grep -q "not found"; then
    ok "bibliotecas do navegador presentes"
  else
    aviso "faltam bibliotecas do sistema para o navegador. Rode o comando 'sudo apt install ...' do docs/3-linux.md"
  fi
fi

# ---------------------------------------------------------------------------------------
step "7/7 Toques finais"
chmod +x ae instalar.sh "$SKILL_SRC/scripts/ae"
[ -f .env ] || cp .env.exemplo .env
ok "permissões e .env"
if command -v claude >/dev/null; then
  if npx -y -p node@22 -p skills -- skills add remotion-dev/skills -a claude-code -s "*" -y >/dev/null 2>&1; then
    ok "skills oficiais do Remotion para o Claude"
  else
    aviso "não instalei as skills oficiais do Remotion (opcional, o projeto funciona sem)"
  fi
fi

printf '\n\033[1mConferindo tudo…\033[0m\n'
./ae verificar || true
printf '\nPróximo passo: %s\n' "./ae demo   (gera um reel de demonstração em publicar/demo.mp4)"
