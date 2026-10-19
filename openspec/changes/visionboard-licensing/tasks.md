# Tasks

## 1. Základ

- [x] 1.1 Datový model: `VisionBoardInstallation`, `VisionBoardActivationCode`,
      `User.visionBoardRef`, `User.invitedById`. Migrace.
      Ověřit: `npm run check` a `npx prisma migrate deploy` na čisté databázi.
- [x] 1.2 Podepisování licencí (`jose`, EdDSA), klíč a `kid` z prostředí.
      Ověřit: test proti vektorům z oddílu 9 kontraktu — token se znak po
      znaku shoduje; cizí `alg`, `none` a upravený payload neprojdou.
- [x] 1.3 Vydání a ověření aktivačního kódu (abeceda, 12 znaků, otisk,
      10 minut, jednorázovost, zneplatnění i po špatném verifieru).
      Ověřit: unit testy včetně druhého pokusu se stejným kódem.

## 2. API

- [x] 2.1 `POST /api/visionboard/v1/licenses`: výměna kódu, kontrola PKCE,
      limit 3 zařízení, znovuaktivace téhož `installationId`.
      Ověřit: testy všech chybových kódů z oddílu 3.4 kontraktu.
- [x] 2.2 Omezení pokusů na `/licenses` (10 za minutu z IP, `429 rate_limited`).
      Ověřit: test, že jedenáctý požadavek v minutě dostane 429.
- [x] 2.3 `POST /licenses/renew` a `POST /licenses/deactivate`.
      Ověřit: testy — prošlá licence do 90 dní projde, deaktivovaná vrátí
      `403 revoked`, cizí podpis `400 invalid_license`, druhá deaktivace `204`.

## 3. Stránky

- [x] 3.1 `/visionboard/activate`: validace `challenge` a `state`, zachování
      parametrů přes přihlášení i registraci, potvrzení POSTem, zobrazení
      kódu, přesměrování na pevné `visionboard://activate`. Texty cs/en/de.
      Ověřit: e2e — nepřihlášený projde registrací a vrátí se se stejnými
      parametry; samotné otevření stránky kód nevydá.
- [x] 3.2 Oddíl Vision Boardu na Extra: moje zařízení (platforma, datum,
      odebrat). Texty cs/en/de. Ověřit: e2e — po odebrání se uvolní místo.
- [x] 3.3 Tamtéž pozvánka: trvalý odkaz, kopírovat a sdílet, počet
      přijatých. Texty cs/en/de. Ověřit: e2e — odkaz je podruhé stejný.
- [x] 3.4 Uložení zvoucího při registraci přes `ref`; neznámý `ref` se
      ignoruje. Ověřit: testy obou případů, včetně toho, že registrace
      s podvrženým `ref` projde.
- [ ] 3.5 Veřejná stránka `/visionboard`: co to je, ukázky, výzva
      k registraci, odkaz ke stažení. Texty cs/en/de, náhledový obrázek,
      strukturovaná data, do mapy stránek. **Čeká na texty a snímky
      obrazovky od Dagmar.**
- [ ] 3.6 Stránka ke stažení podle GitHub Releases, cache aspoň hodinu,
      záložní odkaz při výpadku. Ověřit: test, že při selhání API se ukáže
      trvalý odkaz a ne chyba.

## 4. Dokončení

- [ ] 4.1 Review bezpečnosti: projít diff proti hrozbám z oddílu 8 kontraktu
      a oddílu „Review bezpečnosti" v CLAUDE.md. Nálezy opravit, přijatá
      rizika zapsat do `design.md`.
- [ ] 4.2 Vygenerovat produkční pár klíčů Ed25519 **na serveru**, soukromý
      do prostředí a do správce hesel, veřejný a `kid` předat Dagmar pro
      Vision Board. Ověřit: licence vydaná produkčním klíčem projde ověřením
      veřejným klíčem.
- [ ] 4.3 Archivace změny (`/opsx:archive`), požadavky do `openspec/specs/`.
