# 1. Preparar o Windows

No Windows, o projeto roda dentro do **WSL**, um "Linux dentro do Windows" oficial da Microsoft. Você vai instalar o Ubuntu nele e, a partir daí, seguir os mesmos passos do Linux.

> O Windows "puro" (sem WSL) não é suportado.

**Requisitos:** Windows 10 versão 22H2 ou Windows 11, com a virtualização ligada (vem ligada na maioria dos computadores).

---

## Passo 1: atualize o driver da placa de vídeo (só se tiver NVIDIA)

1. Baixe e instale o driver mais recente em [nvidia.com/drivers](https://www.nvidia.com/pt-br/drivers/), ou pelo aplicativo NVIDIA App / GeForce Experience.
2. Reinicie o computador.

> Instale o driver **só no Windows**. Dentro do Ubuntu (WSL) não se instala driver de vídeo: ele usa o do Windows automaticamente.

## Passo 2: instale o WSL com Ubuntu

1. Clique no menu Iniciar, digite **PowerShell**, clique com o botão direito e escolha **Executar como administrador**.
2. Cole este comando e aperte Enter:

   ```powershell
   wsl --install -d Ubuntu-22.04
   ```

3. Quando terminar, **reinicie o computador**.
4. Depois de reiniciar, abra o menu Iniciar e procure **Ubuntu**. Na primeira vez ele pede:
   - **um nome de usuário:** letras minúsculas, sem espaço, por exemplo `maria`;
   - **uma senha:** ao digitar, nada aparece na tela; é normal. **Anote essa senha**, ela será pedida nos próximos passos.

Pronto: essa janela preta é o **terminal do Ubuntu**. Todos os comandos dos próximos guias são digitados nela.

## Passo 3: atualize o Ubuntu

No terminal do Ubuntu:

```bash
sudo apt update && sudo apt upgrade -y
```

Ele pede a senha que você criou.

## Passo 4: confira a placa de vídeo (se tiver NVIDIA)

```bash
nvidia-smi
```

Deve aparecer uma tabela com o nome da sua placa. Se aparecer "command not found", volte ao Passo 1, atualize o driver e reinicie.

## Passo 5: instale os programas

Siga a seção **"Ubuntu / Debian"** do guia do Linux, digitando os comandos **no terminal do Ubuntu**:

➡️ [3-linux.md, Ubuntu / Debian](3-linux.md#ubuntu--debian)

(A parte de driver NVIDIA daquele guia **não** se aplica ao WSL: pule.)

Depois: ➡️ [4. Instale e conecte o Claude Code](4-claude.md)

---

## Dicas para quem vem do Windows

| Quero… | Faça |
|---|---|
| Colar no terminal | Botão direito do mouse, ou `Ctrl+Shift+V` |
| Copiar do terminal | Selecione com o mouse e aperte `Ctrl+Shift+C` |
| Abrir a pasta atual no Explorer | `explorer.exe .` |
| Achar meus arquivos do Windows no Ubuntu | Ficam em `/mnt/c/Users/SEU_USUARIO/` (ex.: `/mnt/c/Users/maria/Videos`) |
| Achar os arquivos do Ubuntu no Windows | No Explorer, clique em **Linux → Ubuntu-22.04 → home → seu usuário** |

> **Importante:** deixe o projeto **dentro do Ubuntu** (na pasta pessoal, `~`), não em `/mnt/c/...`. Pelo `/mnt/c` tudo fica muito mais lento.
