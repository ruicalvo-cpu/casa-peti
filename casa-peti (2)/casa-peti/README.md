# Casa Peti — como publicar a app

Este ficheiro tem os passos para colocares a app online, com um link real que
qualquer familiar pode abrir no telemóvel e instalar. Vamos usar o **GitHub
Pages**, que é gratuito.

## O que já está feito

- ✅ Home page com o resumo do dia e o tempo (Casa em Venade + Praia de Moledo)
- ✅ Navegação para as 6 secções (as outras 5 aparecem como "ainda por construir" — vamos construí-las juntos nas próximas conversas)
- ✅ Configuração para poderes instalar a app no telemóvel (ícone, nome, ecrã cheio)

## Passo 1 — Criar um repositório no GitHub

1. Entra em [github.com](https://github.com) com a tua conta.
2. Clica no botão verde **"New"** (ou o `+` no canto superior direito → "New repository").
3. Nome do repositório: `casa-peti`
4. Deixa como **Public**.
5. Não marques nenhuma opção extra (README, .gitignore, etc.) — já temos os ficheiros.
6. Clica **"Create repository"**.

## Passo 2 — Enviar os ficheiros

1. Descomprime (unzip) o ficheiro `casa-peti.zip` que te enviei, num sítio do teu computador.
2. Na página do repositório que acabaste de criar, clica em **"uploading an existing file"** (ou "Add file" → "Upload files").
3. Arrasta **a pasta `casa-peti` toda** (com as subpastas `css`, `js`, `icons` lá dentro) para a zona de upload.
   - O GitHub deve manter a estrutura de pastas automaticamente.
   - Se só te deixar arrastar ficheiros individuais e não pastas, arrasta primeiro os ficheiros da raiz (`index.html`, `manifest.json`, `service-worker.js`) e depois, dentro do repositório já criado, usa "Add file → Create new file" e escreve `css/style.css` no nome (o GitHub cria a pasta automaticamente) colando o conteúdo — diz-me se precisares que faça isto contigo com mais detalhe.
4. Em baixo, escreve uma mensagem tipo "primeira versão" e clica **"Commit changes"**.

## Passo 3 — Ativar o GitHub Pages

1. No repositório, vai a **Settings** (menu de topo).
2. No menu lateral esquerdo, clica em **Pages**.
3. Em "Branch", escolhe **main** e a pasta **/ (root)**, depois **Save**.
4. Espera 1–2 minutos. Vai aparecer um link tipo:
   `https://o-teu-utilizador.github.io/casa-peti/`

## Passo 4 — Instalar no telemóvel

1. Abre esse link no telemóvel (Safari no iPhone, Chrome no Android).
2. **iPhone:** toca no ícone de partilha (quadrado com seta) → "Adicionar ao ecrã principal".
3. **Android:** toca no menu (⋮) → "Adicionar ao ecrã principal" ou vai aparecer um aviso automático a sugerir instalar.
4. Vai aparecer o ícone da Casa Peti no ecrã principal, como uma app normal.

## Próximos passos

Volta à conversa comigo e diz que já publicaste — vamos:
1. Configurar a base de dados partilhada (Firebase), para que a lista de compras,
   agenda, etc. fiquem sincronizadas entre todos.
2. Construir a secção da Lista de Compras (a mais simples, ótima para testar a
   base de dados).
3. Continuar pelas restantes secções.

Sempre que eu te enviar ficheiros atualizados, repetes o Passo 2 (upload) —
o GitHub Pages atualiza sozinho em 1–2 minutos.
