# Presidenciáveis — apoio a candidatos reais

## Visão geral

Produto **paralelo** ao fluxo principal (Criadores/`User`): em vez de cada
pessoa montar o próprio perfil de campanha, aqui um conjunto fixo de
**candidatos reais** (`Candidate`, cadastrados só pelo admin) recebe fotos de
apoio de **eleitores** (`Supporter`) que pagam uma vez pra desbloquear o
recurso pra sempre.

Entra pela rota **`/presidenciaveis`** — não tem link em nenhum menu do
produto principal, só acessível digitando a URL (mesma situação do
`/admin/login`).

Isolamento total do fluxo Premium (ver [`pagamentos.md`](./pagamentos.md)):
model próprio, cliente Efí próprio, chave Pix própria, webhook próprio. Nada
é compartilhado além do mesmo certificado `.p12` e client id/secret da
aplicação Efí.

## Modelos

| Model | Papel |
|---|---|
| [`Candidate`](../src/lib/models/candidate.ts) | Candidato real — nome, slug, foto. Só o admin cria/edita/apaga (`/admin/presidenciaveis`) |
| [`CandidateTemplate`](../src/lib/models/candidate-template.ts) | Molduras desse candidato — paralelo ao `Template` do fluxo principal, que pertence a um `User` |
| [`Supporter`](../src/lib/models/supporter.ts) | Identidade leve de quem apoia — só email + (senha OU Google) + `unlocked`. Não é um `User`: sem username, sem painel, sem molduras próprias |
| [`SupporterPurchase`](../src/lib/models/supporter-purchase.ts) | Cobrança paralela ao `Payment` — paga uma vez, desbloqueia o `Supporter` pra sempre (não é por candidato nem por geração) |
| [`GalleryPost`](../src/lib/models/gallery-post.ts) | Foto pública que um apoiador gerou e decidiu postar na galeria de um candidato (por `candidateSlug`, não `candidateId`) |

## Rotas e telas

| Rota | Papel |
|---|---|
| `/presidenciaveis` ([`page.tsx`](../src/app/presidenciaveis/page.tsx)) | Grade com todos os `Candidate` cadastrados |
| `/presidenciaveis/[slug]` ([`page.tsx`](../src/app/presidenciaveis/[slug]/page.tsx)) | Escolher moldura, editar foto, desbloquear, gerar/baixar/compartilhar, ver galeria paginada |
| [`PresidentialCandidatePage.tsx`](../src/components/PresidentialCandidatePage.tsx) | Client component principal da tela acima — carrossel de molduras, editor, abre o `SupporterUnlockModal` quando ainda não desbloqueou |
| [`SupporterUnlockModal.tsx`](../src/components/SupporterUnlockModal.tsx) | Modal de identificação (email/senha ou Google) → pagamento (Pix ou cartão) |
| [`PresidentialShareModal.tsx`](../src/components/PresidentialShareModal.tsx) | Depois de gerar o card: baixar, compartilhar, postar na galeria (`postToGalleryAction`) |
| `/admin/presidenciaveis` | CRUD de candidatos + molduras + moderação da galeria (ver seção Admin) |

## Fluxo do apoiador

1. Clica em "Escolher foto" sem estar desbloqueado → `SupporterUnlockModal`
   abre no passo `identify`.
2. **Identificação**: email/senha (`identifySupporterAction` — cria a conta
   `Supporter` na hora se o email for novo) ou Google
   (`loginWithGoogleAction`, via `verifyGoogleIdToken` em
   [`google-verify.ts`](../src/lib/google-verify.ts), que valida o ID token
   direto contra as chaves públicas do Google — nunca confia em nada vindo
   só do cliente).
3. Sessão do apoiador é um JWT próprio, cookie separado do `User`
   (`SUPPORTER_SESSION_COOKIE`, 1 ano — ver
   [`supporter-auth.ts`](../src/lib/supporter-auth.ts); desbloqueio é
   vitalício, não precisa expirar cedo).
4. Se `unlocked: false`, o modal avança pro passo `pay` — Pix ou cartão,
   mesma UX do checkout Premium (polling do Pix, tokenização de cartão no
   navegador). Preço vem de `getPresidenciaveisPriceCents()` (ver
   [`premium-price.ts`](../src/lib/premium-price.ts) — editável em
   `/admin/configuracoes`, sem precisar de deploy).
5. Pago → `unlocked: true` no `Supporter`. Dali em diante, pra sempre: gerar
   quantas fotos quiser, com qualquer candidato, sem pagar de novo.
6. Editor de foto ([`PresidentialPhotoEditor`](../src/components/PresidentialPhotoEditor.tsx))
   compõe a foto na moldura escolhida. `PresidentialShareModal` oferece
   baixar, compartilhar (Web Share API) e **postar na galeria pública** desse
   candidato.

## Regra da galeria: um post por apoiador por candidato

Reforçada em duas camadas (comentário em
[`gallery-post.ts`](../src/lib/models/gallery-post.ts)):

- `postToGalleryAction` faz um `findOne` antes do `create`.
- Sem índice único no schema — já existiam posts reais de antes desse campo
  existir, sem `supporterId`, e vários colidiriam num índice único (mesmo
  `sparse`) por terem o campo ausente no mesmo candidato.

`hasPostedToGalleryAction` e `getGalleryPreviewAction` (últimos 5, mais
recentes primeiro) alimentam a UI sem duplicar essa checagem.

## Pagamento — Pix e cartão

Mesmo desenho do fluxo Premium (ver
[`pagamentos.md`](./pagamentos.md) pros detalhes de tokenização/mTLS/gotchas
de webhook — não repetidos aqui), com peças próprias:

| Peça | Arquivo |
|---|---|
| Cliente Efí | [`src/lib/efi-presidenciaveis.ts`](../src/lib/efi-presidenciaveis.ts) — cópia paralela de `efi.ts` |
| Webhook Pix | [`src/app/api/webhooks/pix-presidenciaveis/route.ts`](../src/app/api/webhooks/pix-presidenciaveis/route.ts) — cópia paralela de `webhooks/pix/route.ts` |
| Server Actions | [`src/app/presidenciaveis/actions.ts`](../src/app/presidenciaveis/actions.ts) |
| Registro do webhook no boot | `ensurePixWebhookRegisteredPresidenciaveis()`, chamado em [`instrumentation.ts`](../src/instrumentation.ts) — mesmo delay de 3s e mesmo motivo do fluxo Premium (servidor precisa estar aceitando conexões antes do ping de validação da Efí) |

### Por que duplicado em vez de reaproveitado

A Efí registra o webhook **por chave Pix**, não por URL — os dois fluxos não
podiam dividir o mesmo registro sem se pisarem. Isolamento pedido
explicitamente pra manter o Premium (já em produção) livre de qualquer risco
ao mexer nos presidenciáveis.

### Variáveis de ambiente próprias (`.env`)

| Variável | Pra quê |
|---|---|
| `PIX_CHAVE_PRESIDENCIAVEIS` | Chave Pix que recebe os pagamentos desse fluxo |
| `PIX_WEBHOOK_URL_PRESIDENCIAVEIS` | URL pública do webhook (em dev, o túnel ngrok) |
| `PIX_WEBHOOK_SECRET_PRESIDENCIAVEIS` | Token em `?token=` — mesma validação `timingSafeEqual` do fluxo Premium |

`GN_CLIENT_ID`, `GN_CLIENT_SECRET`, `GN_ACCOUNT_ID`, `GN_CERT` são
**compartilhados** com o fluxo Premium — mesma aplicação Efí.

### Trava contra cobrança duplicada e reembolso

Mesma lógica do Premium, replicada aqui:

- `createSupporterPixChargeAction`/`chargeSupporterCreditCardAction` recusam
  cobrar quem já tem `unlocked: true`.
- Status de cartão passa por `mapChargeStatus()`
  ([`efi-charge-status.ts`](../src/lib/efi-charge-status.ts)) — resposta não
  conclusiva da Efí vira `pending` (não `failed`), pra não incentivar retry e
  cobrança dupla.
- Webhook de estorno só re-tranca o `Supporter` (`unlocked: false`) se não
  sobrar nenhuma outra `SupporterPurchase` com `status: paid` — evita
  destravar um apoiador que tem duas compras e só uma foi estornada.

## Admin

`/admin/presidenciaveis` ([`page.tsx`](<../src/app/admin/(dashboard)/presidenciaveis/page.tsx>),
ações em [`actions.ts`](<../src/app/admin/(dashboard)/presidenciaveis/actions.ts>)):

- **Candidatos**: criar (`createCandidateAction`), editar nome/slug/foto
  (`updateCandidateAction`), excluir (`deleteCandidateAction`).
- **Molduras do candidato**: adicionar (`addCandidateTemplateAction`),
  excluir (`deleteCandidateTemplateAction`) — dentro da tela de cada
  candidato (`/admin/presidenciaveis/[candidateId]`), separado da aba
  **Molduras** do menu principal (essa é só dos Criadores/`User`).
- **Moderação da galeria**: excluir post (`deleteGalleryPostAction`).

### Exclusão em cascata (sem órfãos)

`deleteCandidateAction` apaga, nessa ordem: arquivos + registros de todas as
`CandidateTemplate` do candidato, arquivos + registros de todos os
`GalleryPost` daquele `candidateSlug`, o avatar do candidato, e por fim o
próprio `Candidate`. Auditado e sem lacunas (ver histórico de correções em
`deleteUserAction`/`deleteSupporterAction` do fluxo principal, que tinham
esse tipo de bug e foram corrigidos).

`/admin/eleitores` gerencia os `Supporter` (ver `deleteSupporterAction`) —
exclusão também limpa `SupporterPurchase` e `GalleryPost` daquele apoiador,
arquivo e registro.

## Dataset sintético de lançamento

O placar, o gráfico de evolução e a arrecadação foram populados com apoios
fictícios pra não estrear zerados — ver
[`presidenciaveis-launch-seed.md`](./presidenciaveis-launch-seed.md) pros
números exatos, como identificar cada documento sintético e o script pra
limpar tudo depois (`scripts/cleanup-launch-seed.mjs`).

## Preço editável

`DEFAULT_PRESIDENCIAVEIS_PRICE_CENTS` em
[`presidenciaveis-constants.ts`](../src/lib/presidenciaveis-constants.ts) é
só o fallback. O valor de verdade fica em `AppSettingsModel.presidenciaveisPriceCents`
(ver [`app-settings.ts`](../src/lib/models/app-settings.ts)), editável em
`/admin/configuracoes` sem deploy — reflete na exibição
(`SupporterUnlockModal`) e na cobrança real (servidor sempre relê o valor
atual antes de cobrar, nunca confia no que o navegador manda).

## Compra em quantidade e convites (presentear molduras)

No desbloqueio (`SupporterUnlockModal`) a pessoa escolhe **quantas molduras**
quer comprar (1 a `MAX_FRAME_QUANTITY`). O total é `preço unitário ×
quantidade`, recalculado no servidor — `clampQuantity()` ignora qualquer
valor fora da faixa que chegue pela request.

### Contabilidade

| Onde | Campo | O quê |
|---|---|---|
| `Supporter` | `frameCredits` | total de molduras compradas (soma das compras pagas) |
| `SupporterPurchase` | `quantity` | quantas molduras aquela compra vale |
| `FrameInvite` | um doc por convite | cada convite ocupa uma vaga |

`frameCredits` é creditado com `$inc` quando o pagamento confirma (cartão na
hora, Pix no webhook) e debitado no estorno — nunca `$set`, pra não perder
compras concorrentes.

O **saldo de convites** (`getInviteSummary`) é derivado, não armazenado:

```
disponíveis = frameCredits − 1 (a moldura da própria pessoa) − convites não revogados
```

Convite `used` **continua ocupando a vaga** (a moldura foi consumida); só
`revoked` devolve. Derivar em vez de guardar um contador garante que saldo e
histórico ("quem convidou quem") nunca divirjam.

### Jornada do convite

1. Quem tem saldo gera um convite (`createFrameInviteAction`) — token de 12
   caracteres URL-safe (`randomBytes(9).base64url`), ~72 bits.
2. Envia por **WhatsApp** (`wa.me`), **email** (Resend, via
   `sendFrameInviteEmailAction` — registra `sentToEmail`) ou **copiar link**.
3. O amigo abre `/presidenciaveis/{slug}?convite={token}`. O servidor valida
   em `getInviteContext` (existe + `pending` + mesmo candidato) e, só se
   valer, mostra o banner "Fulano te deu uma moldura".
4. Ao clicar em "Escolha sua foto", o `SupporterUnlockModal` abre em **modo
   convite**: identifica a pessoa e vai direto pro resgate, sem etapa de
   pagamento.
5. `redeemFrameInviteAction` consome o convite e libera o convidado.

### Garantias do resgate

- **Sem uso duplo**: o consumo é um `findOneAndUpdate({ token, status:
  "pending" })` atômico — dois cliques simultâneos no mesmo link, só um
  vence (verificado com resgate concorrente contra o banco real).
- **Sem auto-resgate**: quem convidou não resgata o próprio convite.
- **Rollback**: se liberar o convidado falhar depois do convite já ter sido
  marcado como usado, ele volta pra `pending`.
- **Escopo por dono**: `sendFrameInviteEmailAction` filtra por
  `inviterSupporterId`, então ninguém dispara email com token alheio.

## Cada moldura é metrificada (1 compra/convite = 1 geração)

Não existe mais "desbloqueio vitalício" — `unlocked` só indica "já
comprou/resgatou alguma vez" (histórico). Quem pode gerar agora é decidido
por `Supporter.frameCredits`, gasto 1 a 1 a cada geração de verdade:

- `generateFrameAction(candidateSlug, imageDataUrl)`
  (`invite-actions.ts`) roda no clique de "Fazer Download"
  (`PresidentialPhotoEditor.handleDownload`), depois que o `<canvas>` já
  compôs a imagem no navegador. Débito atômico
  (`findOneAndUpdate({ frameCredits: { $gte: 1 } }, { $inc: -1 })`, mesma
  técnica do resgate) evita duas gerações simultâneas gastarem o mesmo
  crédito. Se a gravação do arquivo falhar depois do débito, o crédito
  volta (`$inc: +1`).
- Cada geração cria uma entrada em `FrameInvite` (`selfUse: true, status:
  "used"`) — é o **mesmo ledger usado pro saldo de convites**
  (`getInviteSummary`), então "quanto eu já usei" nunca diverge de
  `frameCredits`, seja o uso por geração direta ou por convite resgatado
  por um amigo.
- `redeemFrameInviteAction` agora só credita `frameCredits += 1` pro
  convidado (não desbloqueia geração ilimitada) — o convidado gasta essa
  vaga do mesmo jeito que qualquer outra, ao efetivamente gerar.
- Salvar na galeria **deixou de ser opcional**: toda geração já cria um
  `GalleryPost` automaticamente, com `visibility: "private"` por padrão. A
  pessoa escolhe depois torná-la pública (`setGalleryPostVisibilityAction`,
  toggle em `PresidentialShareModal` ou em "Minha Galeria").

### Galeria pública x "Minha Galeria" (privacidade)

`GalleryPost.visibility` (`"private"` padrão / `"public"`) separa duas
coisas:

| | Filtra por `visibility` | Onde |
|---|---|---|
| Vitrines públicas (carrossel, modal de galeria completa, prévia no modal de compartilhar) | Sim — só `"public"` | `getGalleryFeedAction`, `getGalleryPreviewAction`, prévia em `[slug]/page.tsx` |
| "Minha Galeria" (o próprio dono) | Não — mostra tudo | `getMyGalleryAction` (filtra por `supporterId`, não por `candidateSlug`) |
| Placar/ranking do candidato (`supporterCount`) | Não — conta toda moldura gerada | `GalleryPostModel.countDocuments({ candidateSlug })` |

Importante: **é obrigatório sempre filtrar por `visibility: "public"` nas
queries que qualquer visitante pode ver** — sem isso, foto privada vaza pra
galeria pública de outra pessoa (verificado contra o banco real: um doc
`private` inserido de propósito não aparece em nenhuma das duas queries
públicas, e aparece normalmente em `getMyGalleryAction`).

Dados sintéticos do lançamento (ver seção anterior) foram criados **antes**
desse campo existir — não têm `visibility` gravado, então não batem com o
filtro `{ visibility: "public" }` e não aparecem mais nas vitrines públicas
(o placar/ranking não é afetado, continua contando certo). Já eram pra ser
zerados depois mesmo.
