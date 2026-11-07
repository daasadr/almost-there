# Proposal

## Why

Na web přijde člověk, prohlédne si ho a odejde, aniž by našel to, co
by mu pomohlo. Nejčastěji demo: je zdarma, nevyžaduje účet a je to
jediné místo, kde si aplikaci opravdu osahá — jenže kdo doroluje na
konec úvodní stránky, často na něj vůbec nenarazí.

Navádění je tichá nápověda, která se ukáže **jen tomu, kdo hledá
a nenachází**, a sama zhasne. Ne vyskakovací okno, ne odpočet, ne
„ještě neodcházejte".

Postup a pasti popisuje `navadeni-pro-jine-projekty.md` od Dagmar,
z jiného projektu v provozu.

## What Changes

- Stavový automat návštěvy (příchod → rozhlíží se → hledá → čte)
  a pravidla v jednom souboru, oddělená od DOM i od vzhledu.
- Jedna nápověda: tenký prstenec kolem cíle, dvakrát objede a zhasne.
- Vlastní barva `--color-guide`, která na webu nic jiného neznamená,
  ve všech šesti motivech.
- Vyhodnocení přes Umami, které už běží — žádná druhá analytika.
- Zmínka v zásadách soukromí: sleduje se chování na stránce.

## Non-goals

- **Navádění k platbě.** Pobízet ke koupi někoho, kdo si jen čte, je
  nátlak, ne pomoc. Zakázané cíle jsou v kódu vyjmenované a test je
  porovnává s tím, co o tom píšeme v zásadách.
- **Navádění uvnitř aplikace.** Za přihlášením je soukromá práce na
  vlastních cílech; `Analytics.tsx` tam schválně neměří a navádění,
  které se nedá vyhodnotit, se ladí od oka.
- Model, který se učí. Pět pravidel, na která je vidět, je zatím lepší
  než váhy, kterým nikdo nerozumí.
- Vlastní analytika. Umami splňuje totéž a je nasazená.
