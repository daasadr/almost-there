# Stripe a jednorázové plány v PDF

## Nejdřív to hlavní: produkty zakládat nemusíš

Předplatné a jednorázové plány se ve Stripu chovají jinak.

**Předplatné** používá hotové ceny z katalogu. Jejich ID jsou
v prostředí (`STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY`) a produkty
pro ně v Stripu existovat musí.

**Plány v PDF ne.** Cena se skládá při každém nákupu přímo
v požadavku (`price_data`), protože závisí na délce plánu a na jazyku
— to je devět kombinací, a kdyby byly v katalogu, musely by se ceny
udržovat na dvou místech. Dřív nebo později by se rozešly a zákazník
by u pokladny viděl jinou částku než na stránce.

Zdroj pravdy je tedy `src/lib/pdf-plans/pricing.ts`. Změna ceny je
změna v kódu a nasazení, ne klikání ve Stripu.

## Co ve Stripu ověřit

Tohle jsou tři věci, u kterých se nedá poznat dopředu, jestli je účet
má — a projeví se až prvním nákupem.

### 1. Povolené měny pro jednorázové platby

Ceny jsou v **CZK, USD a EUR** podle jazyka účtu. Každou z nich musí
účet umět přijmout, jinak Stripe relaci vůbec nevytvoří a zákazník
uvidí chybu místo pokladny.

Settings → Payments → najít, které měny jsou povolené. U předplatného
to funguje přes měnové varianty u hotových cen, takže z toho, že
předplatné jde, se na jednorázové platby usuzovat nedá.

### 2. Managed payments v režimu `payment`

Používá se `managed_payments: { enabled: true }`, tedy Stripe jako
právní prodejce. U předplatného to běží, ale ověř, že to platí
i pro jednorázové platby — s tím souvisí DPH i účtenky, které pak
Stripe řeší za tebe.

### 3. Webhook

Nic nového se nepřidává. Koncový bod už odebírá
`checkout.session.completed` kvůli předplatnému a tatáž událost
přichází i u jednorázových plateb; kód se rozhoduje podle režimu
relace (`payment` nebo `subscription`).

Developers → Webhooks → zkontrolovat, že `checkout.session.completed`
je mezi odebíranými událostmi. Pokud ano, hotovo.

## Ceny, jak jsou nastavené v kódu

Stejné částky pro obě podrobnosti, jen jinak rozdělené. Rozhoduje
počet oddílů k odškrtání — dvanáctitýdenní denní plán jich má kolem
sedmdesáti, roční týdenní dvaapadesát.

| | denní plán | týdenní plán | česky | anglicky | německy |
| --- | --- | --- | --- | --- | --- |
| nejnižší | 2–4 týdny | 2–13 týdnů | 99 Kč | $4.99 | 4,49 € |
| střední | 5–8 | 14–26 | 149 Kč | $6.99 | 6,49 € |
| nejvyšší | 9–12 | 27–52 | 199 Kč | $8.99 | 8,49 € |

Měna se posílá pokladně s sebou. Bez toho by si ji Stripe vybral
podle karty a u pokladny by stála jiná částka než na stránce.

## Jak to vyzkoušet, než to pustíš na lidi

V testovacím režimu (klíče `sk_test_`):

1. Objednat plán na stránce `/cs/pdf-plans`, zaplatit testovací kartou
   `4242 4242 4242 4242`.
2. Zkontrolovat, že po návratu z pokladny běží výroba plánu a že se
   dá stáhnout PDF.
3. Zkusit totéž na `/en/pdf-plans` — tam musí pokladna ukázat dolary.
   Tohle je ta nejpravděpodobnější věc, která selže, protože se opírá
   o měny povolené na účtu.

V ostrém režimu stačí jeden skutečný nákup za 99 Kč; peníze si pošleš
sama sobě a hned uvidíš, jestli sedí účtenka i DPH.

## Na co nezapomenout při změně ceny

Ceník je v kódu, takže se mění nasazením. Platí přitom:

- už objednané plány mají cenu uloženou u objednávky, takže se jim
  zpětně nemění,
- ceny na stránce a v pokladně vycházejí z téhož místa, takže se
  rozejít nemůžou,
- testy v `pricing.test.ts` hlídají, že pásma na sebe navazují bez děr
  a že žádný povolený počet týdnů nezůstane bez ceny.
