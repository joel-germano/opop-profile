# Email transacional — recuperação de senha (Resend)

## Visão geral

O único email que o projeto envia hoje é o link de redefinição de senha, no
fluxo `/esqueci-senha` → `/redefinir-senha`. Usa o **Resend** como provedor
(API HTTP simples, sem SMTP) e o subdomínio **`mail.opop.bio`**, verificado
no DNS do domínio raiz (`opop.bio`, gerenciado no **Cloudflare**).

## Peças

| Arquivo | Papel |
|---|---|
| [`src/lib/email.ts`](../src/lib/email.ts) | Cliente Resend + template HTML inline do email de reset |
| [`src/lib/password-reset.ts`](../src/lib/password-reset.ts) | Gera o token (32 bytes aleatórios) e seu hash SHA-256 |
| [`src/lib/models/user.ts`](../src/lib/models/user.ts) | Campos `resetPasswordTokenHash` / `resetPasswordExpires` no `User` |
| [`src/app/(auth)/esqueci-senha/`](../src/app/(auth)/esqueci-senha/) | Tela que pede o email + Server Action que gera o token e dispara o envio |
| [`src/app/(auth)/redefinir-senha/`](../src/app/(auth)/redefinir-senha/) | Tela que lê `?token=` da URL + Server Action que valida e troca a senha |

## Por que `mail.opop.bio` e não `opop.bio` direto

O domínio raiz `opop.bio` já tem email "de verdade" no **Zoho** (MX +
SPF/DKIM próprios). Só existe um registro SPF válido por domínio, então
verificar o Resend ali em cima exigiria mesclar o SPF do Zoho com o do
Resend — arriscado e desnecessário. Em vez disso, o Resend foi verificado
num **subdomínio dedicado** (`mail.opop.bio`), isolado do Zoho:

- Zoho continua cuidando 100% do email "de verdade" do domínio raiz.
- Resend cuida só do envio transacional, sem tocar no SPF do Zoho.
- Reputação de envio separada: um problema de deliverability no
  transacional não arranha o domínio principal.

Verificação feita no [dashboard do Resend](https://resend.com/domains) →
Add Domain → `mail.opop.bio` → os registros TXT/CNAME que ele pediu foram
colados no DNS do Cloudflare (zona `opop.bio`, como "DNS only", nuvem
cinza — não proxied). Status: **Verified**.

> Não existe (nem precisa existir) uma caixa de email de verdade em
> `no-reply@mail.opop.bio`. É só o endereço no campo `From:` — o Resend tem
> permissão de enviar com qualquer endereço `@mail.opop.bio` uma vez que o
> domínio está verificado. Ninguém recebe respostas endereçadas a ele (não
> tem problema, é `no-reply`).

## Variáveis de ambiente (`.env`)

| Variável | Pra quê |
|---|---|
| `RESEND_API_KEY` | Chave de API do Resend (dashboard → API Keys) |
| `RESEND_FROM_EMAIL` | Remetente completo, ex: `"Opop Profile <no-reply@mail.opop.bio>"` — o domínio da parte depois do `@` precisa estar verificado no Resend |
| `NEXT_PUBLIC_SITE_URL` | Usada pra montar a URL absoluta do link de reset (`${SITE_URL}/redefinir-senha?token=...`) — ver gotcha de deploy abaixo |

## Fluxo

1. Usuário pede reset em `/esqueci-senha` com o email →
   `requestPasswordResetAction`.
2. Busca o `User` por email. Três casos:
   - **Não existe conta**: responde sucesso genérico mesmo assim (ver
     "Proteção contra enumeração" abaixo).
   - **Conta existe mas é só-Google** (`passwordHash` vazio — criada via
     Sign in with Google): responde com erro explícito, "Essa conta usa
     login com Google. Entre pelo botão do Google." — não tem senha nenhuma
     pra redefinir, então não faz sentido fingir que enviou algo.
   - **Conta existe e tem senha**: gera token (`createResetToken`), salva só
     o **hash SHA-256** dele em `resetPasswordTokenHash` com validade de
     1h (`resetPasswordExpires`), e chama `sendPasswordResetEmail` com o
     token **puro** embutido na URL do email.
3. Usuário abre o link, cai em `/redefinir-senha?token=...`.
4. Preenche a nova senha → `resetPasswordAction` faz hash do token recebido
   e busca um `User` cujo `resetPasswordTokenHash` bata E que ainda não
   tenha expirado. Se achar: grava a nova senha (bcrypt), limpa os campos de
   reset, cria sessão (loga automaticamente) e manda pra `/painel`.

### Por que só o hash do token fica no banco

Se o banco vazasse, ninguém conseguiria forjar um link de reset válido a
partir do que está salvo — o token em si (a parte que realmente autentica o
pedido) só existe no email que foi enviado, nunca no Mongo.

### Proteção contra enumeração de email

`requestPasswordResetAction` sempre devolve `{ success: true }` pra email
que não tem conta — do contrário, essa tela virava uma forma de descobrir
quais emails têm cadastro na plataforma só testando um por um. A **exceção**
é a conta só-Google: ali a mensagem específica ("essa conta usa Google") já
vaza a mesma informação que o próprio `/login` revela ao tentar entrar com
senha nessa conta (`loginAction` já tem exatamente essa mensagem) — então
não é uma exposição nova.

## Template do email

Vive dentro de [`src/lib/email.ts`](../src/lib/email.ts), como uma string
HTML inline (sem MJML nem lib de template) — simples de propósito, só um
parágrafo + botão + aviso de expiração. Pra mudar visual (logo, cores da
marca), é só editar esse HTML diretamente.

## Testando localmente

1. Cadastrar uma conta com **email/senha** em `/cadastro` (não usar o botão
   do Google — conta Google não tem senha pra redefinir, ver fluxo acima).
2. Ir em `/esqueci-senha`, digitar esse email.
3. Conferir a caixa de entrada (e o spam — domínio novo pode cair lá nos
   primeiros envios) — chega um email de "Opop Profile" vindo de
   `no-reply@mail.opop.bio`.
4. Clicar no link, definir senha nova → deve logar direto e cair em
   `/painel`.

O `RESEND_API_KEY` do `.env` é a chave real da conta Resend — os envios em
dev local **são reais**, não tem sandbox/modo de teste separado configurado.

## ⚠️ Gotcha de deploy: `NEXT_PUBLIC_SITE_URL` é build-time, não runtime

Mesma pegadinha documentada em [`deploy.md`](./deploy.md#variáveis-de-ambiente):
`NEXT_PUBLIC_SITE_URL` vai embutida no bundle no momento do `build`, então é
passada como `build arg` no [`stack/docker-compose.yml`](../stack/docker-compose.yml),
não como variável de runtime comum. Hoje esse arquivo ainda tem o domínio
antigo (`https://eu-apoio.dirceutencaten.com.br`) hardcoded ali — **antes de
publicar em `opop.bio`, atualizar esse build arg e rebuildar a imagem**,
senão os links de redefinição de senha em produção apontam pro domínio
errado mesmo com o `.env` correto.

`RESEND_API_KEY` e `RESEND_FROM_EMAIL` não têm esse problema — são lidas em
runtime (só em código server-side, nunca no bundle do cliente), então viajam
normalmente via `env_file: ../.env` no mesmo compose, igual `GN_CLIENT_ID` e
companhia (ver [`pagamentos.md`](./pagamentos.md)). Não precisam de rebuild
se só o valor delas mudar — reiniciar o container basta.
