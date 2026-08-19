<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Sobre este projeto — Eu Apoio (moldura de foto de perfil)

PWA mobile-first que gera artes de apoio a um candidato: o usuário escolhe uma moldura
(template), encaixa a própria foto dentro dela, ajusta, aplica efeitos e compartilha.
Campanha: **Dirceu ten Caten** ("Um vice pra chamar Dirceu"). No ar em
`https://eu-apoio.dirceutencaten.com.br`.

## Fluxo do usuário

1. **Home** ([src/app/page.tsx](src/app/page.tsx)): cabeçalho (crachá com foto/nome do
   candidato + botão de menu), título, carrossel 3D de templates
   ([TemplateCarousel3D.tsx](src/components/TemplateCarousel3D.tsx)), botão "Escolha sua
   foto" (abre o seletor nativo — câmera ou galeria).
2. **Editor** ([PhotoEditorModal.tsx](src/components/PhotoEditorModal.tsx), tela cheia,
   limitada a 480px no desktop): a foto entra no [PhotoStage.tsx](src/components/PhotoStage.tsx)
   por trás do template (que tem um "buraco" transparente). Dá pra:
   - Arrastar/pinçar/rolar a roda do mouse pra mover e dar zoom na foto (mais botões
     explícitos de zoom +/- e girar 15° por clique).
   - Ligar/desligar um **fundo desfocado** (cópia da própria foto, ampliada e borrada,
     preenchendo a moldura quando a foto não cobre tudo).
   - Aplicar um dos **43 filtros de cor** ([EffectsPanel.tsx](src/components/EffectsPanel.tsx),
     receitas em [photo-filters.ts](src/lib/photo-filters.ts) — técnica sepia+saturate+hue-rotate).
   - Adicionar **texto arrastável/rotacionável/redimensionável** sobre a arte
     ([DraggableText.tsx](src/components/DraggableText.tsx) + painel de edição em
     [TextEditorPanel.tsx](src/components/TextEditorPanel.tsx): fonte do Google Fonts,
     tamanho, negrito/itálico/sublinhado/tachado, paleta de cores).
   - Trocar de template sem perder a foto (miniaturas roláveis).
3. **Download**: tudo é composto num `<canvas>` ([composite.ts](src/lib/composite.ts)) na
   resolução real do template (1080px), replicando exatamente o que a prévia em CSS mostra
   (mesma matemática de posição/zoom/rotação/filtro/blur/texto).
4. **Tela de sucesso** ([ShareSuccessModal.tsx](src/components/ShareSuccessModal.tsx)): o
   card baixado aparece com animação de "saindo do forno", legenda pronta pra copiar (com
   link do site embutido) e 3 ações — Compartilhar (Web Share API, com fallback de copiar
   texto quando não há suporte a anexar arquivo), Baixar de novo, Começar de novo.
5. **Menu** ([DirceuMenuModal.tsx](src/components/DirceuMenuModal.tsx)): lista de conquistas
   do candidato com ícones + frase de chamada pra ação.

## O que já está pronto

- Fluxo completo ponta a ponta (escolher foto → editar → baixar/compartilhar).
- PWA instalável: manifest, ícones (favicon próprio + ícones de app gerados), service
  worker *network-first* (nunca serve versão velha em cache).
- Responsivo mobile-first com tratamento fino de área segura (notch/home indicator),
  alvos de toque, feedback visual em todo botão, teclado mobile não sobrepõe campos.
- Identidade visual própria: cor de marca `#47C1F1` (`--color-brand`/`--color-brand-light`
  em [globals.css](src/app/globals.css)), fonte de título **Made Florence Sans** e fonte de
  corpo **Bahnschrift** (`next/font/local`, arquivos em `src/app/fonts/`).
- SEO/Open Graph completos ([site.ts](src/lib/site.ts) centraliza título/descrição/URL):
  meta tags, imagem de compartilhamento gerada (`public/og-image.png`), `robots.ts`,
  `sitemap.ts`.
- Deploy em produção documentado e automatizado — ver [_docs/deploy.md](_docs/deploy.md)
  e `deploy.ps1` (container Docker isolado no mesmo servidor de outros projetos da
  campanha, atrás de proxy Caddy com HTTPS automático).

## Onde estão os 8 templates

`public/templates/template-1.png` a `template-8.png` — PNGs com um "buraco" central
transparente onde a foto do usuário aparece por trás.
