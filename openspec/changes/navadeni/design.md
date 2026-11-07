# Design

## Rozdělení na soubory

Podle návodu, protože ta dělba je to podstatné:

| Soubor | Co v něm je | Co v něm **není** |
|---|---|---|
| `rules.ts` | všechna čísla — prahy, časy, počty, zakázané cíle | logika |
| `machine.ts` | čisté funkce: stav + událost → nový stav | DOM, časovače, `window` |
| `target.ts` | výběr, na co ukázat | měření |
| `useGuide.ts` | jediné místo, které ví o myši, rolování a čase | rozhodování |

`machine.ts` bez DOM se dá vyzkoušet bez prohlížeče — a to je rozdíl
mezi „napsali jsme testy" a „testy něco hlídají".

## Analytika se nestaví, použije se Umami

Návod popisuje, jak postavit cookiefree analytiku od nuly. My ji máme:
Umami běží na našem serveru, neukládá nic do prohlížeče, neměří napříč
weby a nepotřebuje souhlas.

Pravidla z návodu tím pádem platí sama od sebe, až na jedno: hlášení
si neskládáme, posíláme pojmenovanou událost s pár čísly. Co do ní
smí, hlídá `event.ts` a test.

### Uvnitř aplikace se nenavádí

`Analytics.tsx` za přihlášením schválně neměří — je to soukromá práce
na vlastních cílech, ne návštěvnost. Navádění tedy nemá jak vyhodnotit
a ladilo by se od oka, takže tam nepatří.

Je to zároveň ostrá hranice, kterou nejde rozmazat omylem: navádění se
vykresluje v téže vrstvě jako měření a sdílí s ním seznam veřejných
cest.

## Zakázané cíle

Nikdy se nenavádí k platbě — ani k předplatnému, ani k nákupu plánu
v PDF. Rozdíl mezi službou a temným vzorcem není v tom, jak nápověda
vypadá, ale kam ukazuje: dokončit něco, co člověk sám začal, je pomoc;
pobízet ke koupi někoho, kdo si čte, je nátlak.

Seznam je v `rules.ts` a v zásadách soukromí je totéž napsané slovy.
Test obojí porovnává a shodí sestavení, když se rozejdou — tvrzení
a kód se jinak rozcházejí tiše.

## Barva

Nová proměnná `--color-guide`, použitá **jen** na navádění. Nesmí to
být barva odkazů ani tlačítek, jinak přestane být slovníkem: kdo ji
potká potřetí, má vědět, že znamená „tudy".

Na tmavém výchozím motivu azur (`#7dd3fc`) — v zelenofialové paletě
aplikace se nevyskytuje a na tmavém podkladu je vidět koutkem oka.
Na pěti světlých motivech tmavší varianta, stejně jako u `--color-warn`,
protože světlý azur by na papírovém podkladu zmizel.

## Co se měří

Jedna událost na nápovědu, přes Umami:

- na co se ukázalo (`demo`, `templates`…), ne kde přesně,
- podle čeho se spustila (`silence`, `scrollEnd`…),
- jestli pomohla — klepnutí na cíl do pár vteřin.

Žádné souřadnice, žádný čas v sekundách, žádná adresa odkazu. Jméno
cíle je z pevného seznamu, takže se do události nedá dostat nic
z obsahu stránky.

## Odchylky od návodu

- **Analytika se nestaví.** Viz výš — Umami už splňuje totéž.
- **Signály začínáme dvěma**, ne šesti: ticho po aktivitě a doroloval
  na konec. Návod sám radí přidávat po jednom a dívat se do čísel.
