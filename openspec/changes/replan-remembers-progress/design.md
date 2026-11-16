# Design

## Co se ukázalo při hledání příčiny

Pád serveru uprostřed přeplánování **nic nerozbil**. Zápis je v jedné
transakci (`replan.ts`), takže se buď provede celý, nebo vůbec — proto
Dagmar po návratu našla cíl v původním stavu. Zámek má desetiminutovou
platnost, takže ani ten se nezasekl. Druhé, dokončené přeplánování tedy
běželo nad nedotčenými daty a stejně vyšlo od nuly. Chyba je v zadání
pro model, ne ve stavu databáze.

## Rozhodnutí

### Zarámovat pokyn, ne přepsat šablony

Pokyny v šablonách jsou pro **první** rozpad správné. `vibecoder-to-coder`
má pravdu, že se takový plán nemá topit tři týdny v nastavování; věta
„Something that runs, in the first few days" tam patří. Vadí až ve
chvíli, kdy ji model čte pro někoho, kdo tím prošel v květnu.

Takže se nemění texty, ale **vkládání**: při přeplánování se k pokynu
přidá věta, že popisuje cestu od začátku a že člověk je v její půlce.
Jedno místo, platí pro všechny šablony včetně budoucích. Dvacet
ručně upravených textů by se rozešlo během půl roku.

### Důkazy, ne procenta

Dosud model dostal souhrny uplynulých období (co plán **chtěl**) a
procento splnění. Obojí je o plánu, ne o skutečnosti — z „70 %" se nedá
poznat, co z toho byl repozitář.

Nově jde do zadání, co je **prokazatelně hotové**: dosažené milníky a
poslední odškrtané úkoly. Jsou to názvy, které psal model, takže se
čtou stejným jazykem jako plán.

Odškrtaných úkolů se bere dvanáct posledních. Víc by v zadání ředilo
podstatné a u dlouhého cíle by jich byly stovky; dvanáct je zhruba
dva týdny práce, tedy „kde je člověk teď".

### Proč to nestojí nic navíc

Všechno jsou dotazy do databáze nad existujícími indexy, žádné další
volání modelu. Zadání naroste o pár desítek řádků u operace, která
stejně trvá minuty a volá model na celý plán.

U rozpadu na dny — nejčastější volání v provozu — přibývá jen seznam
dosažených milníků, tedy jednotky řádků. Milník je jeden na období,
takže i roční cíl jich má do dvanácti.

### Co se nemění

Nedodělané úkoly se dál nepřenášejí po jednom. Je to opačná chyba než
ta řešená a pravidlo proti ní v promptu zůstává — kupka propadlých
položek plán zabije stejně spolehlivě jako plánování hotového.

## Rizika

- **Model dostane protichůdné signály.** „Tohle je hotové" vedle
  „splněno 70 %". Řeší se pořadím a formulací: důkazy stojí blíž
  u pravidla a procento je výslovně popsané jako tempo, ne jako stav.
- **Seznam hotového může zestárnout.** Milníky i úkoly se čtou v
  okamžiku přeplánování, tedy pod zámkem — mezi čtením a zápisem se
  plnění měnit nedá.
- **Delší zadání = vyšší cena.** U přeplánování zanedbatelné, u dnů
  pár desítek tokenů týdně na cíl.

## Odchylky od návrhu

**16. 11. 2026 — jako důkaz jde souhrn období, ne název milníku.**
Návrh počítal s názvy dosažených milníků. Jenže název je jen štítek
(„Základy"), kdežto co se tím doopravdy umí, stojí v souhrnu období
(„Běžící stránka, kterou sis napsal sám"). Posílá se souhrn a název
zůstává jako záloha pro milníky, kterým období po dřívějším
přeplánování zmizelo.

## Review bezpečnosti

Změna přidává do zadání pro model další data z databáze. Prošlo se, co
z nich pochází od uživatele:

- **Názvy úkolů a souhrny období** píše model, ne uživatel. Rozhraní
  `PATCH /api/tasks/[id]` mění jen stav úkolu, název ne — nový vstup
  pro vsunutí pokynů tedy nevzniká.
- **`startingPoint` a `deferReason`** jsou text od uživatele, ale do
  zadání chodily i předtím. Jsou to jeho vlastní data v jeho vlastním
  plánu: vsunutý pokyn pokazí plán toho, kdo ho napsal.
- **Cizí data se do zadání nedostanou.** Všechny dotazy jsou vázané na
  `goalId` a přeplánování si vlastnictví cíle ověřuje v API.
- Nic z přidaného se nikam neloguje; `recordUsage` zapisuje jen počty
  tokenů a štítek operace.

Přijaté riziko: delší zadání znamená vyšší cenu za volání. U
přeplánování je to v šumu, u rozpadu dnů jde o jednotky řádků.
