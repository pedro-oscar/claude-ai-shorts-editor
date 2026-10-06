# Guia de motion (Remotion)

O reel é 1080×1920 a 30 fps. Camadas: vídeo recortado no rosto → cenas `full` → granulado → legenda → títulos/palavras/contadores/cenas `card`/flash → saída suave (escurece e o áudio baixa no fim).

## Posicionamento: automático e nunca sobre o rosto

Você **não escolhe posição**. O Remotion (`src/motions/layout.ts`) mede onde está a cabeça de quem está em foco durante todo o tempo do motion, do cabelo ao pescoço, e coloca cada texto ou card no espaço livre: **acima da cabeça** ou **entre a cabeça e a legenda**. Se precisar, reduz o elemento até uma escala mínima. Dois motions ao mesmo tempo nunca disputam o mesmo espaço.

Consequências para o roteiro:
- **Textos curtos cabem sem encolher:**
  - `title` com até 5 palavras (≈ 28 caracteres);
  - `keyword` com 1–2 palavras (≈ 14 caracteres);
  - `counter` com rótulo de até 3 palavras.
- **Um card (`scene` `card`) precisa de espaço.** Em plano fechado (rosto grande) ou aberto com a cabeça alta no quadro, ele não cabe e **vira tela cheia sozinho**: a cena substitui a imagem por alguns segundos, como uma cena de corte. Por isso toda cena precisa funcionar nos dois layouts. Para saber o enquadramento, veja `edit/cortes/<chave>/verify_face/` ou a folha de revisão. Em plano fechado, prefira `keyword`/`counter` e reserve cenas para 1–2 momentos.
- **No máximo um texto e um card ao mesmo tempo.** Mais que isso não tem onde ficar.
- O campo `position` (keyword) é ignorado.

## motion.json

```json
{
  "style": {"accent": "#FF2D2D", "highlight": "#FFE600", "captionY": 0.66, "grain": true, "captionGroupMs": 900, "uppercase": true, "fadeOut": 0.5},
  "emphasis": ["caixa", "fascista", "trilhão"],
  "motions": [
    {"type": "title",   "start": 0.2, "end": 3.0, "text": "O erro que quebra empresas"},
    {"type": "keyword", "start": 5.0, "end": 6.6, "text": "2º ano"},
    {"type": "counter", "start": 9.1, "end": 11.5, "from": 0, "to": 104, "prefix": "R$ ", "suffix": " mi", "label": "geração de caixa"},
    {"type": "zoom",    "start": 4.2, "end": 5.6, "scale": 1.18},
    {"type": "shake",   "start": 10.6, "end": 11.9, "intensity": 1},
    {"type": "flash",   "at": 6.35},
    {"type": "scene",   "start": 6.9, "end": 10.3, "name": "Comparacao", "layout": "card", "props": {"title": "...", "left": {"label": "...", "value": "...", "emoji": "🙋"}, "right": {"label": "...", "value": "..."}}}
  ]
}
```

Tempos em segundos na linha do tempo **do corte** (a mesma de `captions.json`, que está em ms).

| tipo | quando usar |
|---|---|
| `title` | Manchete do gancho, só no início (0–3 s), até 6 palavras. Uma por corte |
| `keyword` | Conceito-chave de 1–2 palavras. Não repita o que a legenda já mostra, sintetize |
| `counter` | Sempre que a fala tiver um número que importa |
| `zoom` | Punchline e frase de efeito (1,12–1,2). Rosto continua centrado |
| `shake` | Emoção forte, susto, indignação. Máx. 1,5 s e no máx. 2 por corte |
| `flash` | Virada de assunto / antes de uma revelação |
| `scene` `card` | Explicar algo enquanto a expressão de quem fala importa |
| `scene` `full` | Conceito abstrato que pede ilustração (b-roll). 2–4 s; o áudio continua |

`emphasis`: 3–8 palavras por corte, que ficam na cor `accent` na legenda. A comparação ignora acento, caixa e pontuação.

## Regras de ritmo e sincronia

- Um elemento novo a cada **3–6 s**; nunca mais de 8 s sem nada. Mas não cubra o rosto o tempo todo: pelo menos 40% do corte com o rosto limpo.
- O início do motion fica **0,1 s antes** do `startMs` da palavra que ele ilustra. O payoff visual cai na palavra do payoff.
- A legenda (centro em `captionY`, ≈ y 1270) e as zonas da UI do app (topo 0–150 px, faixa inferior 1400–1920 px) já são respeitadas pelo layout automático.
- **Fim do reel:** não coloque motion nos últimos 0,8 s (é a saída suave). O payoff visual vem antes.
- **Contraste sempre**: texto com contorno preto ou sobre tarja sólida. Nada amarelo sobre fundo claro nem vermelho sobre vermelho. Se o fundo do vídeo for claro na região, use tarja.
- Fonte: Montserrat 800–900 (`FONT` em `theme.ts`). Não carregue fontes externas sem conferir num still.

## Cenas ilustradas (o lugar das imagens do Higgsfield)

Toda cena é um componente em `remotion/src/scenes/<Nome>.tsx` desenhado para a caixa **940×760** (`SCENE_BOX`). O `SceneFrame` posiciona como `card` ou amplia como `full`. Registre em `scenes/index.ts`: o componente em `SCENES` e props de exemplo em `EXEMPLOS`. Pré-visualize com `./ae cena <Nome> <segundos> [card|full]`, que gera um PNG em `remotion/out/`.

Antes de criar uma cena, veja as que já existem em `scenes/index.ts`: o projeto acumula cenas de vídeos anteriores, e reaproveitar é melhor que duplicar.

Para criar uma cena nova, como o exemplo do `Dinheiro.tsx`:
- Ilustração em **SVG desenhado no código**: formas simples, contorno grosso, 2–4 cores, sombra elíptica embaixo. Emojis do sistema servem para ícones rápidos.
- Animação só com `spring`/`interpolate` de `remotion` sobre `useCurrentFrame()`. Nada de CSS transition ou `Math.random()`; use seeds determinísticas.
- Entrada escalonada (cada elemento 3–6 frames depois do anterior); easing nunca linear.
- Props com padrão, para não quebrar se faltar algo no motion.json.
- Recebe `accent` e `highlight`; use as cores do estilo.
- Imagens externas só se o usuário fornecer, em `public/`, com `staticFile()`.

**Briefing para o sub-agente de cada cena nova** (um por cena, todos em paralelo):

> Objetivo em 1 frase · caminho absoluto do arquivo · props e exemplo de valores · duração em segundos · paleta (accent/highlight hex) · roteiro quadro a quadro (o que entra quando) · "desenhe para 940×760, siga o padrão de src/scenes/Dinheiro.tsx, escreva só o arquivo da cena e devolva as props de exemplo" (quem registra em `index.ts`, roda `./ae tsc` e confere com `./ae cena` é o agente principal; sub-agentes podem não ter acesso a comandos) · "não faça perguntas, escolha a interpretação óbvia".

## Referências visuais do usuário

Quando o usuário mandar prints (Pinterest, outros reels), extraia:
- cores → `style.accent`/`style.highlight`;
- posição da legenda → `captionY`;
- caixa alta ou não → `uppercase`;
- densidade de palavras → `captionGroupMs` (menor = menos palavras por página);
- tipo de ilustração (flat, 3D, colagem, recorte de papel, neon).

Registre a decisão em `aprendizados.md` na seção Estilo. Se pedirem algo que o template não faz (outra fonte, legenda com fundo em caixa, emoji na legenda), altere o template do projeto e anote.
