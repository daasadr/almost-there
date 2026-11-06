# Proposal

## Why

Předplatné je pro část lidí překážka sama o sobě — ne cenou, ale tím,
že je pravidelné. Jednorázová platba projde i tam, kde měsíční
závazek ne, a v Česku to platí dvojnásob.

Nabídnout se dá to, co aplikace stejně umí: z cíle a termínu udělat
rozfázovaný plán. Jen místo odškrtávání v aplikaci vznikne PDF
k vytištění, se zaškrtávátky, které si člověk pověsí na zeď.

Zároveň je to cesta k předplatnému, ne jeho konkurence. Kdo si PDF
koupí a vyhovuje mu, dostane nabídku mít totéž živé — s připomínkami
a s přepočítáním, když se cesta rozejde se skutečností.

Rozhodnutí Dagmar z 6. 11. 2026:

- **Platí se předem**, na stránce šablony je ukázková strana PDF
  a osnova fází jako text. Model se volá až po zaplacení.
- **V PDF jsou týdny i denní úkoly.** Samotné týdenní milníky si
  člověk udělá sám a nekoupil by je.
- **Nákup založí záznam v seznamu cílů** jako informaci, ne jako
  běžící cíl.

## What Changes

- Model `PdfPlan`: zadání, zaplacení, vygenerovaný plán, stav.
  Text je šifrovaný jako obsah cílů.
- Stránka s šablonami pro časté situace (maturita, přijímačky,
  půlmaraton…) a možnost vlastního zadání.
- Cena podle počtu týdnů.
- Platba přes Stripe Checkout v režimu `payment`, ne `subscription`.
- Generování po zaplacení: týdny a k nim denní úkoly.
- Sazba PDF (A4, zaškrtávátka, tisknutelné) a stažení.
- Záznam v seznamu cílů, bez odškrtávání a bez přepočítávání.
- Při návratu nabídka převést plán do aplikace — bez generování znovu.
- Tlačítko na úvodní stránce pod předplatným.

## Non-goals

- Převod existujícího běžícího cíle do PDF. Jiná funkce, jiná cena.
- Tisk a zaslání poštou.
- Úpravy PDF po zakoupení. Je to snímek plánu; kdo chce měnit,
  má si předplatit aplikaci — právě v tom je rozdíl.
- Platba bez účtu. Bez něj se nedá doručit, znovu stáhnout ani
  nabídnout převedení.
