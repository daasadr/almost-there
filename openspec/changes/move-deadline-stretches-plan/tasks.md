# Tasks

Úkol v Beads: `at-9pf`.

## 1. Roztažení zbytku plánu

- [x] `stretch.ts`: čistý výpočet nových dat období (`stretchRanges`).
- [x] `replan.ts`: posun termínu přepíše data období, milníky jdou
      s nimi, model se nevolá.
- [x] Když roztahovat není co, spadne se na dopsání modelem.
- [x] Ověření: testy v `stretch.test.ts` hlídají návaznost období,
      dotažení na nový termín a to, že se žádné období nezkrátí.

## 2. Volba, co s propadlou prací

- [x] `pace.ts` počítá, kolik úkolů z minulých dnů zůstalo nesplněných.
- [x] `replan.ts`: na přání vrátí propadlé úkoly po jednom na den,
      s vynecháním dnů odpočinku.
- [x] API bere `catchUpMissed`.
- [x] `PaceCheck` se před posunem termínu zeptá — jen když je na co.
- [x] Texty cs/en/de.
- [x] Ověření: testy rozložení v `stretch.test.ts`.

## 3. Uzavření

- [x] `npm run check` prochází (291 testů).
- [ ] Schválit změnu textu u „Přepočítat termín" ve třech jazycích.
- [ ] Po nasazení vyzkoušet na skutečném cíli.
