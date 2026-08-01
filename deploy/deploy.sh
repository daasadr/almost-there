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
docker compose build

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
