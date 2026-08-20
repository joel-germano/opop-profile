# Pagamentos — conta Premium (Pix e cartão via Efí)

## Visão geral

Conta de usuário tem dois planos: `free` e `premium` (campo `plan` em
[`User`](../src/lib/models/user.ts)). Virar Premium custa **R$ 5,00**
([`PREMIUM_PRICE_CENTS`](../src/lib/plans.ts)) e acontece em
`/painel/checkout`, com Pix ou cartão de crédito via **Efí** (Gerencianet).

O projeto de referência pra essa integração é o `assimAppPay`
(`C:\PROJETOS\ASSIM\assimAppPay`) — **não reaproveitar as credenciais dele**,
são de outro produto (Losamo) e mexer no webhook Pix daquela conta quebraria
o pagamento em produção de lá. Esse projeto tem aplicação Efí própria.

## Peças

| Arquivo | Papel |
|---|---|
| [`src/lib/efi.ts`](../src/lib/efi.ts) | Cliente Efí: OAuth (Pix com mTLS, Cobranças sem), criar cobrança Pix, cobrar cartão, registrar webhook |
| [`src/lib/models/payment.ts`](../src/lib/models/payment.ts) | Um documento por tentativa de cobrança (`pending`/`paid`/`refunded`/`failed`) |
| [`src/app/painel/checkout/`](../src/app/painel/checkout/) | Tela de checkout (`page.tsx`) + Server Actions (`actions.ts`) |
| [`src/components/CheckoutForm.tsx`](../src/components/CheckoutForm.tsx) | Abas Pix/Cartão, tokenização de cartão no navegador, polling do Pix |
| [`src/app/api/webhooks/pix/route.ts`](../src/app/api/webhooks/pix/route.ts) | Recebe confirmação da Efí, marca `Payment`/`User` |
| [`src/app/api/checkout/status/route.ts`](../src/app/api/checkout/status/route.ts) | Poll do cliente — lê só o Mongo, nunca a Efí |
| [`src/instrumentation.ts`](../src/instrumentation.ts) | Registra o webhook Pix na Efí ao subir o servidor |

## Variáveis de ambiente (`.env`)

Nenhuma tem valor de exemplo aqui de propósito — ver `.env` local (não
versionado) pros valores reais.

| Variável | Pra quê |
|---|---|
| `GN_CLIENT_ID` / `GN_CLIENT_SECRET` | OAuth server-side (Pix e Cobranças/cartão). Painel Efí → Minhas Aplicações → sua aplicação |
| `GN_ACCOUNT_ID` | **Diferente do Client Id.** Só usado pela tokenização de cartão no navegador (`EfiPay.CreditCard.setAccount`) — ver gotcha abaixo |
| `GN_ENDPOINT` / `GN_ENDPOINT_APIS` | Endpoints fixos da Efí (Pix e Cobranças). Produção por padrão; se um dia usar homologação, sufixo `-h.` no host — `efiEnvironment` em `checkout/page.tsx` detecta isso sozinho pra tokenização |
| `GN_CERT` | Nome do arquivo `.p12` dentro de `certs/` (pasta não versionada, na raiz do projeto) |
| `PIX_CHAVE` | Chave Pix que recebe os pagamentos |
| `PIX_WEBHOOK_URL` | URL pública que a Efí chama quando um Pix é pago. Em dev, é o túnel ngrok |
| `PIX_WEBHOOK_SECRET` | Token anexado como `?token=` na URL registrada — sem ele o endpoint fica público pra qualquer um forjar confirmação de pagamento |

## Certificado `.p12`

Baixado no painel Efí (aplicação → Certificados), salvo em `certs/<nome>.p12`
(fora do git — ver `.gitignore`). Necessário só pra API Pix (mTLS); Cobranças
(cartão) não usa certificado.

**Docker**: o certificado é **copiado pra dentro da imagem** no build
(`COPY --from=builder .../certs ./certs` no [`Dockerfile`](../Dockerfile)),
não um volume — é estático, então só precisa rebuildar se o certificado for
renovado. O `.env` (com os client id/secret/chave Pix) viaja pro servidor
junto no pacote do `deploy.ps1` e entra no container via `env_file` no
[`stack/docker-compose.yml`](../stack/docker-compose.yml).

## Fluxo Pix

1. Usuário clica "Gerar Pix" → `createPixChargeAction` cria um `Payment`
   (`status: pending`) e chama `POST /v2/cob` na Efí → volta `txid` + QR code.
2. Cliente entra em polling (`/api/checkout/status?txid=...`) a cada 4s —
   **isso nunca chama a Efí**, só lê o `status` já gravado no Mongo. Só quem
   escreve nesse campo é o webhook.
3. Quando o Pix é pago de verdade, a Efí faz `POST` em
   `/api/webhooks/pix?token=...` com o `txid`. A rota marca o `Payment` como
   `paid` e o `User.plan` como `premium`.
4. Cliente vê o novo status no próximo poll, chama `router.refresh()`.

## Fluxo Cartão

1. Formulário no navegador carrega o SDK da Efí
   (`js-payment-token-efi`) via `next/script`.
2. `EfiPay.CreditCard.setAccount(GN_ACCOUNT_ID)...getPaymentToken()`
   tokeniza o cartão **sem o número nunca chegar no nosso backend**.
3. O token vai pra `chargeCreditCardAction`, que chama
   `POST /v1/charge/one-step` na API de Cobranças (sem mTLS).
4. Se `status === "approved"`, marca `Payment`/`User` na hora (não depende
   de webhook — cartão aprova síncrono).

### ⚠️ Gotcha: `GN_CLIENT_ID` ≠ `GN_ACCOUNT_ID`

A tokenização de cartão (`setAccount`) **não aceita o Client Id do OAuth**
(nem com nem sem o prefixo `Client_Id_`) — dá erro
`Identificador de conta [...] inválido`. É um identificador separado, visível
em outro lugar do painel Efí (ligado à conta/CNPJ, não à aplicação — por
isso pode até coincidir entre aplicações diferentes da mesma conta). Guardado
em `GN_ACCOUNT_ID`.

## Segurança do webhook

`/api/webhooks/pix` é a única rota do projeto que mexe no Mongo sem sessão de
usuário (não tem como — quem chama é a Efí). Proteção: token em `?token=`,
comparado com `crypto.timingSafeEqual` contra `PIX_WEBHOOK_SECRET`. Sem esse
token, qualquer um que soubesse a URL e um `txid` pendente forjaria uma
confirmação de pagamento.

### ⚠️ Gotcha: a Efí anexa `/pix` na URL registrada

Ao chamar o webhook, a Efí soma um `/pix` no final da URL que foi registrada
— mesmo comportamento que o `assimAppPay` documenta na rota
`/webhook(/pix)?`. Como o token é o último trecho da nossa URL
(`?token=XXX`), isso vira parte do *valor* da query
(`?token=XXX/pix`), não um novo segmento de path. `isValidToken` em
`route.ts` remove esse sufixo antes de comparar.

### ⚠️ Gotcha: `instrumentation.ts` e o registro do webhook

`ensurePixWebhookRegistered()` não pode rodar direto dentro de `register()`.
O registro na Efí faz a Efí chamar de volta a própria URL pra validar
(ping síncrono) — mas o Next.js só aceita conexões **depois** que
`register()` termina. Resultado: a Efí tentava validar um servidor que ainda
não estava escutando e o registro falhava com `ECONNRESET`. Por isso o
`setTimeout` de 3s em `instrumentation.ts` — deixa o servidor terminar de
subir antes de disparar o registro.

## Testando localmente

1. `ngrok http 3000` (a porta tem que bater com `npm run dev`, que sobe em
   3000 por padrão — não usar `-p` customizado ou a URL do ngrok não alcança
   o servidor local).
2. Colar a URL do ngrok em `PIX_WEBHOOK_URL` no `.env`.
3. Subir `npm run dev` — o webhook é registrado sozinho ~3s depois do
   servidor ficar pronto (log `[efi] Webhook Pix registrado: ...`).
4. Pra depurar sem confiar só nos logs do Next, o inspector local do ngrok
   (`http://127.0.0.1:4040`) mostra a requisição crua que a Efí mandou —
   foi assim que os dois gotchas acima foram descobertos.

**Cuidado**: as credenciais são de **produção**. Gerar um Pix de teste é
seguro (não custa nada até alguém pagar, expira em 1h). Testar cartão com
número de teste (ex: `4111111111111111`) também é seguro — é recusado de
verdade pela Efí, sem mover dinheiro. Nunca simular isso com cartão real só
pra testar código.

## Incidente real (19/08/2026)

Um pagamento Pix real (R$ 5,00) foi pago durante teste manual, mas o webhook
foi rejeitado com 401 por causa do gotcha do sufixo `/pix` (ainda não corrigido
nesse momento). O `Payment`/`User` tiveram que ser corrigidos manualmente no
Mongo depois do fix. Lição: qualquer alteração na validação do token do
webhook merece um teste de webhook simulado (`curl` direto pra
`/api/webhooks/pix?token=...`) antes de considerar "pronto", não só o registro
na Efí.
