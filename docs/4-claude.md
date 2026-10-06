# 4. Instalar e conectar o Claude Code

O **Claude Code** é o programa que deixa o Claude trabalhar no seu computador. Aqui ele lê a transcrição, escolhe os cortes, escreve o roteiro e revisa os vídeos.

## Qual conta eu preciso?

Uma destas:
- **Claude Pro ou Max** (assinatura mensal em [claude.ai](https://claude.ai)). O uso entra na cota do seu plano.
- **Team ou Enterprise** (empresas).
- **Chave de API** do [console da Anthropic](https://console.anthropic.com): você paga pelo uso, à parte de qualquer assinatura.

O plano **gratuito** do claude.ai **não** inclui o Claude Code.

> **Quanto consome?** Cada vídeo usa duas sessões do Claude: uma para escrever o roteiro e outra para revisar. Num teste com 10 minutos de vídeo e 2 cortes, o consumo equivaleu a uns US$ 4,60 em preço de API. Vídeos mais longos e com mais cortes consomem mais. Com assinatura Pro/Max, isso conta no limite do plano e não é cobrado à parte.

---

## Passo 1: instale

No terminal (no Windows, **no terminal do Ubuntu**):

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

No Mac também dá para usar o Homebrew: `brew install --cask claude-code`.

**Feche o terminal e abra de novo**, e confira:

```bash
claude --version
```

Deve aparecer algo como `2.1.xxx (Claude Code)`. Se aparecer "command not found", veja [Problemas comuns](7-problemas.md#claude-command-not-found).

## Passo 2: faça login

```bash
claude
```

- Na primeira vez, ele mostra um link e abre o navegador. **Entre com a sua conta Claude** e autorize.
- No WSL o navegador que abre é o do Windows. Se não abrir, copie o link mostrado no terminal e cole no navegador.
- Quando aparecer a tela do Claude pronta para conversar, digite `/exit` e aperte Enter para sair.

## Passo 3: teste o modo automático

O projeto usa o Claude "sem conversa" (modo `-p`). Teste:

```bash
claude -p "Responda só: OK"
```

Se aparecer **OK**, está tudo certo. ✅

➡️ Próximo: [5. Baixe e instale o projeto](5-instalar-projeto.md)

---

## Alternativas de login (opcional)

Só use se o login normal não for possível, por exemplo num servidor sem navegador. Os dois valores abaixo vão no arquivo `.env` **do projeto**, que é criado no próximo guia.

- **Token da assinatura:** gere com

  ```bash
  claude setup-token
  ```

  e cole o resultado no `.env`, na linha `CLAUDE_CODE_OAUTH_TOKEN=...` (sem o `#` na frente).
- **Chave de API:** crie em [console.anthropic.com](https://console.anthropic.com) e coloque no `.env`, na linha `ANTHROPIC_API_KEY=...`.

> 🔒 Token e chave são **senhas**: não mande para ninguém, não publique e não coloque no git. O `.env` já é ignorado pelo git.
