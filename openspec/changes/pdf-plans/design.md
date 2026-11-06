# Design

## Sazba PDF: @react-pdf/renderer, ne prohlížeč

Zvažovalo se vykreslení HTML přes Playwright. Zahozeno: Chromium
v produkčním obrazu je skoro půl gigabajtu a server sdílíme se třemi
dalšími projekty.

`@react-pdf/renderer` je čisté JavaScriptové sázení bez prohlížeče.
Strana s dvaceti úkoly vyjde na 10 kB.

### Písmo je vložené, a proto je ověřené dopředu

Zabudovaná písma v PDF českou diakritiku neumí — výchozí Helvetica
nemá ani „ě". Vkládá se proto Instrument Sans, totéž, jaké má web.

Ověřeno před návrhem, ne po něm: font má všech 29 českých háčků
a čárek, typografické uvozovky i pomlčky, PDF ho vkládá jako
TrueType a přidává mapu znaků, takže text v hotovém souboru jde
vyhledávat a kopírovat.

Soubory `public/fonts/instrument-sans-{400,700}.ttf` jsou verze
z balíčku `@expo-google-fonts/instrument-sans`, vytažené do repa.
Balíčky `@fontsource/*` se nehodí: dělí písmo na podmnožiny
(`latin`, `latin-ext`) a do PDF jde jeden soubor, ne dva. Licence
OFL vlastní hostování i šíření dovoluje.

Leží v `public/`, protože Dockerfile ten adresář do běhového obrazu
kopíruje. Server je čte z disku při sazbě; že jsou zároveň veřejně
stažitelné, nevadí — woff2 varianty tam jsou už dnes.

## Platí se předem, model se volá až potom

Volání modelu stojí peníze a u plánu s denními úkoly jich je víc.
Kdyby se generovalo před platbou, platili bychom za každého, kdo si
jen zkusí, jak to vypadá.

Důvěru nahrazuje ukázka: u každé šablony je hotová ukázková strana
PDF (soubor, ne generovaná) a osnova fází jako text na stránce. Obojí
vzniká jednou a pro všechny stejné.

## Generuje se jako rozpad cíle, po kolech

Po zaplacení se nečeká na jedno dlouhé volání. Použije se tentýž
postup jako u rozpadu cíle v aplikaci: server udělá jedno volání na
požadavek, klient se ptá znovu, dokud není hotovo. Ten vzorec už je
vyzkoušený a odolný proti škobrtnutí modelu.

Bez toho by požadavek běžel minuty a proxy by ho utnula dřív — přesně
to, na co se narazilo u přeplánování.

## Vlastní model, ne příznak u cíle

`Goal` má stav, limity a na jeho `status: ACTIVE` se ptá spousta míst
— denní přehled, oznámení, vyhodnocení tempa. Přidat tam „cíl, který
vypadá jako cíl, ale neodškrtává se" znamená projít je všechna a na
jednom to zapomenout.

`PdfPlan` je proto samostatný. V seznamu cílů se vykreslí jako
oddělená část, takže slib „bude to v seznamu cílů" platí, a do
denního chodu aplikace nemůže prosáknout.

Převod na skutečný cíl po předplacení pak znamená přečíst uložený
plán a založit z něj `Goal` — bez volání modelu. Vytištěný plán tak
sedí s tím v aplikaci.

## Právo na odstoupení

Digitální obsah dodaný hned. Podle občanského zákoníku zaniká právo
odstoupit do 14 dnů jen tehdy, když s okamžitým dodáním zákazník
**výslovně souhlasí a potvrdí, že tím o to právo přichází**.

Není to volba: bez zaškrtnutí před platbou by šlo odstoupit i po
stažení PDF. Zaškrtávátko je proto povinné a jeho potvrzení se
ukládá s datem k záznamu o nákupu.

## Ceny

Podle počtu týdnů, protože podle něj roste i délka dokumentu
i náklad na model:

| týdnů | cena |
|---|---|
| do 4 | 99 Kč |
| do 8 | 149 Kč |
| do 12 | 199 Kč |

Nad 12 týdnů se jednorázový plán nenabízí. Tak dlouhá cesta se beze
změn neujde a statický snímek by lhal — tam patří předplatné.

## Odchylky

- Ověřeno bez lokální databáze, jako u předchozích změn.
