# Tasks

Úkol v Beads: `at-1ar`.

## 1. Důkazy o hotové práci do přeplánování

- [x] `replan.ts` čte dosažené milníky, posledních 12 odškrtaných úkolů
      a datum založení cíle a posílá je v `ReplanContext`.
- [x] Ověření: přeplánování cíle s odškrtanou historií má v zadání
      názvy milníků i úkolů (test nad `buildUserPrompt`).

## 2. Pravidlo „hotové se neplánuje"

- [x] `buildReplanBlock` začíná tím, že jde o rozdělaný cíl, a zakazuje
      naplánovat znovu, co je hotové.
- [x] Doplnit do systémového promptu odstavec o pokračování cesty.
- [x] Ověření: test hlídá, že pravidlo i seznamy v zadání jsou.

## 3. Zarámování pokynu a výchozího bodu

- [x] Při přeplánování se k pokynu ze šablony přidá věta o oblouku od
      začátku.
- [x] Při přeplánování se `startingPoint` označí za stav při založení
      cíle i s datem.
- [x] Ověření: test porovná zadání pro první rozpad a pro přeplánování
      — zarámování je jen ve druhém.

## 4. Dosažené milníky do nižších úrovní

- [x] `GoalContext` nese dosažené milníky, `planner.ts` je dodá.
- [x] `expand.ts` je vypíše do zadání pro týdny i dny.
- [x] Ověření: test nad sestaveným zadáním.

## 5. Dokumentace šablon

- [x] Do `src/content/templates/index.ts` pravidlo, že se pokyn používá
      i při přeplánování a píše se jako pořadí, ne jako kalendář.
- [x] Projít všechny pokyny a vypsat, které předepisují začátek:
      `first-ten-customers`, `side-business`, `half-marathon`,
      `healthy-weight`, `home-transformation`, `vibecoder-to-coder`,
      `drawing-boost` — sedm z deseti. Texty zůstávají, rámuje je
      `buildUserPrompt`.

## 6. Uzavření

- [x] `npm run check` prochází.
- [x] Odchylky od návrhu zapsané v `design.md`.
