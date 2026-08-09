#!/usr/bin/env bash
# Obnovení ze zálohy.
#
#   ./deploy/restore.sh /var/backups/almostthere/db-20260810-031000.sql.gz.enc
#
# Zálohu, kterou jsi nikdy nezkusila obnovit, nemáš. Vyzkoušej si tohle
# nanečisto dřív, než to budeš potřebovat doopravdy.

set -euo pipefail

cd "$(dirname "$0")/.."

ARCHIVE="${1:-}"
if [ -z "$ARCHIVE" ] || [ ! -f "$ARCHIVE" ]; then
  echo "Použití: ./deploy/restore.sh <soubor zálohy>" >&2
  exit 1
fi

# shellcheck disable=SC1091
set -a; source .env; set +a

if [ -z "${BACKUP_PASSPHRASE:-}" ]; then
  echo "Chybí BACKUP_PASSPHRASE v .env." >&2
  exit 1
fi

case "$ARCHIVE" in
  *uploads-*)
    echo "==> Obnovuji nahrané obrázky do svazku almostthere_uploads"
    echo "    Současný obsah svazku zůstane; stejné soubory se přepíšou."
    read -r -p "Pokračovat? [ano/ne] " answer
    [ "$answer" = "ano" ] || exit 1

    openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 \
      -pass env:BACKUP_PASSPHRASE -in "$ARCHIVE" \
      | docker run --rm -i -v almostthere_uploads:/data alpine tar -xz -C /data
    ;;

  *)
    echo "==> Obnovuji databázi z $ARCHIVE"
    echo "    POZOR: současný obsah databáze bude přepsán."
    read -r -p "Napiš 'prepsat' pro pokračování: " answer
    [ "$answer" = "prepsat" ] || exit 1

    # Aplikace se zastaví, aby do databáze během obnovy nikdo nepsal.
    docker compose stop app

    openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 \
      -pass env:BACKUP_PASSPHRASE -in "$ARCHIVE" \
      | gunzip \
      | docker compose exec -T db psql \
          -U "${POSTGRES_USER:-almostthere}" \
          -d "${POSTGRES_DB:-almostthere}"

    docker compose start app
    ;;
esac

echo "==> Hotovo"
echo
echo "Připomínka: obsah cílů je v databázi zašifrovaný klíčem ENCRYPTION_KEY."
echo "Bez toho SAMÉHO klíče, jaký byl v době zálohy, zůstane nečitelný."
