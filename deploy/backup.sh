#!/usr/bin/env bash
# Záloha databáze a nahraných obrázků.
#
# Spouštěj z adresáře projektu na serveru:
#   ./deploy/backup.sh
#
# Do cronu jednou denně v noci:
#   10 3 * * * cd /opt/almostthere && ./deploy/backup.sh >> /var/log/almostthere-backup.log 2>&1
#
# Zálohy jsou šifrované. Obsah cílů je sice zašifrovaný už v databázi,
# ale dump obsahuje i e-maily, otisky hesel a identifikátory plateb —
# a ty zašifrované nejsou, protože se podle nich vyhledává.

set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "Chybí .env." >&2
  exit 1
fi

# shellcheck disable=SC1091
set -a; source .env; set +a

if [ -z "${BACKUP_PASSPHRASE:-}" ]; then
  echo "Chybí BACKUP_PASSPHRASE v .env. Vygeneruj ji: openssl rand -base64 32" >&2
  echo "POZOR: bez téhle fráze zálohu nikdo neobnoví. Ulož si ji mimo server." >&2
  exit 1
fi

BACKUP_DIR="${BACKUP_DIR:-/var/backups/almostthere}"
KEEP_DAYS="${BACKUP_KEEP_DAYS:-14}"
STAMP="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

echo "==> Záloha databáze"
# pg_dump uvnitř kontejneru, výstup rovnou přes kompresi a šifrování.
# Nikde se tak neobjeví nezašifrovaný soubor, ani na chvíli.
docker compose exec -T db pg_dump \
  -U "${POSTGRES_USER:-almostthere}" \
  -d "${POSTGRES_DB:-almostthere}" \
  | gzip \
  | openssl enc -aes-256-cbc -pbkdf2 -iter 200000 -salt \
      -pass env:BACKUP_PASSPHRASE \
      -out "$BACKUP_DIR/db-$STAMP.sql.gz.enc"

echo "==> Záloha nahraných obrázků"
# Svazek se čte přes dočasný kontejner — na hostiteli k němu není cesta,
# která by se dala spolehlivě uhodnout.
docker run --rm \
  -v almostthere_uploads:/data:ro \
  alpine tar -cz -C /data . \
  | openssl enc -aes-256-cbc -pbkdf2 -iter 200000 -salt \
      -pass env:BACKUP_PASSPHRASE \
      -out "$BACKUP_DIR/uploads-$STAMP.tar.gz.enc"

chmod 600 "$BACKUP_DIR"/*.enc

echo "==> Mažu zálohy starší než $KEEP_DAYS dní"
find "$BACKUP_DIR" -name "*.enc" -type f -mtime "+$KEEP_DAYS" -delete

echo "==> Hotovo"
ls -lh "$BACKUP_DIR" | tail -6

# Kontrola, že záloha není podezřele malá. Prázdný dump vypadá jako
# úspěch, dokud ho nepotřebuješ.
SIZE=$(stat -c%s "$BACKUP_DIR/db-$STAMP.sql.gz.enc")
if [ "$SIZE" -lt 1024 ]; then
  echo "VAROVÁNÍ: záloha databáze má jen $SIZE B. Zkontroluj ji." >&2
  exit 1
fi
