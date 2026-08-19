# Eu Apoio — Um vice pra chamar Dirceu

PWA mobile-first que gera artes de apoio a candidato. O usuário escolhe uma moldura, encaixa a
própria foto dentro dela, ajusta zoom/rotação/filtros, adiciona texto e compartilha.

**No ar em**: https://eu-apoio.dirceutencaten.com.br

## Rodando localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript + Tailwind CSS
- Composição de imagem via `<canvas>` (sem backend — tudo roda no navegador)
- PWA: manifest, ícones, service worker

## Documentação

Um resumo completo do sistema (fluxo de uso, o que já está pronto, onde fica cada peça) está em
[AGENTS.md](AGENTS.md).

O passo a passo de deploy em produção (servidor, Docker, proxy) está em
[_docs/deploy.md](_docs/deploy.md).
