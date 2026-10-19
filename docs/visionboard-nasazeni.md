# Nasazení licencí Vision Boardu

Jednorázový postup. Až tohle proběhne, aktivace z aplikace začne
fungovat; do té doby vrací `/api/visionboard/v1/licenses` chybu
o chybějícím klíči a zbytek webu běží normálně dál.

Dělá se **na serveru**, v `/opt/almostthere`.

## 1. Migrace

V nasazení čeká pět migrací: `finalChallenge` s odměnou, `templateId`,
`motivationSent`, index `Milestone_timeBlockId_idx` a `visionboard_licensing`.
Jedou samy kontejnerem `migrate` při `docker compose up`.

## 2. Klíč

```sh
cd /opt/almostthere
openssl genpkey -algorithm ed25519 -out visionboard-license.pem
chmod 600 visionboard-license.pem

# zapíše klíč rovnou do .env, aniž by se vypsal na obrazovku
KEY=$(base64 -w0 visionboard-license.pem)
if grep -q '^VISIONBOARD_LICENSE_PRIVATE_KEY=' .env; then
  sed -i "s|^VISIONBOARD_LICENSE_PRIVATE_KEY=.*|VISIONBOARD_LICENSE_PRIVATE_KEY=$KEY|" .env
else
  echo "VISIONBOARD_LICENSE_PRIVATE_KEY=$KEY" >> .env
fi
unset KEY

grep -q '^VISIONBOARD_LICENSE_KID=' .env || echo 'VISIONBOARD_LICENSE_KID=at-2026-1' >> .env
```

**Klíč se schválně nikam nevypisuje.** Co se objeví na obrazovce, to se
dá zkopírovat — a pak se jednou zkopíruje i tam, kam nemá, třeba do
chatu nebo do hlášení chyby. Kdyby se to přesto stalo, stačí celý
oddíl 2 spustit znovu; dokud jím nejsou podepsané licence, výměna nic
nestojí.

Kontrola, že se zápis povedl (vypíše `1`, ne klíč):

```sh
grep -c '^VISIONBOARD_LICENSE_PRIVATE_KEY=.\{100,\}' .env
```

Base64 proto, že PEM má tři řádky a Docker Compose čte `.env` po
řádcích — víceřádkovou hodnotu by uřízl na první a klíč by se rozbil
až při prvním podpisu licence, ne při startu.

### Zálohovat

Soubor `visionboard-license.pem` patří do správce hesel, mimo server.
Stáhni ho z notebooku (`scp root@server:/opt/almostthere/visionboard-license.pem .`),
vlož obsah do správce hesel a stažený soubor smaž. Ne přes chat, ne
e-mailem.

Kdyby se ztratil a vygeneroval se nový, **všechny vydané licence
přestanou platit** — aplikace je ověřuje offline vestavěným veřejným
klíčem a o výměně se nemá jak dozvědět. Stejná kategorie jako
`ENCRYPTION_KEY`.

## 3. Veřejný klíč do Vision Boardu

```sh
openssl pkey -in visionboard-license.pem -pubout
```

Výpis (tři řádky, `-----BEGIN PUBLIC KEY-----` …) spolu s `kid`
`at-2026-1` patří do Vision Boardu — kontrakt, oddíl 5. Veřejný klíč
není tajemství, dá se poslat čímkoliv.

Soukromý klíč **nikdy nikam neposílej**, ani do chatu, ani do commitu.

## 4. Nasadit a ověřit

```sh
docker compose up -d --build
```

Nikdy ne `docker compose down -v` ani `docker volume prune` — smazalo
by to databázi.

Pak:

1. `https://almost-there.eu/cs/visionboard` — stránka se ukáže,
   obrázky se načtou.
2. `https://almost-there.eu/cs/visionboard/download` — tlačítko vede
   na GitHub Releases.
3. V aplikaci Nastavení → Licence → Aktivovat: otevře se prohlížeč,
   přihlášení, návrat do aplikace, licence platná rok.
4. Na Extra se pod pozvánkou objeví zařízení.

## 5. Rotace klíče, až bude potřeba

Nový klíč, nový `kid` (`at-2027-1`). Vision Board musí znát oba, než
se starý vyřadí, jinak zneplatníš licence všem, kdo si zatím
nestáhli novou verzi. Platnost je rok, takže starý klíč musí přežít
aspoň rok po poslední vydané licenci.
