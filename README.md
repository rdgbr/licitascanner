# LicitaScanner

> Monitore licitações públicas brasileiras em tempo real. Dados oficiais do PNCP.

Parte da **Rede Jurídico**: [Jurídico Online](https://juridicoonline.com.br) · [Jurídico em Pauta](https://juridicoempauta.com.br) · **LicitaScanner**

## Stack

- Next.js 16 (App Router, Tailwind v4)
- Prisma + Postgres 16
- Auth.js v5 (magic link via Mailgun)
- Cloudflare (DNS + CDN + cache)
- Docker compose
- Dados: [PNCP API](https://www.gov.br/pncp/) (100% pública, sem auth)

## Setup local

```bash
# 1. Install
npm install

# 2. Copy env e ajustar
cp .env.example .env
# editar DATABASE_URL, AUTH_SECRET, MAILGUN_API_KEY

# 3. DB migrations
npx prisma migrate dev --name init

# 4. Importar primeira leva
npm run import

# 5. Rodar dev
npm run dev
```

## Estrutura

```
src/
  app/                 # Next App Router pages
    page.tsx           # Home com stats + recentes
    layout.tsx         # Header + footer rede
    [uf]/              # /sp, /rj, ... (TODO)
    edital/[id]/       # detalhe (TODO)
    alertas/           # gated (TODO)
  lib/
    pncp.ts            # cliente PNCP API
    ufs.ts             # lista de UFs
    db.ts              # Prisma client
  components/          # UI compartilhada
prisma/
  schema.prisma        # Licitacao + ItemLicitacao + AlertaLicitacao + Auth
scripts/
  import_pncp.ts       # worker import (rodar via cron)
```

## Import via cron

```bash
# /etc/cron.d/licitascanner-import
# A cada hora
0 * * * * cd /app && /usr/local/bin/node --import tsx scripts/import_pncp.ts >> /var/log/licita-import.log 2>&1
```

## TODO próxima sessão

- [ ] Páginas `/[uf]`, `/[uf]/[municipio]`, `/edital/[id]`, `/categoria/[cnae]`
- [ ] Auth.js setup (copiar de `juridicoonline/src/auth.ts`)
- [ ] `/cadastro`, `/login`, `/alertas`
- [ ] Worker de envio de alertas
- [ ] Sitemap programático
- [ ] Schema.org Organization
- [ ] Dockerfile + docker-compose.yml
- [ ] GitHub Actions (build + deploy)

## Roadmap

Ver [`../juridicoonline/docs/EXPANSION_PLAN.md`](https://github.com/rdgbr/juridicoonline/blob/main/docs/EXPANSION_PLAN.md)
