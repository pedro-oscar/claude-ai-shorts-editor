# Roteiro (`edit/roteiros/<video>.json`)

É o único arquivo que o Claude escreve para produzir os reels. O usuário roda `./ae produzir` e o `scripts/produzir.py` faz o resto: ajusta os cortes ao limite das palavras, corta, enquadra o rosto, monta legenda e motion e renderiza.

**Todos os tempos são em segundos do vídeo de origem**, os mesmos de `edit/takes_packed.md`. Podem ser número (`4092.3`) ou relógio (`"1:08:12.3"`). A conversão para a linha do tempo de cada corte é automática.

```json
{
  "fonte": "bruto/XXXX.mp4",
  "titulo_video": "Flow Podcast #123 — Fulano",
  "prefixo": "flow123",
  "estilo": {"accent": "#FF2D2D", "highlight": "#FFE600"},
  "correcoes": {"Cloud": "Claude", "Hicksfield": "Higgsfield"},
  "cortes": [
    {
      "id": "c01",
      "status": "produzir",
      "nota": 8.6,
      "categoria": "opiniao-forte",
      "titulo": "A CLT é dos anos 50",
      "gancho": "A CLT é uma lei fascista",
      "payoff": "Eu tô pagando mais pro Estado do que pra pessoa",
      "porque": "Opinião forte + número concreto; fecha com frase de efeito",
      "trechos": [["1:08:12.3", "1:08:41.0"], ["1:08:55.2", "1:09:20.8"]],
      "enfase": ["fascista", "18", "Estado"],
      "pin": [],
      "motions": [
        {"type": "keyword", "word": "fascista", "at": "1:08:13", "text": "Lei fascista?", "dur": 1.6},
        {"type": "zoom", "word": "fascista", "at": "1:08:13", "dur": 1.2, "scale": 1.18},
        {"type": "counter", "word": "dezoito", "at": "1:09:02", "from": 0, "to": 18000, "prefix": "R$ ", "label": "custo da empresa", "dur": 2.4},
        {"type": "scene", "name": "Comparacao", "layout": "card", "at": "1:09:05", "dur": 3.5,
         "props": {"title": "Salário de R$ 10 mil", "left": {"label": "Empresa paga", "value": "R$ 18 mil"}, "right": {"label": "Pessoa recebe", "value": "R$ 7,5 mil"}}},
        {"type": "shake", "word": "Estado", "at": "1:09:18", "dur": 1.0},
        {"type": "flash", "at": "1:08:55.2"}
      ]
    },
    {"id": "c07", "status": "reserva", "nota": 6.4, "titulo": "...", "porque": "bom, mas depende de contexto", "trechos": [["2:01:00", "2:01:50"]]}
  ]
}
```

## Campos

| campo | obrigatório | o que é |
|---|---|---|
| `fonte` | sim | vídeo em `bruto/`, relativo à raiz do projeto |
| `prefixo` | não | prefixo dos arquivos (padrão: nome do vídeo). Cada reel vira `publicar/<prefixo>-<id>.mp4` |
| `estilo` | não | padrão para todos os cortes (accent, highlight, captionY, grain, captionGroupMs, uppercase, fadeOut) |
| `correcoes` | não | conserta palavras que o Whisper errou **na legenda** (palavra inteira, sem diferenciar maiúsculas). Ex.: nomes próprios |
| `cortes[].status` | não | `produzir` (padrão) ou `reserva` (fica listado, não renderiza) |
| `cortes[].trechos` | sim | `[[ini, fim], ...]` em ordem de exibição. Podem vir fora de ordem (*cold open*). São ajustados sozinhos para não cortar palavra. **Duração total: alvo 60–90 s; abaixo de 45 s a validação avisa; acima de 90 s falha.** Prefira poucos trechos longos a muitos picotes. O **último trecho deve terminar numa frase completa que fecha a ideia**. O produzir aproveita até 1,2 s do som natural depois da última palavra; se o falante emendar outra frase antes disso, o último quadro fica congelado em silêncio até completar 1 s. O áudio só baixa depois da última palavra e a imagem escurece no fim (`fadeOut`, padrão 0,5 s). Se o corte terminar sem fim de frase, a validação avisa |
| `cortes[].titulo` | não | vira a tarja de título nos primeiros 2,8 s, se não houver um motion `title` |
| `cortes[].enfase` | não | palavras pintadas na cor `accent` na legenda |
| `cortes[].correcoes`, `estilo` | não | sobrescrevem os globais só neste corte |
| `cortes[].pin` | não | `["12-18:0.30"]`: força o centro do enquadramento (tempos **do corte**, cx 0–1). Use só depois de ver a revisão |
| `nota`, `categoria`, `gancho`, `payoff`, `porque` | recomendado | documentação; aparece no resumo `.md` |

## Motions

Cada motion tem `type` e uma âncora de tempo:
- `"at"`: tempo na fonte;
- `"word"`: começa 0,1 s antes dessa palavra ser dita. Use junto com `at` para escolher a ocorrência mais próxima. É a âncora mais precisa: prefira `word` sempre que o motion ilustra uma palavra.

Duração: `"dur"` (segundos) ou `"ate"` (tempo na fonte). Padrões: title 2,6 · keyword 1,6 · counter 2,4 · zoom 1,4 · shake 1,0 · scene 3,5.

Tipos e propriedades: `title {text}`, `keyword {text}`, `counter {from, to, prefix, suffix, decimals, label}`, `zoom {scale}`, `shake {intensity}`, `scene {name, layout: card|full, props}`, `flash {at, color}`. Regras de uso: `motion-guide.md`.

`scene.name` precisa estar registrado em `remotion/src/scenes/index.ts`. Se não houver uma cena adequada, o Claude a cria antes (ver motion-guide).

## Validar e produzir

```bash
./ae validar                 # o Claude roda antes de entregar; também gera <roteiro>.md
./ae produzir                # o usuário roda; usa o roteiro mais recente em edit/roteiros/
./ae produzir --rapido       # meia resolução → publicar/rapido/
./ae produzir --so c01,c03   # só alguns cortes
```

O cache por hash refaz só o que mudou. Mudar só motions ou legenda re-renderiza o reel sem recortar o vídeo.

Saídas por corte:
- `publicar/<prefixo>-<id>.mp4`;
- `edit/cortes/<prefixo>-<id>/revisao.png`: até 12 quadros, nos inícios dos motions e nas trocas de câmera;
- `edit/cortes/<prefixo>-<id>/verify_face/`;
- `edit/producao.json`: resumo da última produção, que o Claude lê para revisar.
