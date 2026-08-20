# syntax=docker/dockerfile:1

# ---- deps ----------------------------------------------------------------
# Kept as its own stage so the (slow) dependency install is cached and only
# re-runs when package.json / package-lock.json actually change.
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- builder -------------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app

# Baked into the client bundle at build time (SEO/Open Graph/share links),
# so it has to be present here and not only at runtime.
ARG NEXT_PUBLIC_SITE_URL=https://eu-apoio.dirceutencaten.com.br
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- runner --------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs \
  && adduser -S nextjs -u 1001

# `standalone` deliberately leaves out public/ and .next/static — they have to
# be copied in next to server.js for it to serve them.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Certificado .p12 da Efí (pagamentos) — não é versionado no git, mas viaja
# junto no pacote do deploy.ps1 (mesmo tratamento do .env). Sem volume: é
# estático, então basta rebuildar a imagem se o certificado for renovado.
COPY --from=builder --chown=nextjs:nodejs /app/certs ./certs

# Pastas onde fotos de perfil (save-avatar.ts), molduras (save-template.ts) e
# fotos da galeria (save-gallery-photo.ts) são salvas em disco. Precisam
# existir e já pertencer a `nextjs` antes do volume ser montado em cima: um
# volume nomeado novo herda dono/permissões do que já estava no caminho da
# imagem.
RUN mkdir -p ./public/uploads/avatars ./public/uploads/templates ./public/uploads/gallery \
  && chown -R nextjs:nodejs ./public/uploads

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
