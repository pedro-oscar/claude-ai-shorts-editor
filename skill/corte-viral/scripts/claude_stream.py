"""Mostra o progresso de `claude -p --output-format stream-json --verbose` de forma legível
e guarda o log completo. Lê o stream do stdin.

Uso: claude -p ... --output-format stream-json --verbose | python claude_stream.py LOG.jsonl RESULTADO.txt
Sai com código 1 se o Claude terminar com erro.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

CINZA, VERDE, VERM, NEG, FIM = "\033[90m", "\033[32m", "\033[31m", "\033[1m", "\033[0m"


def resumo_ferramenta(nome: str, inp: dict) -> str:
    for chave in ("file_path", "path", "pattern", "command", "skill", "description", "prompt"):
        if chave in inp and inp[chave]:
            v = str(inp[chave]).replace("\n", " ")
            return v if len(v) <= 110 else v[:107] + "…"
    return ""


def main() -> None:
    log = Path(sys.argv[1])
    saida = Path(sys.argv[2])
    log.parent.mkdir(parents=True, exist_ok=True)
    resultado, erro = "", False
    turnos, ms, custo = 0, 0, None
    with log.open("w", encoding="utf-8") as f:
        for linha in sys.stdin:
            f.write(linha)
            f.flush()
            try:
                ev = json.loads(linha)
            except json.JSONDecodeError:
                continue
            tipo = ev.get("type")
            if tipo == "assistant":
                for item in ev.get("message", {}).get("content", []):
                    if item.get("type") == "tool_use":
                        nome = item.get("name", "?")
                        print(f"  {CINZA}→ {nome}{FIM} {resumo_ferramenta(nome, item.get('input') or {})}", flush=True)
                    elif item.get("type") == "text" and item.get("text", "").strip():
                        t = item["text"].strip().splitlines()[0]
                        print(f"  {CINZA}· {t[:140]}{FIM}", flush=True)
            elif tipo == "result":
                # A sessão principal pode "terminar" várias vezes: ela acorda de novo quando um
                # sub-agente em segundo plano conclui. Vale o último resultado.
                if resultado:
                    print(f"  {CINZA}· retomando (sub-agente concluiu){FIM}", flush=True)
                resultado = ev.get("result") or ""
                erro = bool(ev.get("is_error")) or ev.get("subtype") not in (None, "success")
                turnos += ev.get("num_turns") or 0
                ms += ev.get("duration_ms") or 0
                custo = ev.get("total_cost_usd") or custo
    info = f"{turnos} turnos, {ms / 60000:.1f} min" + (f", US$ {custo:.2f}" if custo else "")
    print(f"\n{VERM if erro else VERDE}{NEG}Claude terminou{FIM} ({info})", flush=True)
    saida.write_text(resultado, encoding="utf-8")
    if resultado:
        print(resultado)
    sys.exit(1 if erro or not resultado else 0)


if __name__ == "__main__":
    main()
