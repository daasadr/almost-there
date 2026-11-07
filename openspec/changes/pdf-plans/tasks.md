# Tasks

## 1. Základy

- [x] 1.1 Model `PdfPlan` + stavy (čeká na platbu / zaplaceno /
      generuje se / hotovo / selhalo), vazba na uživatele, šifrovaná
      pole. Ruční migrace, ověřit proti `prisma migrate diff`.
- [x] 1.2 Šablony pro časté situace v `src/content/pdf-plans/`:
      název, osnova fází, výchozí délka, pokyny pro model. Texty
      cs/en/de. Ověřit: test, že má každá šablona všechny jazyky.
- [x] 1.3 Ceník podle počtu týdnů jako čistá funkce. Ověřit: testy
      hranic 4/8/12 a odmítnutí nad 12.

## 2. Platba

- [x] 2.1 Stripe Checkout v režimu `payment`. Ověřit: test, že se
      cena počítá na serveru a nebere se z těla požadavku.
- [x] 2.2 Zpracování `checkout.session.completed` pro jednorázovou
      platbu — odlišit od předplatného, které týž koncový bod už
      zpracovává. Ověřit: test obou větví.
- [x] 2.3 Souhlas s okamžitým dodáním: povinné zaškrtávátko před
      platbou, uloží se s datem. Ověřit: test, že bez něj platba
      nezačne.

## 3. Plán a PDF

- [x] 3.1 Generování po zaplacení, po kolech jako rozpad cíle.
      Ověřit: test, že se nedokončené generování dá bezpečně
      zopakovat a nevznikne plán dvakrát.
- [x] 3.2 Sazba PDF: A4, zaškrtávátka, týdny a dny, hlavička
      s cílem a termínem, patička s adresou. Ověřit: test, že
      hotový soubor obsahuje vložené písmo a zadaný český text.
- [x] 3.3 Stažení: jen vlastníkovi, opakovaně. Ověřit: test, že
      cizí účet dostane 404.

## 4. Obrazovky

- [x] 4.1 Rozcestník šablon a formulář vlastního zadání, s ukázkou
      a cenou. Texty cs/en/de, čeština bezrodá.
- [x] 4.2 Tlačítko na úvodní stránce pod předplatným.
- [x] 4.3 Záznam v seznamu cílů jako oddělená část, s odkazem na
      stažení a s nabídkou převést plán do aplikace.
- [x] 4.4 Převod na skutečný cíl po předplacení, bez volání modelu.
      Ověřit: test, že vzniklý cíl odpovídá uloženému plánu.

## 5. Dokončení

- [ ] 5.1 Review bezpečnosti: cena a počet týdnů ze serveru,
      oprávnění u stažení, podvržený webhook, únik obsahu plánu.
- [ ] 5.2 Stránky pro časté situace kvůli vyhledávání (maturita,
      přijímačky, půlmaraton) + mapa stránek.
- [ ] 5.3 Archivace změny.
