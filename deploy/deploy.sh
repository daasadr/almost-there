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

# Zámek, podle kterého hlídač dostupnosti pozná, že nedostupnost je
# naše práce, a nemá kvůli ní budit. Uklízí se i při chybě a při
# přerušení — zapomenutý zámek by hlídače umlčel.
LOCK="/var/tmp/almostthere-deploy.lock"
touch "$LOCK"
trap 'rm -f "$LOCK"' EXIT

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

# Databáze pro měření návštěvnosti.
#
# Postgres pouští inicializační skripty jen nad prázdným svazkem a náš je
# dávno plný, takže ji musíme založit sami. Podmínka je tu proto, aby to
# šlo pustit při každém nasazení a podruhé to neudělalo nic.
echo "==> Ověřuji databázi pro měření"
DB_USER="${POSTGRES_USER:-almostthere}"
if ! docker compose exec -T db psql -U "$DB_USER" -tAc   "SELECT 1 FROM pg_database WHERE datname='umami'" | grep -q 1; then
  echo "    zakládám databázi umami"
  docker compose exec -T db psql -U "$DB_USER" -c "CREATE DATABASE umami"
fi

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

# Cache z buildů si Docker drží donekonečna a na serveru s víc projekty
# z ní během měsíců narostou desítky gigabajtů. Týden je kompromis:
# běžné nasazení má cache pořád k dispozici, staré vrstvy odejdou.
docker builder prune -f --filter until=168h

echo "==> Čekám, až aplikace naběhne"
# Ptá se /api/health, který sahá i do databáze. Kdyby se čekalo na
# obyčejnou stránku, deploy by ohlásil „hotovo" i ve chvíli, kdy appka
# na databázi nedosáhne — a poznal by to až první uživatel.
for i in $(seq 1 30); do
  if curl -fsS -o /dev/null "http://127.0.0.1:${APP_PORT}/api/health"; then
    echo "Hotovo — aplikace odpovídá."
    exit 0
  fi
  sleep 2
done

echo "Aplikace do 60 s neodpověděla. Zkontroluj: docker compose logs -f app" >&2
exit 1
