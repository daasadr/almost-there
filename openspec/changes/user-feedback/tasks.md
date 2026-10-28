# Tasks

## 1. Datový model

- [x] 1.1 Model `Feedback` a výčet `FeedbackStatus` ve schématu, vazba na
      uživatele s `onDelete: Cascade`, index na `(status, createdAt)`.
      Ruční migrace. Ověřit: porovnat proti `prisma migrate diff`.
- [x] 1.2 Pole `message` do `ENCRYPTED_FIELDS`. Ověřit: test, že se
      uložený text v otevřené podobě ve sloupci neobjeví.

## 2. Příjem hlášení

- [x] 2.1 `POST /api/feedback`: přihlášení povinné, text 10–4000 znaků,
      kontext ze serveru (ne z těla), omezení pět za hodinu na účet.
      Ověřit: testy všech čtyř odmítnutí (nepřihlášený, krátký text,
      dlouhý text, překročená četnost) a toho, že podvržený `path`
      z těla se ignoruje.
- [x] 2.2 Oznámení správcům e-mailem bez obsahu hlášení. Selhání pošty
      nesmí shodit uložení. Ověřit: test, že při výjimce z pošty hlášení
      zůstane a odpověď je v pořádku.

## 3. Obrazovky

- [x] 3.1 Formulář na stránce účtu — nenápadný, ale poznatelný. Z nadpisu
      musí být zřejmé, že jde i o nešikovné ovládání. Texty cs/en/de,
      čeština bezrodá.
- [x] 3.2 Výpis ve správě: text, kontext, stav, označení za vyřízené.
      Jen pro správce. Česky, jako zbytek správy.

## 4. Dokončení

- [x] 4.1 Review bezpečnosti: neověřené vstupy, oprávnění u výpisu
      a u změny stavu, únik obsahu do e-mailu a do logů, omezení četnosti.
      Nález: hodnoty se lepily do HTML oznámení bez escapování — opraveno
      (`escapeHtml` v `lib/feedback/submit.ts`). Přijaté omezení: počítadlo
      četnosti je v paměti procesu, takže při víc instancích aplikace by
      strop platil na každou zvlášť — stejně jako u ostatních koncových
      bodů, běžíme v jednom kontejneru.
- [ ] 4.2 Archivace změny.
