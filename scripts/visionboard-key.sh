#!/bin/sh
# Klíč pro podpis licencí Vision Boardu.
#
# Spouští se na serveru, v adresáři aplikace:
#
#   sh scripts/visionboard-key.sh
#
# Udělá všechno najednou: vygeneruje pár Ed25519, zapíše soukromou část
# do .env a vypíše veřejnou, která patří do Vision Boardu.
#
# Soukromý klíč se schválně nikam nevypisuje. Co se objeví na obrazovce,
# to se jednou zkopíruje i tam, kam nemá. Potřebuješ-li zálohu, stáhni
# si rovnou soubor: scp root@server:/opt/almostthere/visionboard-license.pem .
#
# Spustit znovu je bezpečné jen dokud se klíčem nepodepsaly licence —
# nový klíč zneplatní všechny vydané. Skript se proto ptá.

set -eu

PEM=visionboard-license.pem
ENV=.env
KID=at-$(date +%Y)-1

if [ ! -f "$ENV" ]; then
  echo "Tady není .env — spusť to v adresáři aplikace (/opt/almostthere)." >&2
  exit 1
fi

if [ -f "$PEM" ]; then
  echo "Klíč $PEM už existuje."
  echo "Nový zneplatní všechny licence, které jsou tím starým podepsané."
  printf "Opravdu vyrobit nový? [napiš ano]: "
  read -r answer
  [ "$answer" = "ano" ] || { echo "Nic se nezměnilo."; exit 0; }
  cp "$PEM" "$PEM.$(date +%Y%m%d%H%M%S).bak"
fi

openssl genpkey -algorithm ed25519 -out "$PEM"
chmod 600 "$PEM"

KEY=$(base64 -w0 "$PEM")

if grep -q '^VISIONBOARD_LICENSE_PRIVATE_KEY=' "$ENV"; then
  sed -i "s|^VISIONBOARD_LICENSE_PRIVATE_KEY=.*|VISIONBOARD_LICENSE_PRIVATE_KEY=$KEY|" "$ENV"
else
  echo "VISIONBOARD_LICENSE_PRIVATE_KEY=$KEY" >>"$ENV"
fi

if grep -q '^VISIONBOARD_LICENSE_KID=' "$ENV"; then
  sed -i "s|^VISIONBOARD_LICENSE_KID=.*|VISIONBOARD_LICENSE_KID=$KID|" "$ENV"
else
  echo "VISIONBOARD_LICENSE_KID=$KID" >>"$ENV"
fi

unset KEY

echo
echo "Hotovo. Klíč je v $ENV, označení $KID."
echo
echo "── Tohle patří do Vision Boardu (veřejné, dá se poslat) ──"
echo "kid: $KID"
openssl pkey -in "$PEM" -pubout
echo "─────────────────────────────────────────────────────────"
echo
echo "Zálohu souboru $PEM si stáhni do správce hesel."
echo "Pak nasaď: docker compose up -d --build"
