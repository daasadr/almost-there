#!/usr/bin/env bash
# Nasazení nové verze na server. Spouštěj na VPS z adresáře projektu:
#   ./deploy/deploy.sh
#
# Předpoklad: repozitář je naklonovaný, vedle docker-compose.yml leží .env
# s vyplněnými hodnotami a nginx už je nakonfigurovaný.

set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "Chybí .env. Zkopíruj .env.example do .env a doplň hodnoty." >&2
  exit 1
fi

# Na kterém portu appka poslouchá — musí sedět s APP_PORT v .env,
# jinak by kontrola níž ťukala na cizí projekt.
APP_PORT="$(grep -E '^APP_PORT=' .env | cut -d= -f2 | tr -d '[:space:]')"
APP_PORT="${APP_PORT:-3000}"

echo "==> Stahuji změny z gitu"
git pull --ff-only

echo "==> Sestavuji image"
# `migrate` se vyjmenovává schválně. Je v profilu `tools`, a služby
# z neaktivních profilů `docker compose build` bez vyjmenování přeskočí.
# Následné `run` by pak použilo starý image, ve kterém nové migrace ještě
# nejsou — a nová verze aplikace by běžela nad starým schématem.
docker compose build app migrate

echo "==> Spouštím databázi"
docker compose up -d db

echo "==> Aplikuji migrace databáze"
# Běží před startem aplikace — kdyby appka naběhla dřív než schéma,
# první požadavky by spadly na chybějící sloupce.
docker compose run --rm migrate

# Kontrola navíc: `migrate deploy` umí skončit s nulou i tehdy, když se
# k databázi vůbec nedostane k tomu, co čekáme. Nová verze aplikace se
# nesmí rozjet nad starým schématem — projeví se to až u uživatele.
echo "==> Ověřuji, že schéma odpovídá kódu"
if ! docker compose run --rm migrate npx prisma migrate status; then
  echo "Databáze neodpovídá migracím. Aplikaci nespouštím." >&2
  exit 1
fi

echo "==> Spouštím novou verzi"
docker compose up -d

echo "==> Uklízím staré images"
docker image prune -f

echo "==> Čekám, až aplikace naběhne"
for i in $(seq 1 30); do
  if curl -fsS -o /dev/null "http://127.0.0.1:${APP_PORT}/en"; then
    echo "Hotovo — aplikace odpovídá."
    exit 0
  fi
  sleep 2
done

echo "Aplikace do 60 s neodpověděla. Zkontroluj: docker compose logs -f app" >&2
exit 1
