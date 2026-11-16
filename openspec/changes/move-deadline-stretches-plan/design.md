# Design

## Kotva: konec běžícího období

Roztahuje se až to, co přijde **po** období, kterým právě prochází
dnešek. Důvod je praktický: běžící období má jako jediné rozepsané
týdny a dny a v nich odškrtnuté úkoly. Kdyby se hýbalo, buď by se
odškrtání rozešlo s daty, nebo by se musely dny přegenerovat — a to
znamená volat model kvůli operaci, která má být zadarmo.

Kotva je tedy den po konci běžícího období. Před ní se nemění nic.

## Konce období se berou od souseda

Z výpočtu vycházejí jen začátky; konec období je vždycky den před
začátkem toho dalšího a poslední sahá přesně na nový termín.

Kdyby se stejným poměrem počítaly i konce, zaokrouhlení by mezi
obdobími tu a tam udělalo den mezery. Den, který nepatří do žádného
období, je den bez úkolů — a plán se na něm tiše zastaví, protože
hledání běžícího období nic nenajde. Je to chyba, která se pozná až
za týdny, takže ji hlídá test.

## Když roztahovat není co

Cíl, který je ve svém posledním období, nemá za sebou co posunout.
Tam se obsah opravdu musí dopsat, takže se spadne na původní cestu
s modelem. Je to i jediné místo, kde posun termínu ještě něco stojí.

Stejně se zachází s případy, kdy by roztažení dalo nesmysl — termín,
který se neposouvá dopředu, nebo kotva až za původním termínem. Lepší
dopsat plán modelem než zapsat termín, za kterým nic není.

## Propadlá práce: po jednom na den

Když si uživatel řekne, vrátí se nedodělané úkoly na nejbližší dny
**po jednom**, od nejstaršího. Dvě dodělávky denně by vedle skutečného
plánu postavily druhý a nejspíš by se nestihlo ani jedno; jeden úkol
navíc se dá vmáčknout skoro vždycky.

Dny, na kterých už v plánu stojí odpočinek, se přeskakují. Odpočinek je
položka plánu, ne zbytek — den, na kterém má stát „dnes nic", není
místo pro nedodělek z minula.

Používá se `deferredTo`, tedy tentýž mechanismus jako u ručního
odložení. Úkol se nekopíruje ani nevyrábí nový: je to pořád tentýž
úkol, jen v jiný den.

Nesahá se na úkoly odložené „nevím kdy" (`DEFERRED`) ani na odpočinek.
To první si uživatel odložil sám, to druhé se nedohání.

## Rozpočet a zámek

Strop v korunách se u posunu termínu nekontroluje — nic nestojí.
Odmítnout ho kvůli vyčerpanému rozpočtu by znamenalo nechat člověka se
skluzem bez jediné možnosti, jak se z něj dostat, zrovna u volby, která
je zadarmo. Na model se strop uplatní až v cestě, která ho volá.

Zámek přeplánování platí dál. Přepis dat je sice rychlý, ale pořád to
je výměna termínu a období pod rukama někoho, kdo může zrovna
odškrtávat.

## Rizika a přijaté kompromisy

- **Běžící období si nechá původní hustotu.** Úlevu přinese až to další.
  Alternativa by byla přegenerovat dny běžícího týdne, což stojí volání
  modelu a sebralo by odškrtání — horší obojí.
- **Vrácené úkoly dopadnou na dny, které ještě nejsou rozepsané.** Jejich
  vlastní porce práce se dopíše později a o dodělávce neví, takže den
  může vyjít těsnější. Při jednom úkolu denně je to snesitelné; při
  dvou by nebylo.
- **Text u tlačítka se musel změnit** — sliboval, že se plán přepíše na
  klidnější rozvržení. Teď říká, že plán zůstane a jen dostane víc času.
  Změna je ve všech třech jazycích a **čeká na schválení**.
