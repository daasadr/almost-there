# Proposal

## Why

Dagmar nechala přepočítat běžící cíl „od vibecodingu ke skutečnému
programování", zhruba v polovině cesty. Nový plán začal od začátku:
založit Next aplikaci, založit repozitář na GitHubu. Měsíce odškrtané
práce v plánu nebyly.

Není to chyba modelu. Prompt mu to řekl sám, třemi způsoby najednou:

1. **Pokyn ze šablony se vkládá i při přeplánování**, a to se slovy
   „Follow it over your own general assumptions, and let it shape the
   order and the milestones". Pokyny jsou psané jako oblouk od nuly —
   `vibecoder-to-coder` doslova říká „Something that runs, in the first
   few days" a „Version control from the first week". Model poslechl.
2. **`startingPoint` jde do promptu doslova** a stojí u něj „Where they
   are starting from. Do not plan the beginner path for someone who is
   already part of the way there". Jenže je to místo, kde člověk stál
   při zakládání cíle — před měsíci.
3. **Model se nikdy nedozví, co je doopravdy hotové.** Dostane souhrny
   uplynulých období (tedy co plán *chtěl*) a procento splnění. Z
   „splněno 70 %" se nedá poznat, že repozitář existuje.

Třetí bod je ten podstatný: dosažené milníky ani odškrtané úkoly se do
promptu nedostanou vůbec, ačkoliv jsou v databázi připravené a nic
nestojí.

Chyba se pozná pozdě — až někdo po týdnech skluzu přepočítá cíl — a
mezitím stojí peníze za volání modelu a důvěru v plán, do kterého se
pak nikdo nechce vracet.

## What Changes

- Přeplánování posílá modelu **důkazy o hotovém**: dosažené milníky,
  poslední odškrtané úkoly a datum, odkdy na cíli pracuje.
- Prompt dostává **tvrdé pravidlo**: co je hotové, se znovu neplánuje.
- **Pokyn ze šablony se při přeplánování zarámuje** — popisuje celý
  oblouk od začátku, člověk je v jeho půlce, takže se jeho úvodní kroky
  neplánují znovu. Jedno místo, platí pro všechny šablony.
- **`startingPoint` se při přeplánování označí za historii**, ne za
  dnešní úroveň.
- Rozpad na týdny a dny dostává seznam **dosažených milníků**, aby se
  hotová věc neobjevila ani jako denní úkol.
- V dokumentaci šablon přibude pravidlo: pokyn se používá i při
  přeplánování, píše se jako pořadí, ne jako kalendář.

## Non-goals

- **Přepisovat texty pokynů v šablonách.** Pro první rozpad jsou
  správné; vadí až při přeplánování a to řeší zarámování na jednom
  místě. Dvacet textů by se rozešlo.
- **Další volání modelu.** Všechno, co se přidává, je čtení z databáze.
- **Přenášet nedodělané úkoly.** Zůstává v platnosti, že se propadlé
  položky nehrnou dopředu; tohle je o opačné chybě.
- **Měnit chování při pádu serveru uprostřed přeplánování.** Transakce
  drží a stav zůstal nedotčený — to funguje správně.
