# Dataset sintético de lançamento — /presidenciaveis

Em 24/08/2026, o banco de produção foi (re)populado com apoios, usuários e
compras **fictícios** pra `/presidenciaveis` e pro painel `/admin` terem
volume realista pra testar (ranking, gráfico, paginação, filtros) — o
dataset anterior (Aug/2026) já tinha sido limpo antes deste.

## Por quê

A página inteira é construída em cima da promessa de que cada número ali é
uma pessoa real que pagou e publicou uma foto (ver a seção "Por que criamos
isso" na própria página). Um placar zerado não prova nem desmente nada — só
passa a impressão de ferramenta sem uso. Os números abaixo dão um ponto de
partida coerente, e também servem pra testar o admin sob carga (paginação,
filtros de pagamento etc.) com dado de verdade no banco.

## O que foi criado

Script: `scripts/seed-presidenciaveis-mock.mjs` (relatório por padrão, `--fix`
grava de vez — mesmo padrão do `cleanup-launch-seed.mjs`).

Pra cada apoio "fictício", três documentos coerentes entre si (não é só um
número solto no ranking — vira usuário completo, com compra paga e post na
galeria, exatamente como um apoio de verdade geraria):

- 1 `Supporter` (`supporters`) — `unlocked: true`, `frameCredits: 0`
  (comprou 1, gastou 1 gerando a própria moldura — mesmo estado final de um
  apoio real)
- 1 `SupporterPurchase` (`supporterpurchases`) — `status: "paid"`, R$ 3,00,
  `quantity: 1`
- 1 `GalleryPost` (`galleryposts`) — a foto que conta o apoio no ranking,
  ~75% `visibility: "public"` / 25% `"private"` (mistura realista, não tudo
  público)

### Distribuição por candidato

Total do Lula é o dado fixo (628); os demais seguem a mesma proporção do
dataset anterior, só reordenada pra Flávio ficar em 2º e Caiado em 3º (antes
era Renan 3º, Caiado 4º). Cada candidato cresce nos mesmos 3 dias, com a
mesma curva ascendente (25% / 32% / 43% do total por dia).

| Candidato | 22/10 | 23/10 | 24/10 | Total |
|---|---:|---:|---:|---:|
| Lula da Silva | 157 | 201 | 270 | **628** |
| Flávio Bolsonaro | 125 | 159 | 214 | **498** |
| Ronaldo Caiado | 77 | 99 | 132 | **308** |
| Renan Santos | 50 | 63 | 85 | **198** |
| Romeu Zema | 28 | 36 | 49 | **113** |
| Augusto Cury | 14 | 18 | 24 | **56** |
| **Total** | **451** | **576** | **774** | **1.801** |

Arrecadação simulada: 1.801 × R$ 3,00 = **R$ 5.403,00**.

As datas são **22, 23 e 24/10/2026** fixas no script (não relativas ao
relógio do servidor, diferente do dataset anterior) — horário de cada
registro espalhado entre 8h e 23h (`America/Sao_Paulo`, UTC-3 fixo) pra não
travar tudo em 00:00.

### Imagem de galeria

O próprio avatar de cada candidato, copiado uma vez pra
`/uploads/gallery/launch-{slug}.{ext}` e reaproveitado em todos os posts
sintéticos dele — gerar ~300 fotos únicas por candidato seria desperdício de
espaço pra dado que só existe pra preencher número, não pra ser navegado
individualmente na galeria.

## Como identificar (pra filtrar, auditar ou limpar)

Todo documento sintético tem uma marca própria, fácil de reconhecer sem
tocar em apoio real:

| Coleção | Campo | Padrão |
|---|---|---|
| `supporters` | `email` | começa com `apoiador.launch.` |
| `supporterpurchases` | `externalId` | começa com `launch-` |
| `galleryposts` | `imageUrl` | começa com `/uploads/gallery/launch-` |

## Como reseedar (números/datas diferentes)

Edite as constantes no topo de `scripts/seed-presidenciaveis-mock.mjs`
(`DAYS`, `DAY_SHARE`, `RATIO_TO_LULA`, `LULA_TOTAL`) e rode de novo — mas
**limpe o dataset antigo primeiro** (`cleanup-launch-seed.mjs --fix`), senão
os dois datasets somam no ranking.

```bash
node scripts/seed-presidenciaveis-mock.mjs          # só relata o plano, não grava
node scripts/seed-presidenciaveis-mock.mjs --fix    # relata E grava de vez
```

## Como limpar depois

Quando houver apoio real suficiente (ou antes de divulgar a página pra
valer, se preferir começar do zero com números 100% reais):

```bash
# Só relata quantos documentos seriam apagados, não apaga nada:
node scripts/cleanup-launch-seed.mjs

# Apaga de verdade (supporters + purchases + galleryposts + as 6 imagens):
node scripts/cleanup-launch-seed.mjs --fix
```

O script só toca documentos com a marca acima — apoio real misturado no
meio continua intacto, mesmo rodando isso depois da página já estar no ar
com gente de verdade apoiando.

## Aviso importante — reconciliação financeira

As `SupporterPurchase` sintéticas estão marcadas `status: "paid"`, mas
**nenhuma** corresponde a uma cobrança real na Efí (o gateway de pagamento)
— o `externalId` é fabricado (`launch-{slug}-{n}`), não um ID de transação
real.

Se em algum momento o valor arrecadado exibido na página for reconciliado
contra o extrato real da Efí, essas compras vão aparecer como "pagas no
banco, sem registro no gateway". Isso é esperado enquanto o dataset
sintético existir — não é um bug, é a natureza do dado. Rode a limpeza
acima antes de qualquer reconciliação financeira de verdade.
