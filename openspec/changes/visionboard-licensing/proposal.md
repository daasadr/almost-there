# Proposal

## Why

Vision Board je samostatná desktopová aplikace (repo `daasadr/vision-board`),
kterou si uživatel aktivuje účtem AlmostThere. Strana aplikace je rozpracovaná:
ověřování licence a PKCE jsou hotové, dokud ale v ní není produkční veřejný
klíč, licence se nevynucují a všechno je odemčené. Chybí celá strana webu.

Rozhodnutí Dagmar z 12. 10. 2026: **licenci dostane každý registrovaný
uživatel**, ne jen platící. Vision Board tedy není odměna za předplatné, ale
důvod, proč si účet založit. K tomu má každý osobní pozvánku, kterou může
poslat komukoli a kolikrát chce; pozvaný se zaregistruje a dostane licenci
stejně jako kdokoli jiný. Smysl je přivést nové registrované — a z nich
možné platící.

Zdroj pravdy pro rozhraní je kontrakt `docs/visionboard-api.md` (kopie
z repa Vision Boardu). Nemění se jednostranně.

## What Changes

- Evidence licencí a instalací: kdo smí aktivovat, na kolika zařízeních,
  a možnost zařízení uvolnit.
- Stránka `/visionboard/activate`: aktivace přes přihlášený účet, výdej
  jednorázového kódu, návrat do aplikace deep linkem.
- API `/api/visionboard/v1/licenses`, `/renew`, `/deactivate` — výměna kódu
  za podepsanou licenci, obnova, deaktivace.
- Podepisování licencí (JWT, EdDSA/Ed25519) klíčem z prostředí serveru.
- Pozvánky: osobní odkaz s `ref`, veřejná stránka `/visionboard`, evidence
  toho, kdo koho pozval.
- Stránka ke stažení aplikace podle GitHub Releases.

## Non-goals

- **Změny v repu Vision Boardu.** Je jen ke čtení; vyvíjí ho jiné sezení
  a souběžné zásahy by se střetly.
- **Platby za Vision Board.** Licence je zdarma ke každému účtu a tenhle
  model se tu nezpochybňuje.
- **Synchronizace nástěnky s účtem.** Data nástěnky zůstávají v aplikaci.
- **Odměny za pozvané.** Ukládá se, kdo koho pozval, ale nic se za to
  zatím nedává.
- **Vynucení licencí.** Zapne ho až vydání aplikace s produkčním veřejným
  klíčem, tedy druhá strana. Do té doby je web nasaditelný bez rizika, že
  někomu něco zamkne.

## Capabilities

### New Capabilities

- `visionboard-license` — kdo má licenci, evidence instalací, limit zařízení,
  přehled „Moje zařízení".
- `visionboard-activation` — stránka aktivace, aktivační kód, PKCE, návrat
  do aplikace.
- `visionboard-api` — tři koncové body a jejich chybové stavy.
- `visionboard-invite` — osobní pozvánka, veřejná stránka, evidence pozvání.
- `visionboard-download` — stránka ke stažení podle GitHub Releases.
