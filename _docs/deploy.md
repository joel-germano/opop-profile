# Deploy — eu-apoio.dirceutencaten.com.br

## Onde está

- **Servidor**: `134.199.243.177` (root) — o mesmo do `teia-site` / `dirceu-agenda`
- **URL**: https://eu-apoio.dirceutencaten.com.br
- **Container**: `teia-eu-apoio` (imagem `eu-apoio-teia-eu-apoio`, base `node:22-alpine`)
- **Projeto Compose**: `eu-apoio` (definido explicitamente via `name:` no [`stack/docker-compose.yml`](../stack/docker-compose.yml) — ver **⚠️ Isolamento do projeto Compose**, é importante)
- **Porta interna**: `127.0.0.1:8102` → `3000` no container
- **Rede docker**: `teia-network`
- **Arquivos no servidor**: `/opt/teia/eu-apoio/releases/current/` (cópia do projeto local, sem `node_modules`/`.next`/`_tmp`/`.git`)
- **Proxy reverso**: `teia-edge-proxy` (Caddy) — HTTPS automático via Let's Encrypt

Mesmo padrão do `dirceu-agenda`, com duas diferenças importantes:

1. **É um app Next.js, não um site estático.** O container roda Node (`server.js` do output `standalone`), não nginx. Por isso a otimização de imagem do `next/image` continua funcionando — o que importa num PWA mobile-first, já que os 8 templates são PNGs de 300–700 KB cada e são servidos como WebP redimensionado.
2. **Domínio diferente** (`dirceutencaten.com.br`, não `teiadovoto.com.br`), então precisou de bloco próprio no Caddy — ver **Setup inicial** abaixo.

## Como atualizar (fluxo normal)

### Opção A — script automático (recomendado)

[`deploy.ps1`](../deploy.ps1) faz tudo: empacota o projeto, limpa a pasta no servidor, envia, remove o container antigo **por nome** (nunca `docker compose down`), builda e sobe.

```powershell
cd d:\projetos\opop-profile
.\deploy.ps1
```

Sem passar `-Password`, ele pergunta a senha na hora (não fica salva em lugar nenhum). Também dá pra passar direto: `.\deploy.ps1 -Password 'SENHA'`.

Flags úteis:

```powershell
.\deploy.ps1 -NoCache      # build do zero, ignorando cache de camadas do Docker
```

No fim ele confere sozinho (`HTTP 200` local e via HTTPS). Se algo falhar no meio, o script para (`$ErrorActionPreference = "Stop"`) em vez de seguir com passos pela metade.

**Sobre o tempo**: o primeiro deploy leva ~3-5 min (baixa as dependências e builda o Next dentro do container). Os seguintes são bem mais rápidos (~1 min), porque a camada do `npm ci` fica em cache e só é refeita quando `package.json`/`package-lock.json` mudam. Use `-NoCache` só quando quiser descartar isso de propósito.

### Opção B — manual

```bash
# 1. Empacotar e enviar (rodar local, na pasta do projeto)
tar -czf deploy.tar.gz --exclude=node_modules --exclude=.next --exclude=.git --exclude=_tmp .
pscp -pw '<SENHA>' deploy.tar.gz root@134.199.243.177:/opt/teia/eu-apoio/releases/current/

# 2. No servidor, via SSH
cd /opt/teia/eu-apoio/releases/current
tar -xzf deploy.tar.gz && rm -f deploy.tar.gz
docker rm -f teia-eu-apoio
cd stack && docker compose build && docker compose up -d

# 3. Conferir
curl -s -o /dev/null -w 'HTTP %{http_code}\n' http://127.0.0.1:8102/
curl -sk -o /dev/null -w 'HTTPS %{http_code}\n' https://eu-apoio.dirceutencaten.com.br/
```

Usar `docker rm -f <nome>` em vez de `docker compose down` é proposital — ver seção de isolamento abaixo.

## Setup inicial (só na primeira vez)

Estes passos já valem pro domínio novo e **não** precisam ser repetidos nos deploys seguintes.

### 1. DNS

Apontar `eu-apoio.dirceutencaten.com.br` (registro A) para `134.199.243.177`.

> Se o domínio estiver atrás do Cloudflare com proxy ligado (nuvem laranja), o certificado do Caddy ainda funciona, mas vale conferir o modo de SSL (usar **Full (strict)**).

### 2. Caddy (proxy reverso)

Editar `/opt/teia/compose/edge/.env` e adicionar:

```env
EU_APOIO_DOMAIN=eu-apoio.dirceutencaten.com.br
EU_APOIO_UPSTREAM=127.0.0.1:8102
```

Adicionar as duas variáveis em `environment:` no `/opt/teia/compose/edge/docker-compose.yml` (mesmo padrão das outras).

Adicionar o bloco no `/opt/teia/compose/edge/Caddyfile`:

```caddyfile
{$EU_APOIO_DOMAIN} {
    encode zstd gzip
    reverse_proxy {$EU_APOIO_UPSTREAM}
}
```

**Fazer backup antes de editar** (o Caddy não valida sintaxe antes de aplicar):

```bash
cd /opt/teia/compose/edge
cp Caddyfile Caddyfile.bak.$(date +%s)
cp .env .env.bak.$(date +%s)
```

Aplicar:

```bash
cd /opt/teia/compose/edge
docker compose up -d
```

> ⚠️ Isso recria o `teia-edge-proxy`, que atende **todos** os domínios do servidor. É um reinício de poucos segundos, mas afeta todo mundo — evite fazer em horário de pico.

## Cache

Diferente do `dirceu-agenda` (que força `no-cache` em tudo via nginx), aqui o Next cuida disso sozinho e de um jeito melhor:

- Assets em `/_next/static/*` têm hash no nome e são imutáveis → cache longo, seguro.
- O HTML das páginas não é cacheado de forma agressiva.

Ou seja: **cada deploy gera hashes novos e o usuário pega a versão nova na hora**, sem precisar de `Ctrl+F5` nem purge de CDN, e sem abrir mão de cache nos arquivos que podem ser cacheados.

**Atenção ao Service Worker**: o app é um PWA e registra [`public/sw.js`](../public/sw.js). Ele usa estratégia *network-first* (busca a rede primeiro, cache só como fallback offline), justamente pra não segurar versão antiga — isso já foi um problema durante o desenvolvimento. Se um dia mexer nessa estratégia, lembre de subir o `CACHE_NAME` junto.

Se uma atualização não aparecer:

```bash
curl -sI https://eu-apoio.dirceutencaten.com.br/ | grep -i cache
```

Se aparecer `cf-cache-status: HIT` com header antigo, é cache preso na borda do Cloudflare → painel **Caching → Configuration → Purge Cache**.

## ⚠️ Isolamento do projeto Compose — NUNCA use `docker compose down` sem checar

**Incidente real (18/08/2026)**: vários projetos deste servidor guardavam seus `docker-compose.yml` em pastas todas chamadas `stack`. O Compose usa o **nome da pasta** como nome do projeto quando não é definido explicitamente, então os projetos compartilhavam o mesmo nome implícito — e um `docker compose down` numa pasta derrubou `teia-site` e `teia-backend` junto.

**Aqui isso está prevenido**: o [`stack/docker-compose.yml`](../stack/docker-compose.yml) tem `name: eu-apoio` explícito no topo.

**Regras de segurança:**

- Prefira `docker compose up -d --build` em vez de `docker compose down` + `up`.
- Se precisar remover o container, use `docker rm -f teia-eu-apoio` (por nome).
- Antes de rodar `docker compose down` em QUALQUER stack deste servidor, rode `docker compose config --services` pra conferir que só lista o serviço esperado.
- `teia-site` e `teia-backend` **ainda não têm** `name:` explícito — o mesmo risco existe pra eles. Não mexer sem avisar o Joel antes.

## Variáveis de ambiente

`NEXT_PUBLIC_SITE_URL` é lida em [`src/lib/site.ts`](../src/lib/site.ts) e usada no SEO, Open Graph e no link que vai junto na legenda de compartilhamento.

Ela é **build-time**, não runtime — vai embutida no bundle do cliente. Por isso é passada como `build arg` no [`stack/docker-compose.yml`](../stack/docker-compose.yml), não como `environment`. Se o domínio mudar, tem que **rebuildar** a imagem, não basta reiniciar o container.

## Outros comandos úteis

```bash
# logs do app
docker logs teia-eu-apoio --tail 50 -f

# logs do proxy (útil pra depurar certificado/roteamento)
docker logs teia-edge-proxy --tail 50

# reiniciar só o app (sem rebuild)
docker restart teia-eu-apoio

# listar todos os containers do servidor
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'

# uso de disco das imagens (o build do Next deixa camadas intermediarias)
docker system df
docker image prune -f    # limpa imagens orfas com seguranca
```

## Estrutura de referência (serviços no mesmo servidor)

| Domínio | Upstream | Container |
|---|---|---|
| teiadovoto.com.br | 127.0.0.1:8100 | teia-site |
| api.teiadovoto.com.br | 127.0.0.1:3333 | teia-backend |
| cloud.teiadovoto.com.br | 127.0.0.1:9000 | teia-portainer |
| livekit.teiadovoto.com.br | 127.0.0.1:7880 | teia-livekit |
| live.teiadovoto.com.br | 127.0.0.1:8080 | teia-nginx-rtmp |
| dirceu-agenda.teiadovoto.com.br | 127.0.0.1:8101 | teia-dirceu-agenda |
| **eu-apoio.dirceutencaten.com.br** | **127.0.0.1:8102** | **teia-eu-apoio** |

Todos passam pelo mesmo `teia-edge-proxy` (Caddy, `network_mode: host`, escuta 80/443 direto no servidor).
