# Vícefázový build: výsledný image obsahuje jen to, co appka potřebuje běžet.
# Next.js je nastavený na `output: "standalone"`, takže poslední fáze nemá
# node_modules ani zdrojáky — jen server.js a jeho závislosti.

FROM node:22-alpine AS base
# Alpine potřebuje libc6-compat, aby fungovaly nativní binárky Next.js
RUN apk add --no-cache libc6-compat
WORKDIR /app

# --- Závislosti ---------------------------------------------------------
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci

# --- Build --------------------------------------------------------------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* proměnné se zapékají do klientského bundlu při buildu,
# takže je nestačí nastavit až za běhu.
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# --- Běh ----------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Aplikace nemá důvod běžet pod rootem
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Složka pro nahrané obrázky musí v image existovat a patřit aplikaci.
# Docker při připojení svazku převezme vlastníka z image; bez tohohle by
# svazek patřil rootovi a aplikace by do něj nesměla zapisovat.
RUN mkdir -p /app/uploads && chown nextjs:nodejs /app/uploads

USER nextjs
EXPOSE 3000

# Healthcheck ověřuje, že appka opravdu odpovídá, ne jen že proces běží
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/en').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
