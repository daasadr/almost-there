# Proposal

## Why

Aplikaci dnes používá hrstka lidí a všechno, co nefunguje, hlásí Dagmar
sama — protože je zároveň autorka i uživatelka. S každým dalším
uživatelem tenhle kanál přestává stačit: člověk, kterému se něco
nepovede, aplikaci zavře a nikdy se nedozvíme proč.

Nejde jen o pády. Nejčastější důvod, proč lidé odejdou, je ovládání,
které se chová jinak, než čekali — a to v žádném logu není. Zachytit se
to dá jedině tak, že se zeptáme a dáme tomu místo.

Rozhodnutí Dagmar z 28. 10. 2026: tlačítko patří na účet, kde už jsou
nastavení a technické věci. Nenápadné, ale poznatelné a k nalezení.
Z formulace musí být zřejmé, že se hlásí i nešikovné ovládání, ne jen
závady.

## What Changes

- Model `Feedback`: text hlášení, kde vzniklo, kdo ho poslal, stav.
  Text je šifrovaný stejně jako obsah cílů — je to volné psaní
  uživatele a může v něm být cokoliv.
- Formulář na stránce účtu. Žádná povinná kategorie: kdo má problém,
  nemá ho ještě třídit.
- Ke každému hlášení se tiše připojí, odkud přišlo (adresa stránky,
  jazyk, zda jde o aplikaci z obchodu). Bez toho se „nefunguje mi to"
  nedá dohledat.
- Oznámení správci e-mailem — **bez obsahu hlášení**, jen že přišlo
  a odkaz. Obsah je šifrovaný schválně a do schránky nepatří.
- Výpis hlášení ve správě, se stavem (nové / vyřízené).
- Omezení četnosti, ať se z toho nestane cesta, jak zaplnit databázi.

## Non-goals

- Odpovídání uživateli z aplikace. Dagmar má e-mail a účtů je zatím
  málo; vlastní poštovní schránku v aplikaci teď nestavíme.
- Přikládání snímků obrazovky. Zvedlo by to úložiště i právní otázky
  a text zatím stačí.
- Hlášení bez přihlášení. Veřejný formulář je terč pro roboty a lidé
  bez účtu nemají co hlásit.
- Automatický sběr chyb z prohlížeče. Jiná věc, jiné rozhodnutí
  o soukromí.
