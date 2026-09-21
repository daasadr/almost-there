#!/usr/bin/env bash
# Hlídač dostupnosti. Ťuká na /api/health a když se aplikace neozve,
# pošle e-mail.
#
# Do cronu každých pět minut:
#   */5 * * * * cd /opt/almostthere && ./deploy/watch.sh >> /var/log/almostthere-watch.log 2>&1
#
# Běží na stejném serveru jako aplikace, takže neodhalí výpadek celého
# stroje ani sítě — od toho je služba zvenčí, třeba UptimeRobot. Odhalí
# ale ten případ, který se stává nejčastěji: server jede, nginx jede,
# a spadlý je kontejner s aplikací.

# Schválně bez -e: neúspěšný curl je tady normální stav, který se
# zpracovává, ne důvod skript ukončit.
set -uo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "Chybí .env." >&2
  exit 1
fi

# shellcheck disable=SC1091
set -a; source .env; set +a

URL="${NEXT_PUBLIC_APP_URL:-}"
if [ -z "$URL" ]; then
  echo "Chybí NEXT_PUBLIC_APP_URL v .env." >&2
  exit 1
fi

# Komu hlásit. Když to není vyplněné zvlášť, vezme se první správce.
TO="${ALERT_EMAIL:-}"
if [ -z "$TO" ]; then
  TO="$(echo "${ADMIN_EMAILS:-}" | cut -d, -f1 | tr -d '[:space:]')"
fi

STATE="${WATCH_STATE_FILE:-/var/tmp/almostthere-watch.state}"
LOCK="/var/tmp/almostthere-deploy.lock"
NOW="$(date '+%Y-%m-%d %H:%M:%S')"

# Během nasazování se mlčí. Bez tohohle by každé nasazení poslalo planý
# poplach — a na planý poplach si člověk zvykne tak, že pak přehlédne
# i ten pravý.
#
# Zámek se ignoruje, když je starší než čtyři hodiny: nasazení, které
# spadlo dřív, než po sobě uklidilo, by jinak hlídače umlčelo navždy.
if [ -f "$LOCK" ] && [ -z "$(find "$LOCK" -mmin +240 2>/dev/null)" ]; then
  echo "$NOW  přeskakuji, běží nasazení"
  exit 0
fi

# Tři pokusy s odstupem. Jeden neúspěch nic neznamená — stačí, aby se
# zrovna trefil do restartu kontejneru.
CODE=""
for attempt in 1 2 3; do
  CODE="$(curl -s -o /dev/null -m 15 -w '%{http_code}' "$URL/api/health")"
  if [ "$CODE" = "200" ]; then
    break
  fi
  if [ "$attempt" -lt 3 ]; then
    sleep 20
  fi
done

if [ "$CODE" = "200" ]; then
  NOWSTATE="up"
else
  NOWSTATE="down"
fi

PREV="up"
if [ -f "$STATE" ]; then
  PREV="$(cat "$STATE")"
fi

echo "$NOW  $NOWSTATE (http $CODE)"

# Hlásí se jen změna stavu, ne každé ťuknutí. Při hodinovém výpadku
# přijde jeden e-mail na začátku a jeden na konci, ne dvanáct.
if [ "$NOWSTATE" = "$PREV" ]; then
  exit 0
fi

echo "$NOWSTATE" > "$STATE"

if [ -z "$TO" ] || [ -z "${RESEND_API_KEY:-}" ]; then
  echo "$NOW  stav se změnil na $NOWSTATE, ale nemám kam poslat e-mail (ALERT_EMAIL nebo RESEND_API_KEY)" >&2
  exit 0
fi

if [ "$NOWSTATE" = "down" ]; then
  SUBJECT="AlmostThere neodpovídá"
  BODY="Aplikace na $URL neodpovídá. Poslední návratový kód: $CODE. Čas: $NOW. Zkontroluj: docker compose ps a docker compose logs --tail=100 app"
else
  SUBJECT="AlmostThere zase jede"
  BODY="Aplikace na $URL zase odpovídá. Čas: $NOW."
fi

PAYLOAD="$(mktemp)"
trap 'rm -f "$PAYLOAD"' EXIT

cat > "$PAYLOAD" <<JSON
{
  "from": "${EMAIL_FROM:-AlmostThere <noreply@almost-there.eu>}",
  "to": ["$TO"],
  "subject": "$SUBJECT",
  "text": "$BODY"
}
JSON

if curl -fsS -m 20 -o /dev/null -X POST https://api.resend.com/emails -H "Authorization: Bearer $RESEND_API_KEY" -H "Content-Type: application/json" -d @"$PAYLOAD"; then
  echo "$NOW  odeslán e-mail: $SUBJECT"
else
  echo "$NOW  e-mail se nepodařilo odeslat" >&2
fi
