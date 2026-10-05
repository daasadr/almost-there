import type { Locale } from "@/i18n/routing";

/**
 * Návod k používání.
 *
 * Dlouhé texty patří sem, ne mezi UI stringy v `messages/*.json` — stejně
 * jako obchodní podmínky. Navíc by se tím do prohlížeče posílal návod
 * s každou stránkou; takhle se vykreslí na serveru a klient ho nikdy
 * nedostane.
 *
 * Píše se pro tři čtenáře najednou:
 *
 *  - kdo aplikaci používá a něčemu nerozumí — proto jsou oddíly krátké
 *    a nadepsané otázkou, ne názvem funkce,
 *  - kdo si chce před registrací přečíst, jak to funguje, místo aby to
 *    zkoušel,
 *  - jazykový model, který web najde a má z něj umět odpovědět. Proto
 *    jsou čísla a lhůty napsané doslova, ne opsané („po třech dnech“,
 *    ne „po pár dnech“).
 *
 * Když se změní chování aplikace, musí se změnit i tenhle text. Čísla
 * v něm jsou tvrzení, ne ilustrace.
 */

export type GuideSection = {
  heading: string;
  paragraphs: string[];
  /** Kroky, když má oddíl postup. Vykreslí se číslovaně. */
  steps?: string[];
};

export type GuideDocument = {
  intro: string;
  sections: GuideSection[];
};

export const guideByLocale: Record<Locale, GuideDocument> = {
  cs: {
    intro:
      "AlmostThere vezme tvůj cíl a termín a udělá z nich plán až na úroveň dnešního dne. Tenhle návod projde všechno, co aplikace umí, v pořadí, ve kterém to budeš potřebovat. Číst od začátku do konce nemusíš — každý oddíl stojí sám o sobě.",
    sections: [
      {
        heading: "Co aplikace vlastně dělá",
        paragraphs: [
          "Řekneš jí cíl a datum, do kdy ho chceš mít splněný. Ona z toho spočítá plán pozpátku: rozdělí cestu na fáze po měsících, každou fázi na týdny a nejbližší týdny na konkrétní denní úkoly. Ráno pak otevřeš aplikaci a vidíš seznam na dnešek.",
          "Rozdíl proti seznamu úkolů je v tom, že ho nesestavuješ ty. Aplikace ví, kolik času do termínu zbývá a kolik ho máš denně, a podle toho rozdělí práci. Když začneš zaostávat, ozve se a nabídne řešení.",
        ],
      },
      {
        heading: "Než založíš první cíl: nastavení",
        paragraphs: [
          "Tři hodnoty v nastavení určují, jak bude plán vypadat, a platí pro všechny tvoje cíle dohromady. Vyplať se je projít dřív, než něco založíš — plán se podle nich staví a měnit je zpětně znamená přeplánovat.",
          "Kolik času denně máš na cíle dohromady. Ne kolik by se ti líbilo, ale kolik reálně zvládneš i ve špatném týdnu. Nadsazené číslo je nejčastější důvod, proč plány padají.",
          "Jak často chceš mít volno. Na výběr je žádné volno, jeden nebo dva dny v týdnu, nebo obden. Dny volna jsou položkou plánu, ne mezerou v něm.",
          "Kolik minut denně na ohlédnutí. Krátká chvíle na zápis, co šlo a co ne. Dá se vypnout nulou.",
          "K tomu časové pásmo — podle něj aplikace pozná, kdy ti začíná nový den.",
        ],
      },
      {
        heading: "Šablony: když nechceš začínat u prázdného políčka",
        paragraphs: [
          "Prázdné „jaký je tvůj cíl?“ je nejtěžší místo celé aplikace. Kdo napíše „zhubnout“, dostane průměrný plán — ne proto, že by to aplikace neuměla, ale protože v zadání nebylo z čeho vyjít.",
          "Šablona tenhle krok neusnadňuje tím, že za tebe vyplní políčka. Nese odbornost: pořadí, které se nedá přeskočit, obvyklou chybu, kvůli které to lidé vzdávají, podle čeho se pozná postup a co se má škrtnout jako první, až přestaneš stíhat. Z toho se pak staví plán — a je to ta část, kterou nevidíš.",
          "Místo jednoho „odkud začínáš?“ se šablona zeptá na tři konkrétní věci, které zrovna u téhle cesty rozhodují. Odpovědi jsou to, co by jinak aplikace musela hádat.",
          "Šablony najdeš tlačítkem vedle Nového cíle. Každá má vlastní stránku, kde je dopředu napsané, jak plán postupuje a co se v něm obětuje první — a ta stránka je veřejná, takže jde poslat komukoliv i bez účtu.",
          "Šablona je zkratka, ne podmínka. Vlastní cíl napsaný od ruky funguje úplně stejně.",
        ],
      },
      {
        heading: "Jak založit cíl",
        paragraphs: [
          "Na cíli záleží víc než na čemkoliv jiném. Čím konkrétnější je zadání, tím použitelnější je plán.",
        ],
        steps: [
          "Napiš cíl jednou větou. „Uběhnout půlmaraton“ je lepší než „začít sportovat“, protože z prvního jde poznat, kdy je hotovo.",
          "Zvol termín. Aplikace ti po rozfázování řekne, jestli je reálný — a když není, napíše proč.",
          "Do popisu doplň, co má aplikace vědět: proč to děláš, co tě omezuje, na čem ti záleží.",
          "Do políčka „co už máš“ napiš, odkud začínáš. Bez toho plán vypadá stejně pro začátečníka i pro toho, kdo má půlku za sebou.",
          "Vyber barvu. V denním seznamu podle ní na první pohled poznáš, ke kterému cíli úkol patří.",
          "Klikni na Rozfázovat cíl. Trvá to půl minuty až minutu; stránku nechej otevřenou.",
        ],
      },
      {
        heading: "Co z toho vznikne",
        paragraphs: [
          "Nejdřív uvidíš, jak aplikace tvůj cíl pochopila, a posouzení, jestli je termín reálný. Přečti si to — je to jediná chvíle, kdy se dá nedorozumění chytit dřív, než se podle něj naplánuje půl roku.",
          "Pod tím jsou fáze: úseky po měsících s popisem, co má být na konci každého z nich hotové. Podrobnosti se dopisují postupně — na nejbližší období do týdnů a dnů, vzdálenější zůstávají v hrubých fázích, dokud na ně nedojde. Šetří to čas i náklady a hlavně to nechává prostor pro to, že se cesta cestou změní.",
        ],
      },
      {
        heading: "Každodenní používání",
        paragraphs: [
          "Hlavní obrazovka ukazuje dnešek: úkoly ze všech běžících cílů, každý ve své barvě, s odhadem, kolik zabere. Odškrtáváš je, jak je plníš.",
          "U každého úkolu je návod, jak ho dnes udělat — pár kroků, ne jedna věta. Poslední krok bývá takový, aby ověřil, že práce dopadla, ne že jen proběhla: vysvětlit látku nahlas, jeden těžší příklad, zkusit totéž ještě jednou bez pomoci. Odškrtnout položku za čas u toho strávený umí každý; o to tady nejde.",
          "U cílů, kde se něco učíš, tě úkoly občas pošlou probrat téma s AI chatem — a to i tehdy, když žádné materiály nemáš. Je to zdroj, který má opravdu každý, nic nestojí a odpovídá na tvé úrovni tak dlouho, dokud to nepochopíš. Úkol ti řekne přesně, na co se zeptat, a často i to, ať si od chatu necháš ověřit, že tomu rozumíš. Doporučujeme Claude.ai, ale funguje jakýkoliv oblíbený chat.",
          "Nad seznamem je týdenní pruh se zkratkami dnů. Odškrtnuté dny mají háček, dnešek je zvýrazněný. Klikáním se dá projít celý týden dozadu i dopředu — hodí se, když si chceš doplnit včerejšek nebo se podívat, co tě čeká zítra.",
          "Pod tím je pruh posledních třiceti dnů. Není to hodnocení, jen obrázek toho, jak ti to jde ve skutečnosti.",
        ],
      },
      {
        heading: "Co dělat, když úkol dnes nejde splnit",
        paragraphs: [
          "Někdy úkol splnit nejde z důvodů, o kterých plán nemůže vědět — nemáš zrovna peníze, čekáš na někoho jiného, prší. U každého úkolu je proto tlačítko „Dnes nemůžu“.",
          "Nabídne přesunout úkol na zítřek, na konkrétní datum, nebo ho odložit stranou bez data. Úkol se nevyměňuje ani nenahrazuje jiným — je to pořád tentýž úkol, jen v jiný den. Můžeš připsat, proč to nešlo; použije se to, až se bude plán přepočítávat.",
          "Neodškrtávej, co není udělané. Aplikace podle odškrtaných dní počítá tempo a podle tempa ti radí — jedno falešné zaškrtnutí a začne ti tvrdit, že stíháš.",
          "Když ti po odložení na dnešek nic jiného nezbude, aplikace nabídne úkoly z nejbližších dnů, které si můžeš vzít místo toho. Plán se tím nenafoukne, jen se posune dopředu.",
          "Úkoly odložené bez data mají vlastní seznam pod denním plánem. Nic nepřipomínají, ale nezmizí — kdykoliv jim můžeš dát datum.",
        ],
      },
      {
        heading: "Když začneš zaostávat",
        paragraphs: [
          "Vynechaný den se nic neděje. Když se ale za poslední dva týdny nasbírají tři dny bez jediného odškrtnutí, aplikace se ozve a nabídne dvě cesty.",
          "Dohnat skluz znamená nechat termín být a přeplánovat zbytek tak, aby se to stihlo. Přepočítat termín znamená posunout datum na takové, které odpovídá tempu, jaké máš doopravdy.",
          "Vybíráš vždycky ty. Aplikace ti termín sama neposune a nabídku po odmítnutí týden nezopakuje.",
          "Nedodělky z posledních sedmi dnů se ukazují nad dnešním seznamem. Můžeš je dodatečně odškrtnout, odložit na jindy, nebo je nechat být — někdy je to správná odpověď.",
          "Jedna praktická rada: přeplánovávej spíš ráno než večer. Nový plán musí začít dneškem, takže dnešní úkoly nahradí novými — a co je dnes už odškrtnuté, zmizí s nimi. Odškrtané dny z minulosti ani celkovou úspěšnost přeplánování nemaže, ta zůstává celá.",
          "Ještě jedna věc, se kterou je dobré počítat: denní úkoly se rozepisují na aktuální období a na to nejbližší další, takže nepřítomnost do zhruba dvou týdnů plán pokryje — na nemoc nebo dovolenou to stačí. Když se ale neozveš déle, dny mezitím zůstanou bez úkolů a plán naváže až tvým příchodem. Do vyhodnocení tempa se ty prázdné dny počítají jako vynechané, takže se po návratu dozvíš, že jsi ve skluzu, a můžeš si termín přepočítat.",
        ],
      },
      {
        heading: "Když ti plán nesedí",
        paragraphs: [
          "Přeplánování po skluzu řeší, že se nestíhá. Někdy je ale potíž jinde: úkoly k cíli sedí, jen nesedí k tobě. Běhat se dá v lese i na dráze, učit se ráno i večer — a plán, který nechceš, je plán, který nebudeš plnit.",
          "Na stránce cíle je proto tlačítko Upravit směr. Napíšeš vlastními slovy, co by mělo jít jinak, a zbytek plánu se podle toho přepracuje. Termín i cíl zůstávají.",
          "Co je k dosažení cíle opravdu potřeba, v plánu zůstane, i kdyby se to s přáním trochu tlouklo. Kdyby to nešlo dohromady vůbec, dozvíš se proč — aplikace raději řekne pravdu, než aby tiše poslechla a nechala cíl mimo dosah.",
        ],
      },
      {
        heading: "Milníky a odměny",
        paragraphs: [
          "Každá fáze plánu končí milníkem — místem, kde je co ukázat. Ke každému si můžeš přidat odměnu, kterou si dáš, až tam dojdeš.",
          "Odměnu si buď napíšeš, nebo si ji necháš navrhnout. Aby návrh za něco stál, vyplň si v nastavení, co ti udělá radost a co naopak ne. Bez toho vychází průměr, který nesedí skoro nikomu.",
          "Dlouhý cíl nedává měsíce žádnou zpětnou vazbu. Milník je to, co ho drží při životě.",
          "Odměna za celý cíl je zvlášť, u závěrečné zkoušky — viz další oddíl. Milníky drží cestu, ta poslední zavírá celou věc.",
        ],
      },
      {
        heading: "Čím cíl skončí",
        paragraphs: [
          "Ke každému plánu patří závěrečná zkouška: jedna konkrétní věc, kterou se cíl prokáže. Zřídka je to zkouška v tom školním smyslu. Spíš ta věc samotná, udělaná naostro — hotová kresba místo dalšího cvičení, ten závod místo dalšího tréninku, půlhodina hovoru s někým, kdo kvůli tobě nezpomaluje.",
          "Jsou na ní tři věci podstatné: dělá se bez pomoci, za skutečných podmínek a vcelku, ne po kouskách přes týdny. Vidíš ji od prvního dne nahoře na stránce cíle, protože podle ní se celý plán odvíjí pozpátku. Poslední období plánu je na ni vyhrazené.",
          "Vedle ní je odměna za dotažení. Tu si buď napíšeš, nebo si ji necháš navrhnout, stejně jako u milníků — jen je větší, protože zavírá měsíce práce. Je vidět celou dobu, ne až na konci: vědět, co čeká, je půlka důvodu, proč tam dojít.",
        ],
      },
      {
        heading: "Když je cíl hotový",
        paragraphs: [
          "Až nezůstane co odškrtnout, aplikace se zeptá — ne dřív. Dlouho se ptala celý poslední týden a dalo se tím cíl zavřít předčasně; teď se ozve, až na dnešek nic nezbývá, nebo až je termín za námi a den je odbytý.",
          "V tu chvíli máš tři možnosti. Mám hotovo cíl uzavře. Ještě ne okno zavře a zeptá se jindy. A třetí je Chci to ještě dotáhnout: cíl je u konce, ale ne v té podobě, o kterou ti šlo. Napíšeš, co ještě chybí, zadáš nový termín a zbytek plánu se dopíše.",
          "Uzavření není změna stavu v databázi. Dostaneš vlastní stránku se shrnutím toho, co se za tu dobu stalo, a s čísly: kolik dní, kolik úkolů, kolik dnů volna, kolik etap. Odsud si taky vyzvedneš závěrečnou odměnu.",
          "A pak se nabídne navázat. Nový cíl, který z dotaženého vychází — po kurzu skicování třeba krajina. Nezačíná od nuly: ví, kde ta předchozí cesta skončila. Původní cíl zůstává mezi dotaženými a oslava platí.",
          "Dotažené cíle mají vlastní sbírku. Většina lidí svůj cíl nedotáhne; tohle je to místo, kde zůstává vidět, že ty jo.",
        ],
      },
      {
        heading: "Víc cílů najednou",
        paragraphs: [
          "Souběžně můžeš mít až pět cílů. Plánují se dohromady, takže se ti nesejdou na stejné dny a nepřekročí čas, který na ně máš vyhrazený.",
          "U každého cíle nastavuješ důležitost. Podle ní se rozděluje denní kapacita — důležitější cíl dostane víc času.",
          "Cíl jde kdykoliv pozastavit; přestane se objevovat v denním plánu a nebere si kapacitu. Pauza může trvat klidně měsíce. Až ho rozběhneš zpátky, posune se zbytek plánu i termín přesně o tu dobu, kterou cíl stál — navážeš tam, kde cíl stál, jen s dnešními daty. Nic se negeneruje znovu a nic to nestojí; pořadí i rozestupy zůstávají, jak byly. Co proběhlo před pauzou, se nepřepisuje.",
          "Ke každému cíli si můžeš nahrát obrázky, které ti připomínají, proč to děláš. Jeden z nich se ukáže u denního seznamu; čím víc jich nahraješ, tím větší je pestrost.",
        ],
      },
      {
        heading: "Kolik toho můžeš použít",
        paragraphs: [
          "Pět souběžných cílů a deset nových plánů měsíčně. Nový plán se počítá při založení cíle nebo při přeplánování celého cíle.",
          "Všechno ostatní se do limitu nepočítá a je bez omezení: rozfázování na týdny a dny, denní úkoly, návrhy odměn. Kdo si cíl založí a pracuje na něm, nevyčerpá za měsíc ani polovinu.",
          "Nad tím je ještě měsíční strop spotřeby AI. Vidíš ho v aplikaci v procentech. Je nastavený tak, aby ho běžné používání nedosáhlo — chytá překlepy a útoky, ne zákazníky.",
        ],
      },
      {
        heading: "Aplikace v telefonu",
        paragraphs: [
          "Web funguje v mobilním prohlížeči a dá se přidat na plochu, odkud se otevírá na celou obrazovku bez adresního řádku. Návod krok za krokem pro iPhone i Android je na stránce o instalaci.",
          "V aplikaci stažené z obchodu si můžeš zapnout denní připomínku: telefon se ozve ve zvolený čas, i když aplikaci nemáš otevřenou. Plánuje se přímo v telefonu, takže o ní na server nic neodchází a funguje i bez signálu.",
          "Ať otevřeš aplikaci odkudkoliv, přihlašuješ se stejným účtem a máš v ní ty samé cíle.",
        ],
      },
      {
        heading: "Ranní připomínka a myšlenka na den",
        paragraphs: [
          "Ráno se ti aplikace ozve krátkým textem — myšlenkou na den. V oznámení uvidíš dnešní téma a první větu; klepnutím se otevře celý text a dá se nechat přečíst nahlas. Chodí i ve dnech, kdy žádný cíl rozjetý nemáš.",
          "Zapíná se v Důležitých nastaveních. Hned pod nastavením je tlačítko „Poslat zkušební oznámení“ — použij ho. Odpoví ti do vteřiny a je to jediný způsob, jak si ověřit, že opravdu dorazí, bez čekání do rána.",
          "Oznámení se nastavují pro každý prohlížeč a každé zařízení zvlášť. Není to vlastnost účtu: když si je zapneš na počítači, telefon o tom neví. Na každém zařízení, kde je chceš mít, je tedy musíš zapnout znovu — a na každém se taky dá zvlášť vypnout.",
          "Oznámení doručuje tvůj prohlížeč, ne my. My zprávu předáme jeho poštovní službě a tím naše část končí. Proto může přijít se zpožděním, když je zařízení vypnuté nebo bez signálu — počká a doručí se, jakmile se ozve. A proto taky zkušební oznámení hlásí „odesláno“: dál už nevidíme.",
        ],
        steps: [
          "Nedorazilo nic a zkušební oznámení hlásí, že prohlížeč není přihlášený: přepni připomínky na „Nikdy“ a zase zpátky. Tím se přihlášení vytvoří znovu.",
          "Prohlížeč se na svolení vůbec nezeptal: nejspíš ho má zakázané pro tuhle stránku. Povolí se v jeho nastavení u adresy webu.",
          "Na iPhonu fungují oznámení až u aplikace přidané na plochu, v samotném Safari ne. Je to omezení systému.",
          "V aplikaci stažené z obchodu je to jinak: tam připomínku plánuje přímo telefon. Neposílá se nic ze serveru, funguje to bez signálu — ale Android takové připomínky umí kvůli šetření baterie odkládat nebo rušit. Když ti nechodí spolehlivě, přidej aplikaci mezi výjimky z optimalizace baterie, nebo používej webovou verzi přidanou na plochu.",
        ],
      },
      {
        heading: "Přihlášení v aplikaci z obchodu",
        paragraphs: [
          "V aplikaci stažené z obchodu se přihlašuje e-mailem a heslem. Tlačítko „pokračovat přes Google“ tam schválně není.",
          "Není to omezení z naší strany. Google přihlašování ke svým účtům uvnitř cizích aplikací zakazuje, a má k tomu dobrý důvod: v takovém okně nevidíš adresní řádek, takže nemáš jak ověřit, že heslo píšeš opravdu Googlu. Kdybychom to tlačítko v aplikaci nechali, klepnutí na něj by skončilo chybovou stránkou od Googlu.",
          "Na webu se přes Google přihlásíš dál, tam se nemění nic. Je to pořád ten samý účet a ty samé cíle.",
          "Přehlásit se na jiný účet jde v aplikaci přes Můj účet a Odhlásit se.",
        ],
        steps: [
          "Máš účet přes Google a chceš do aplikace? Na přihlašovací stránce klepni na „Zapomenuté heslo?“.",
          "Zadej adresu, pod kterou účet přes Google máš.",
          "Otevři odkaz, který ti přijde e-mailem, a zvol si heslo.",
          "Tím heslem se přihlásíš v aplikaci. Přihlášení přes Google na webu zůstává — heslo je jen druhá cesta k témuž účtu, ne náhrada.",
        ],
      },
      {
        heading: "Extra: myšlenky, hudba, sdílení",
        paragraphs: [
          "Vedle plánu je v aplikaci stránka Extra — tlačítko najdeš v hlavičce vedle přepínače vzhledu. Všechno na ní je zdarma a přístupné i bez účtu.",
          "Myšlenka na den je krátký text na ráno. Jeden denně ti může chodit do oznámení, ale přečíst si jde kterákoli a kdykoli, a dá se nechat přečíst nahlas. Úplný seznam je na vlastní stránce.",
          "Hudba jsou skladby, které vznikly k příspěvkům na sítích. Hodí se na rozjezd, na soustředění nebo jen tak.",
          "Text i skladbu jde sdílet QR kódem. Rozklikneš kód, ukážeš ho z obrazovky a druhý člověk si to otevře u sebe — bez posílání odkazu a bez účtu.",
        ],
      },
      {
        heading: "Účet, platba a odchod",
        paragraphs: [
          "Účet a předplatné se zakládá na webu. Platí se měsíčně nebo ročně, ročně vychází dva měsíce zdarma.",
          "Začíná se sedmidenní zkouškou zdarma. Kartu u toho zadáváš — bez ní by nebylo na čem předplatné spustit — ale během těch sedmi dnů se nic nestrhne a zrušit jde kdykoliv. Dva dny před koncem ti přijde e-mail, aby tě přechod na placené nepřekvapil. Zkouška se dává jednou; kdo předplatné už měl a zrušil ho, ji podruhé nedostane.",
          "Předplatné zrušíš v aplikaci jedním tlačítkem. Doběhne do konce zaplaceného období — zaplacený čas se neukrajuje — a pak se samo neobnoví. Do té doby jde zrušení vzít zpátky.",
          "Účet můžeš smazat v nastavení. Není to deaktivace: cíle, plány, úkoly i nahrané obrázky se opravdu smažou. Podrobnosti o tom, co zůstává a proč, jsou na samostatné stránce o rušení účtu.",
        ],
      },
      {
        heading: "Co se děje s tím, co do aplikace napíšeš",
        paragraphs: [
          "Názvy a popisy cílů i úkolů jsou v databázi uložené zašifrované. Text cíle se posílá jazykovému modelu, který z něj plán sestaví — jinam neodchází, k reklamě se nepoužívá a nikdo ho nečte kvůli zvědavosti.",
          "Obrázky se při nahrání překódují, čímž se z nich odstraní metadata včetně údajů o poloze. Zobrazují se jen tobě po přihlášení.",
          "Podrobně je to popsané v zásadách ochrany osobních údajů.",
        ],
      },
    ],
  },

  en: {
    intro:
      "AlmostThere takes your goal and your deadline and turns them into a plan that reaches all the way down to today. This guide covers everything the app does, in the order you will need it. You do not have to read it start to finish — each section stands on its own.",
    sections: [
      {
        heading: "What the app actually does",
        paragraphs: [
          "You give it a goal and the date by which you want it done. It works backwards: it divides the way there into monthly phases, each phase into weeks, and the nearest weeks into concrete daily tasks. In the morning you open the app and see a list for today.",
          "The difference from a to-do list is that you do not write it yourself. The app knows how much time is left until the deadline and how much you have each day, and divides the work accordingly. When you start falling behind, it speaks up and offers a way out.",
        ],
      },
      {
        heading: "Before your first goal: settings",
        paragraphs: [
          "Three values in settings shape every plan, and they apply to all your goals together. It is worth going through them before you create anything — plans are built on them, and changing them later means replanning.",
          "How much time you have for goals each day. Not how much you would like, but how much you manage even in a bad week. An inflated number is the most common reason plans collapse.",
          "How often you want a day off. Choose none, one or two days a week, or every other day. Rest days are items in the plan, not gaps in it.",
          "How many minutes a day for reflection. A short moment to note what worked and what did not. Zero turns it off.",
          "Plus your time zone, so the app knows when your day starts.",
        ],
      },
      {
        heading: "Templates: when you do not want to start from an empty box",
        paragraphs: [
          "The empty “what is your goal?” is the hardest place in the whole app. Write “lose weight” and you get an average plan — not because the app cannot do better, but because there was nothing in the brief to work from.",
          "A template does not make that step easier by filling in boxes for you. It carries expertise: the order that cannot be skipped, the usual mistake that makes people give up, what counts as progress, and what gets cut first when you stop keeping up. The plan is built on that, and it is the part you never see.",
          "Instead of a single “where are you starting from?”, a template asks three specific things that decide how this particular route should go. Those answers are what the app would otherwise have to guess.",
          "You will find templates on the button next to New goal. Each one has its own page saying in advance how the plan runs and what gets sacrificed first — and that page is public, so you can send it to anyone, account or not.",
          "A template is a shortcut, not a requirement. A goal written from scratch works exactly the same way.",
        ],
      },
      {
        heading: "How to create a goal",
        paragraphs: [
          "The goal matters more than anything else. The more specific it is, the more usable the plan.",
        ],
        steps: [
          "Write the goal in one sentence. “Run a half marathon” beats “get fit”, because the first one tells you when you are done.",
          "Choose a deadline. After the breakdown the app tells you whether it is realistic — and if it is not, why.",
          "In the description add what the app should know: why you are doing it, what limits you, what matters to you.",
          "In the “what you already have” field write where you are starting from. Without it, the plan looks the same for a beginner and for someone half way there.",
          "Pick a colour. In the daily list it tells you at a glance which goal a task belongs to.",
          "Click Break the goal down. It takes half a minute to a minute; leave the page open.",
        ],
      },
      {
        heading: "What you get",
        paragraphs: [
          "First you see how the app understood your goal, and an assessment of whether the deadline is realistic. Read it — this is the only moment when a misunderstanding can be caught before half a year gets planned around it.",
          "Below that are the phases: month-long stretches with a description of what should be done by the end of each. Detail is filled in gradually — the nearest period down to weeks and days, the more distant ones staying as rough phases until their turn comes. It saves time and cost, and above all it leaves room for the road to change along the way.",
        ],
      },
      {
        heading: "Everyday use",
        paragraphs: [
          "The main screen shows today: tasks from all running goals, each in its colour, with an estimate of how long it takes. You tick them off as you go.",
          "Every task carries instructions for how to do it today — a few steps, not one sentence. The last step is usually one that proves the work landed rather than merely happened: explaining it out loud, one harder example, doing the same thing again without help. Anyone can tick off “I spent time on it”; that is not the point.",
          "On goals where you are learning something, tasks will sometimes send you to talk a topic through with an AI chat — including when you have no materials at all. It is a source every single person already has, it costs nothing, and it answers at your level for as long as it takes. The task tells you exactly what to ask, and often to have the chat test you afterwards. We recommend Claude.ai, but any chat you like works.",
          "Above the list is a week strip with day abbreviations. Ticked days carry a check mark, today is highlighted. You can click through the whole week backwards and forwards — useful when you want to fill in yesterday or see what tomorrow holds.",
          "Below that is a strip of the last thirty days. It is not a grade, just a picture of how it is actually going.",
        ],
      },
      {
        heading: "What to do when a task cannot be done today",
        paragraphs: [
          "Sometimes a task cannot be done for reasons the plan cannot know about — you do not have the money right now, you are waiting for someone else, it is raining. That is why every task has a “Not today” button.",
          "It offers to move the task to tomorrow, to a specific date, or to set it aside without a date. The task is not swapped or replaced by another one — it is the same task on a different day. You can add why it did not work; that gets used when the plan is recalculated.",
          "Do not tick off what you did not do. The app calculates your pace from the days you tick and advises you from that pace — one false tick and it starts telling you that you are on track.",
          "If postponing leaves nothing else for today, the app offers tasks from the coming days that you can take instead. The plan does not grow, it just moves forward.",
          "Tasks set aside without a date have their own list below the daily plan. They do not nag, but they do not disappear either — you can give them a date at any time.",
        ],
      },
      {
        heading: "When you fall behind",
        paragraphs: [
          "A missed day is nothing. But when three days in the last two weeks pass with nothing done, the app speaks up and offers two ways forward.",
          "Catching up means leaving the deadline alone and replanning the rest so it still fits. Recalculating the deadline means moving the date to one that matches the pace you actually keep.",
          "You always choose. The app never moves your deadline on its own, and if you decline, it does not ask again for a week.",
          "Unfinished tasks from the last seven days appear above today's list. You can tick them off late, postpone them, or let them go — sometimes that is the right answer.",
          "One practical tip: replan in the morning rather than in the evening. The new plan has to start today, so today's tasks are replaced by new ones — and anything you have already ticked off today goes with them. Ticked days from the past and your overall completion rate are never touched.",
          "One more thing worth knowing: daily tasks are written out for the current period and the next one, so an absence of up to about two weeks is covered — enough for illness or a holiday. If you stay away longer, the days in between are left without tasks and the plan picks up when you return. Those empty days count as missed when your pace is judged, so on your return the app will tell you that you have slipped and offer to recalculate the deadline.",
        ],
      },
      {
        heading: "When the plan does not suit you",
        paragraphs: [
          "Replanning after a slip deals with not keeping up. Sometimes the trouble is elsewhere: the tasks fit the goal, they just do not fit you. Running works in a forest and on a track, studying works in the morning and in the evening — and a plan you do not want is a plan you will not follow.",
          "So the goal page has an Adjust the route button. You write in your own words what should go differently, and the rest of the plan is reworked around it. The deadline stays and so does the goal.",
          "Whatever is genuinely needed to reach the goal stays in the plan, even if it sits awkwardly with the request. If the two cannot be reconciled at all, you will be told why — the app would rather say so than quietly obey and leave the goal out of reach.",
        ],
      },
      {
        heading: "Milestones and rewards",
        paragraphs: [
          "Every phase of the plan ends with a milestone — a point where there is something to show. To each one you can attach a reward you give yourself for getting there.",
          "Write the reward yourself, or have one suggested. For a suggestion to be worth anything, fill in what you enjoy and what does nothing for you in settings. Without that you get the average, which suits almost nobody.",
          "A long goal gives no feedback for months. The milestone is what keeps it alive.",
          "The reward for the whole goal sits separately, next to the final test — see the next section. Milestones hold the route together; that last one closes the whole thing.",
        ],
      },
      {
        heading: "How the goal ends",
        paragraphs: [
          "Every plan has a final test: one concrete thing that proves the goal is reached. It is rarely a test in the school sense. More often it is the thing itself, done for real — the finished drawing rather than another exercise, the race rather than another training run, half an hour of conversation with someone who does not slow down for you.",
          "Three things make it count: it is done unaided, under real conditions, and in one go rather than in pieces over weeks. You see it from day one at the top of the goal page, because the whole plan is worked backwards from it. The last stretch of the plan is set aside for it.",
          "Next to it is the reward for finishing. You either write it yourself or have one suggested, the same as with milestones — only bigger, because it closes months of work. It stays visible the whole way rather than appearing at the end: knowing what is waiting is half the reason for getting there.",
        ],
      },
      {
        heading: "When the goal is done",
        paragraphs: [
          "Once there is nothing left to tick off, the app asks — not before. It used to ask throughout the final week, and a goal could be closed too early that way; now it speaks up when today holds nothing more, or when the deadline has passed and the day is done.",
          "At that point you have three options. I have finished closes the goal. Not yet closes the window and asks another time. And the third is I want to take it further: the goal is at its end, but not the way you pictured it. You write what is still missing, give a new date, and the rest of the plan is written out.",
          "Closing a goal is not a change of status in a database. You get your own page with a summary of what you went through and the numbers: how many days, how many tasks, how many rest days, how many stages. That is also where you take your final reward.",
          "And then you are offered a follow-up. A new goal that comes out of the finished one — after a sketching course, landscape, say. It does not start from zero: it knows where you got to. The original stays among your finished goals and the celebration stands.",
          "Finished goals have a collection of their own. Most people never finish the goal they set; this is where it stays visible that you did.",
        ],
      },
      {
        heading: "Several goals at once",
        paragraphs: [
          "You can run up to five goals side by side. They are planned together, so they do not land on the same days and do not exceed the time you set aside.",
          "For each goal you set its importance. Daily capacity is divided accordingly — a more important goal gets more time.",
          "A goal can be paused at any time; it stops appearing in the daily plan and stops claiming capacity. A pause can last for months. When you start it again, the rest of the plan and the deadline move forward by exactly as long as the goal stood still — you pick up where you left off, only with today's dates. Nothing is generated again and it costs nothing; the order and the spacing stay as they were. What happened before the pause is not rewritten.",
          "To each goal you can upload images that remind you why you are doing it. One of them appears with your daily list; the more you add, the more variety you get.",
        ],
      },
      {
        heading: "How much you can use",
        paragraphs: [
          "Five concurrent goals and ten new plans a month. A new plan counts when you create a goal or replan an entire goal.",
          "Everything else is unlimited and does not count: breaking phases into weeks and days, the daily tasks, reward suggestions. Someone who creates a goal and works on it will not use half of the allowance in a month.",
          "Above that there is a monthly cap on AI spending, shown in the app as a percentage. It is set so that ordinary use never reaches it — it catches mistakes and abuse, not customers.",
        ],
      },
      {
        heading: "The app on your phone",
        paragraphs: [
          "The site works in a mobile browser and can be added to your home screen, from where it opens full screen without an address bar. Step-by-step instructions for iPhone and Android are on the install page.",
          "In the app from the store you can turn on a daily reminder: your phone speaks up at a time you choose, even when the app is closed. It is scheduled on the phone itself, so nothing about it leaves for our server and it works without a signal.",
          "Wherever you open the app from, you sign in with the same account and find the same goals.",
        ],
      },
      {
        heading: "The morning reminder and the thought for the day",
        paragraphs: [
          "In the morning the app sends you a short text — the thought for the day. The notification shows today's topic and the first sentence; tapping it opens the whole thing, and you can have it read aloud. It arrives even on days when you have no goal running.",
          "You turn it on in Important settings. Right below the settings there is a “Send a test notification” button — use it. It answers within a second and it is the only way to check that notifications really arrive without waiting until morning.",
          "Notifications are set up per browser and per device, not per account. Turning them on at your computer tells your phone nothing. On every device where you want them, you have to turn them on again — and on every device you can turn them off separately.",
          "Delivery is handled by your browser, not by us. We hand the message to its push service and our part ends there. That is why it can arrive late when a device is off or offline — it waits and is delivered once the device checks in. And it is why the test says “sent”: beyond that point we cannot see.",
        ],
        steps: [
          "Nothing arrived and the test says the browser is not subscribed: switch reminders to “Never” and back. That recreates the subscription.",
          "The browser never asked for permission: it probably has notifications blocked for this site. Allow them in its settings for this address.",
          "On iPhone, notifications only work once the app is added to the home screen — not in Safari itself. That is a system limitation.",
          "The app from the store works differently: there the reminder is scheduled by the phone itself. Nothing is sent from a server and it works offline — but Android can delay or cancel such reminders to save battery. If they are unreliable, add the app to the battery optimisation exceptions, or use the web version added to your home screen.",
        ],
      },
      {
        heading: "Signing in inside the store app",
        paragraphs: [
          "In the app from the store you sign in with your e-mail and password. The “continue with Google” button is deliberately not there.",
          "This is not a limitation on our side. Google does not allow signing in to its accounts inside other people's apps, and it has a good reason: in a window like that you cannot see the address bar, so you have no way to check that you are typing your password to Google and not to someone else. If we left the button in the app, tapping it would end on an error page from Google.",
          "On the website you can still sign in with Google; nothing changes there. It is the same account and the same goals.",
          "To switch to a different account inside the app, go to My account and sign out.",
        ],
        steps: [
          "Created your account with Google and want to use the app? On the sign-in page, tap “Forgot your password?”.",
          "Enter the address your Google account uses.",
          "Open the link that arrives by e-mail and choose a password.",
          "That password signs you in inside the app. Signing in with Google on the website still works — the password is a second way into the same account, not a replacement.",
        ],
      },
      {
        heading: "Extras: thoughts, music, sharing",
        paragraphs: [
          "Alongside the plan there is an Extras page — the button is in the header, next to the appearance switch. Everything on it is free and open without an account.",
          "The thought for the day is a short piece of writing for the morning. One a day can come to you as a notification, but you can read any of them at any time, and have them read aloud. The full list has its own page.",
          "The music is made up of tracks written for posts on social media. Good for getting going, for concentrating, or for nothing in particular.",
          "A piece of writing and a track can both be shared by QR code. Open the code, hold the screen up, and the other person opens it on their own device — no link to send and no account needed.",
        ],
      },
      {
        heading: "Account, payment and leaving",
        paragraphs: [
          "Accounts and subscriptions are set up on the web. You pay monthly or yearly; yearly works out as two months free.",
          "It starts with a seven-day free trial. You do enter a card — there would be nothing to start the subscription on otherwise — but nothing is taken during those seven days and you can cancel at any point. Two days before the end you get an email, so the switch to paying does not catch you out. The trial is given once; anyone who has had a subscription and cancelled it does not get a second one.",
          "You cancel the subscription in the app with one button. It runs to the end of the period you have paid for — paid time is never cut short — and then does not renew. Until then the cancellation can be undone.",
          "You can delete your account in settings. This is not deactivation: goals, plans, tasks and uploaded images really are deleted. What remains and why is set out on a separate page about closing an account.",
        ],
      },
      {
        heading: "What happens to what you write here",
        paragraphs: [
          "The titles and descriptions of your goals and tasks are stored encrypted. The text of your goal is sent to a language model that builds the plan from it — it goes nowhere else, is never used for advertising, and nobody reads it out of curiosity.",
          "Images are re-encoded on upload, which strips their metadata including location data. They are shown only to you, after signing in.",
          "The full detail is in the privacy policy.",
        ],
      },
    ],
  },

  de: {
    intro:
      "AlmostThere nimmt dein Ziel und deinen Termin und macht daraus einen Plan, der bis zum heutigen Tag hinunterreicht. Diese Anleitung geht alles durch, was die App kann, in der Reihenfolge, in der du es brauchen wirst. Du musst sie nicht von vorne bis hinten lesen — jeder Abschnitt steht für sich.",
    sections: [
      {
        heading: "Was die App eigentlich macht",
        paragraphs: [
          "Du nennst ihr ein Ziel und das Datum, bis zu dem es geschafft sein soll. Sie rechnet rückwärts: Sie teilt den Weg in Monatsphasen, jede Phase in Wochen und die nächsten Wochen in konkrete Tagesaufgaben. Morgens öffnest du die App und siehst eine Liste für heute.",
          "Der Unterschied zu einer To-do-Liste: Du schreibst sie nicht selbst. Die App weiß, wie viel Zeit bis zum Termin bleibt und wie viel du täglich hast, und teilt die Arbeit danach auf. Wenn du in Rückstand gerätst, meldet sie sich und bietet einen Weg an.",
        ],
      },
      {
        heading: "Vor dem ersten Ziel: Einstellungen",
        paragraphs: [
          "Drei Werte in den Einstellungen prägen jeden Plan und gelten für alle deine Ziele zusammen. Es lohnt sich, sie durchzugehen, bevor du etwas anlegst — Pläne bauen darauf auf, und sie später zu ändern bedeutet umzuplanen.",
          "Wie viel Zeit du täglich für Ziele hast. Nicht wie viel du gern hättest, sondern wie viel du auch in einer schlechten Woche schaffst. Eine zu hohe Zahl ist der häufigste Grund, warum Pläne zusammenbrechen.",
          "Wie oft du frei haben willst. Zur Wahl stehen kein freier Tag, ein oder zwei Tage pro Woche oder jeder zweite Tag. Freie Tage sind Teil des Plans, keine Lücken darin.",
          "Wie viele Minuten täglich zum Innehalten. Ein kurzer Moment, um festzuhalten, was lief und was nicht. Null schaltet es ab.",
          "Dazu die Zeitzone, damit die App weiß, wann dein Tag beginnt.",
        ],
      },
      {
        heading: "Vorlagen: wenn du nicht bei einem leeren Feld anfangen willst",
        paragraphs: [
          "Das leere „Was ist dein Ziel?“ ist die schwerste Stelle der ganzen App. Wer „abnehmen“ schreibt, bekommt einen durchschnittlichen Plan — nicht weil die App es nicht besser könnte, sondern weil in der Vorgabe nichts war, woraus sich etwas machen ließe.",
          "Eine Vorlage erleichtert diesen Schritt nicht dadurch, dass sie Felder für dich ausfüllt. Sie bringt Fachwissen mit: die Reihenfolge, die man nicht überspringen kann, den üblichen Fehler, an dem Leute aufgeben, woran man Fortschritt erkennt, und was als Erstes gestrichen wird, wenn du nicht mehr mitkommst. Darauf wird der Plan gebaut, und genau diesen Teil bekommst du nie zu sehen.",
          "Statt eines einzigen „Wo stehst du gerade?“ fragt eine Vorlage drei konkrete Dinge, die genau auf diesem Weg entscheiden. Diese Antworten sind das, was die App sonst raten müsste.",
          "Die Vorlagen findest du über die Schaltfläche neben Neues Ziel. Jede hat eine eigene Seite, auf der vorab steht, wie der Plan verläuft und was zuerst geopfert wird — und diese Seite ist öffentlich, lässt sich also auch ohne Konto an jeden weitergeben.",
          "Eine Vorlage ist eine Abkürzung, keine Bedingung. Ein selbst geschriebenes Ziel funktioniert genauso.",
        ],
      },
      {
        heading: "So legst du ein Ziel an",
        paragraphs: [
          "Am Ziel liegt mehr als an allem anderen. Je konkreter es ist, desto brauchbarer der Plan.",
        ],
        steps: [
          "Schreib das Ziel in einem Satz. „Einen Halbmarathon laufen“ ist besser als „mit Sport anfangen“, weil man beim ersten erkennt, wann es geschafft ist.",
          "Wähle einen Termin. Nach der Aufteilung sagt dir die App, ob er realistisch ist — und wenn nicht, warum.",
          "Schreib in die Beschreibung, was die App wissen soll: warum du es tust, was dich einschränkt, worauf es dir ankommt.",
          "Ins Feld „was du schon hast“ schreib, wo du startest. Ohne das sieht der Plan für Anfänger und für Fortgeschrittene gleich aus.",
          "Wähle eine Farbe. In der Tagesliste erkennst du daran sofort, zu welchem Ziel eine Aufgabe gehört.",
          "Klick auf Ziel aufteilen. Es dauert eine halbe bis eine Minute; lass die Seite offen.",
        ],
      },
      {
        heading: "Was dabei herauskommt",
        paragraphs: [
          "Zuerst siehst du, wie die App dein Ziel verstanden hat, und eine Einschätzung, ob der Termin realistisch ist. Lies das — es ist der einzige Moment, in dem sich ein Missverständnis abfangen lässt, bevor darauf ein halbes Jahr geplant wird.",
          "Darunter stehen die Phasen: Abschnitte über Monate mit einer Beschreibung, was am Ende jeder Phase fertig sein soll. Die Details entstehen nach und nach — der nächste Zeitraum bis auf Wochen und Tage, die ferneren bleiben grobe Phasen, bis sie an der Reihe sind. Das spart Zeit und Kosten und lässt vor allem Raum dafür, dass sich der Weg unterwegs ändert.",
        ],
      },
      {
        heading: "Der tägliche Gebrauch",
        paragraphs: [
          "Der Hauptbildschirm zeigt heute: Aufgaben aus allen laufenden Zielen, jede in ihrer Farbe, mit einer Schätzung, wie lange sie dauert. Du hakst sie ab, während du sie erledigst.",
          "Zu jeder Aufgabe gehört eine Anleitung, wie du sie heute machst — ein paar Schritte, nicht ein Satz. Der letzte Schritt prüft meist, ob die Arbeit angekommen ist und nicht bloß stattgefunden hat: laut erklären, ein schwereres Beispiel, dasselbe noch einmal ohne Hilfe. „Ich habe mich damit beschäftigt“ abzuhaken kann jeder; darum geht es nicht.",
          "Bei Zielen, bei denen du etwas lernst, schicken dich Aufgaben manchmal dazu, ein Thema mit einem KI-Chat durchzusprechen — auch dann, wenn du gar keine Materialien hast. Das ist eine Quelle, die wirklich jeder hat, sie kostet nichts und antwortet auf deinem Niveau, so lange es dauert. Die Aufgabe sagt dir genau, wonach du fragen sollst, und oft auch, dich danach vom Chat abfragen zu lassen. Wir empfehlen Claude.ai, aber jeder Chat funktioniert.",
          "Über der Liste steht eine Wochenleiste mit Tageskürzeln. Abgehakte Tage tragen ein Häkchen, heute ist hervorgehoben. Du kannst die ganze Woche vor- und zurückklicken — praktisch, wenn du gestern nachtragen oder sehen willst, was morgen ansteht.",
          "Darunter liegt eine Leiste der letzten dreißig Tage. Das ist keine Note, nur ein Bild davon, wie es tatsächlich läuft.",
        ],
      },
      {
        heading: "Wenn eine Aufgabe heute nicht geht",
        paragraphs: [
          "Manchmal geht eine Aufgabe aus Gründen nicht, von denen der Plan nichts wissen kann — du hast gerade kein Geld, du wartest auf jemanden, es regnet. Deshalb hat jede Aufgabe einen Knopf „Heute nicht“.",
          "Er bietet an, die Aufgabe auf morgen zu schieben, auf ein bestimmtes Datum, oder sie ohne Datum zurückzustellen. Die Aufgabe wird weder getauscht noch ersetzt — es ist dieselbe Aufgabe an einem anderen Tag. Du kannst dazuschreiben, warum es nicht ging; das fließt ein, wenn der Plan neu gerechnet wird.",
          "Hak nichts ab, was du nicht getan hast. Die App berechnet dein Tempo aus den abgehakten Tagen und rät dir danach — ein falsches Häkchen, und sie behauptet, du liegst gut.",
          "Wenn nach dem Verschieben für heute nichts anderes bleibt, bietet die App Aufgaben aus den nächsten Tagen an, die du stattdessen nehmen kannst. Der Plan wächst dadurch nicht, er rückt nur vor.",
          "Ohne Datum zurückgestellte Aufgaben haben eine eigene Liste unter dem Tagesplan. Sie mahnen nicht, verschwinden aber auch nicht — du kannst ihnen jederzeit ein Datum geben.",
        ],
      },
      {
        heading: "Wenn du in Rückstand gerätst",
        paragraphs: [
          "Ein ausgelassener Tag ist nichts. Wenn aber in den letzten zwei Wochen drei Tage zusammenkommen, an denen nichts geschah, meldet sich die App und bietet zwei Wege an.",
          "Aufholen heißt: Termin lassen und den Rest so umplanen, dass es noch passt. Termin neu berechnen heißt: das Datum auf eines schieben, das zu deinem tatsächlichen Tempo passt.",
          "Du entscheidest immer. Die App verschiebt deinen Termin nie von selbst, und wenn du ablehnst, fragt sie eine Woche lang nicht wieder.",
          "Unerledigtes aus den letzten sieben Tagen erscheint über der heutigen Liste. Du kannst es nachträglich abhaken, verschieben oder ziehen lassen — manchmal ist das die richtige Antwort.",
          "Ein praktischer Hinweis: Plane lieber morgens um als abends. Der neue Plan muss heute beginnen, also werden die heutigen Aufgaben durch neue ersetzt — und was du heute schon abgehakt hast, verschwindet mit ihnen. Abgehakte Tage aus der Vergangenheit und deine Gesamtquote bleiben unangetastet.",
          "Noch eine Sache, mit der du rechnen solltest: Tagesaufgaben werden für den laufenden und den nächsten Zeitraum geschrieben, eine Abwesenheit von etwa zwei Wochen ist also abgedeckt — für Krankheit oder Urlaub reicht das. Bleibst du länger weg, bleiben die Tage dazwischen ohne Aufgaben und der Plan setzt bei deiner Rückkehr wieder an. Diese leeren Tage zählen bei der Tempobewertung als ausgelassen, du erfährst also nach der Rückkehr, dass du in Rückstand bist, und kannst den Termin neu berechnen lassen.",
        ],
      },
      {
        heading: "Wenn der Plan nicht zu dir passt",
        paragraphs: [
          "Das Neuplanen nach einem Rückstand löst das Problem, dass es zeitlich nicht aufgeht. Manchmal liegt es aber woanders: Die Aufgaben passen zum Ziel, nur nicht zu dir. Laufen geht im Wald und auf der Bahn, Lernen geht morgens und abends — und ein Plan, den du nicht willst, ist ein Plan, den du nicht befolgst.",
          "Auf der Zielseite gibt es deshalb die Schaltfläche Richtung anpassen. Du schreibst in eigenen Worten, was anders laufen soll, und der Rest des Plans wird daraufhin überarbeitet. Der Termin bleibt, das Ziel auch.",
          "Was zum Erreichen des Ziels wirklich nötig ist, bleibt im Plan, auch wenn es sich mit dem Wunsch etwas reibt. Ließe sich beides gar nicht vereinbaren, erfährst du warum — die App sagt das lieber, als still zu gehorchen und das Ziel außer Reichweite zu lassen.",
        ],
      },
      {
        heading: "Meilensteine und Belohnungen",
        paragraphs: [
          "Jede Phase des Plans endet mit einem Meilenstein — einem Punkt, an dem es etwas zu zeigen gibt. Zu jedem kannst du eine Belohnung hinterlegen, die du dir gibst, wenn du dort ankommst.",
          "Schreib die Belohnung selbst oder lass dir eine vorschlagen. Damit ein Vorschlag etwas taugt, trag in den Einstellungen ein, was dir Freude macht und was dir nichts sagt. Ohne das kommt der Durchschnitt heraus, der fast niemandem passt.",
          "Ein langes Ziel gibt monatelang keine Rückmeldung. Der Meilenstein hält es am Leben.",
          "Die Belohnung für das ganze Ziel steht getrennt davon, bei der Abschlussprobe — siehe den nächsten Abschnitt. Meilensteine halten den Weg zusammen, jene letzte schließt die ganze Sache ab.",
        ],
      },
      {
        heading: "Womit das Ziel endet",
        paragraphs: [
          "Zu jedem Plan gehört eine Abschlussprobe: eine konkrete Sache, an der sich das Ziel zeigt. Eine Prüfung im schulischen Sinn ist es selten. Eher die Sache selbst, im Ernstfall gemacht — die fertige Zeichnung statt einer weiteren Übung, das Rennen statt eines weiteren Trainings, eine halbe Stunde Gespräch mit jemandem, der für dich nicht langsamer wird.",
          "Drei Dinge machen sie aus: ohne Hilfe, unter echten Bedingungen und am Stück, nicht in Häppchen über Wochen. Du siehst sie vom ersten Tag an oben auf der Zielseite, denn der ganze Plan wird von ihr aus rückwärts entwickelt. Der letzte Abschnitt des Plans ist für sie reserviert.",
          "Daneben steht die Belohnung fürs Durchziehen. Die schreibst du entweder selbst oder lässt dir eine vorschlagen, genau wie bei den Meilensteinen — nur größer, weil sie Monate an Arbeit abschließt. Sie ist die ganze Zeit sichtbar und taucht nicht erst am Ende auf: zu wissen, was wartet, ist die halbe Miete.",
        ],
      },
      {
        heading: "Wenn das Ziel erreicht ist",
        paragraphs: [
          "Sobald nichts mehr abzuhaken ist, fragt die App — vorher nicht. Früher fragte sie die ganze letzte Woche hindurch, und so ließ sich ein Ziel zu früh schließen; jetzt meldet sie sich, wenn für heute nichts mehr ansteht oder wenn der Termin vorbei und der Tag erledigt ist.",
          "Dann hast du drei Möglichkeiten. Ich bin fertig schließt das Ziel ab. Noch nicht schließt das Fenster und fragt ein andermal. Und die dritte ist Ich will es noch weiterführen: Das Ziel ist am Ende, aber nicht so, wie du es dir vorgestellt hast. Du schreibst, was noch fehlt, gibst einen neuen Termin an, und der Rest des Plans wird dazugeschrieben.",
          "Ein Ziel abzuschließen ist keine Statusänderung in einer Datenbank. Du bekommst eine eigene Seite mit einer Zusammenfassung dessen, was du durchgemacht hast, und mit Zahlen: wie viele Tage, wie viele Aufgaben, wie viele Ruhetage, wie viele Etappen. Dort holst du dir auch die Abschlussbelohnung.",
          "Und dann wird dir ein Anschluss angeboten. Ein neues Ziel, das aus dem erreichten hervorgeht — nach einem Skizzenkurs zum Beispiel die Landschaft. Es fängt nicht bei null an: es weiß, wo du gelandet bist. Das ursprüngliche bleibt unter den erreichten Zielen und die Feier gilt.",
          "Erreichte Ziele haben eine eigene Sammlung. Die meisten Menschen bringen ihr Ziel nie zu Ende; hier bleibt sichtbar, dass du es getan hast.",
        ],
      },
      {
        heading: "Mehrere Ziele gleichzeitig",
        paragraphs: [
          "Du kannst bis zu fünf Ziele nebeneinander verfolgen. Sie werden gemeinsam geplant, damit sie nicht auf dieselben Tage fallen und die Zeit nicht überschreiten, die du dafür vorgesehen hast.",
          "Für jedes Ziel legst du seine Wichtigkeit fest. Danach wird die Tageskapazität verteilt — ein wichtigeres Ziel bekommt mehr Zeit.",
          "Ein Ziel lässt sich jederzeit pausieren; es erscheint dann nicht mehr im Tagesplan und beansprucht keine Kapazität. Eine Pause darf ruhig Monate dauern. Wenn du es wieder startest, verschieben sich der restliche Plan und der Termin um genau die Zeit, die das Ziel stillstand — du machst dort weiter, wo du aufgehört hast, nur mit heutigen Daten. Es wird nichts neu erzeugt und es kostet nichts; Reihenfolge und Abstände bleiben, wie sie waren. Was vor der Pause geschah, wird nicht umgeschrieben.",
          "Zu jedem Ziel kannst du Bilder hochladen, die dich daran erinnern, warum du es tust. Eines davon erscheint bei deiner Tagesliste; je mehr du hinzufügst, desto mehr Abwechslung.",
        ],
      },
      {
        heading: "Wie viel du nutzen kannst",
        paragraphs: [
          "Fünf gleichzeitige Ziele und zehn neue Pläne pro Monat. Ein neuer Plan zählt beim Anlegen eines Ziels oder beim Umplanen eines ganzen Ziels.",
          "Alles andere zählt nicht dagegen und ist unbegrenzt: die Aufteilung in Wochen und Tage, die Tagesaufgaben, die Belohnungsvorschläge. Wer ein Ziel anlegt und daran arbeitet, verbraucht im Monat nicht einmal die Hälfte.",
          "Darüber liegt noch eine monatliche Obergrenze für die KI-Kosten, in der App als Prozentwert sichtbar. Sie ist so gesetzt, dass normale Nutzung sie nie erreicht — sie fängt Fehler und Missbrauch ab, nicht Kunden.",
        ],
      },
      {
        heading: "Die App auf dem Handy",
        paragraphs: [
          "Die Website funktioniert im mobilen Browser und lässt sich zum Startbildschirm hinzufügen, von wo sie im Vollbild ohne Adressleiste startet. Eine Schritt-für-Schritt-Anleitung für iPhone und Android steht auf der Installationsseite.",
          "In der App aus dem Store kannst du eine tägliche Erinnerung einschalten: Das Telefon meldet sich zur gewählten Zeit, auch wenn die App geschlossen ist. Sie wird direkt auf dem Telefon geplant, also geht nichts davon an unseren Server, und sie funktioniert auch ohne Empfang.",
          "Egal von wo aus du die App öffnest — du meldest dich mit demselben Konto an und findest dieselben Ziele.",
        ],
      },
      {
        heading: "Die Morgenerinnerung und der Gedanke des Tages",
        paragraphs: [
          "Morgens meldet sich die App mit einem kurzen Text — dem Gedanken des Tages. In der Benachrichtigung stehen das heutige Thema und der erste Satz; ein Tippen öffnet den ganzen Text, und du kannst ihn dir vorlesen lassen. Er kommt auch an Tagen ohne laufendes Ziel.",
          "Eingeschaltet wird das in den Wichtigen Einstellungen. Direkt darunter gibt es den Knopf „Testbenachrichtigung senden“ — nutze ihn. Er antwortet in einer Sekunde und ist die einzige Möglichkeit zu prüfen, dass wirklich etwas ankommt, ohne bis zum Morgen zu warten.",
          "Benachrichtigungen werden pro Browser und pro Gerät eingerichtet, nicht pro Konto. Schaltest du sie am Rechner ein, weiß dein Handy nichts davon. Auf jedem Gerät, auf dem du sie willst, musst du sie erneut einschalten — und auf jedem lassen sie sich einzeln abschalten.",
          "Zugestellt werden sie von deinem Browser, nicht von uns. Wir übergeben die Nachricht seinem Push-Dienst, und damit endet unser Teil. Deshalb kann sie verspätet kommen, wenn ein Gerät aus oder offline ist — sie wartet und wird zugestellt, sobald sich das Gerät meldet. Und deshalb meldet der Test „gesendet“: weiter sehen wir nicht.",
        ],
        steps: [
          "Es kam nichts an und der Test sagt, der Browser sei nicht angemeldet: stell die Erinnerungen auf „Nie“ und zurück. Damit entsteht die Anmeldung neu.",
          "Der Browser hat nie nach Erlaubnis gefragt: wahrscheinlich sind Benachrichtigungen für diese Seite blockiert. Erlaube sie in seinen Einstellungen für diese Adresse.",
          "Auf dem iPhone funktionieren Benachrichtigungen erst, wenn die App auf dem Homescreen liegt — in Safari selbst nicht. Das ist eine Einschränkung des Systems.",
          "Die App aus dem Store arbeitet anders: dort plant das Handy die Erinnerung selbst. Es wird nichts vom Server geschickt und es funktioniert offline — aber Android kann solche Erinnerungen zum Stromsparen verzögern oder streichen. Wenn sie unzuverlässig sind, nimm die App in die Ausnahmen der Akkuoptimierung auf oder nutze die Webversion auf dem Homescreen.",
        ],
      },
      {
        heading: "Anmeldung in der App aus dem Store",
        paragraphs: [
          "In der App aus dem Store meldest du dich mit E-Mail und Passwort an. Die Schaltfläche „Weiter mit Google“ fehlt dort mit Absicht.",
          "Das ist keine Einschränkung von unserer Seite. Google verbietet die Anmeldung bei seinen Konten innerhalb fremder Apps, und das aus gutem Grund: In einem solchen Fenster siehst du die Adressleiste nicht und kannst nicht prüfen, ob du dein Passwort wirklich bei Google eingibst. Ließen wir die Schaltfläche in der App, würde ein Tippen darauf auf einer Fehlerseite von Google enden.",
          "Auf der Website kannst du dich weiterhin mit Google anmelden, dort ändert sich nichts. Es ist dasselbe Konto und es sind dieselben Ziele.",
          "Zu einem anderen Konto wechselst du in der App über Mein Konto und Abmelden.",
        ],
        steps: [
          "Konto über Google erstellt und möchtest die App nutzen? Tippe auf der Anmeldeseite auf „Passwort vergessen?“.",
          "Gib die Adresse ein, die dein Google-Konto verwendet.",
          "Öffne den Link, der per E-Mail kommt, und wähle ein Passwort.",
          "Mit diesem Passwort meldest du dich in der App an. Die Anmeldung mit Google auf der Website bleibt bestehen — das Passwort ist ein zweiter Weg zum selben Konto, kein Ersatz.",
        ],
      },
      {
        heading: "Extras: Gedanken, Musik, Teilen",
        paragraphs: [
          "Neben dem Plan gibt es die Seite Extras — die Schaltfläche steht in der Kopfzeile, neben dem Umschalter fürs Aussehen. Alles darauf ist kostenlos und auch ohne Konto zugänglich.",
          "Der Gedanke des Tages ist ein kurzer Text für den Morgen. Einer pro Tag kann dir als Mitteilung kommen, lesen kannst du aber jeden, jederzeit, und dir vorlesen lassen. Die vollständige Liste hat eine eigene Seite.",
          "Die Musik sind Stücke, die zu Beiträgen in den sozialen Netzen entstanden sind. Gut zum Loslegen, zum Konzentrieren oder einfach so.",
          "Text und Stück lassen sich per QR-Code teilen. Du öffnest den Code, hältst den Bildschirm hin, und die andere Person öffnet es bei sich — ohne Link zu verschicken und ohne Konto.",
        ],
      },
      {
        heading: "Konto, Zahlung und Abschied",
        paragraphs: [
          "Konto und Abonnement werden im Web angelegt. Bezahlt wird monatlich oder jährlich; jährlich entspricht zwei Monaten gratis.",
          "Es beginnt mit sieben Tagen kostenlos zum Ausprobieren. Eine Karte gibst du dabei an — sonst gäbe es nichts, worauf das Abonnement starten könnte —, aber in diesen sieben Tagen wird nichts abgebucht, und kündigen kannst du jederzeit. Zwei Tage vor Ablauf bekommst du eine E-Mail, damit dich der Wechsel ins Bezahlte nicht überrascht. Die Testphase gibt es einmal; wer schon ein Abonnement hatte und es gekündigt hat, bekommt keine zweite.",
          "Das Abonnement kündigst du in der App mit einer Schaltfläche. Es läuft bis zum Ende des bezahlten Zeitraums — bezahlte Zeit wird nie gekürzt — und verlängert sich dann nicht. Bis dahin lässt sich die Kündigung zurücknehmen.",
          "Dein Konto kannst du in den Einstellungen löschen. Das ist keine Deaktivierung: Ziele, Pläne, Aufgaben und hochgeladene Bilder werden wirklich gelöscht. Was bleibt und warum, steht auf einer eigenen Seite über das Schließen des Kontos.",
        ],
      },
      {
        heading: "Was mit dem passiert, was du hier schreibst",
        paragraphs: [
          "Titel und Beschreibungen deiner Ziele und Aufgaben werden verschlüsselt gespeichert. Der Text deines Ziels geht an ein Sprachmodell, das daraus den Plan baut — sonst nirgendwohin, nie für Werbung, und niemand liest ihn aus Neugier.",
          "Bilder werden beim Hochladen neu kodiert, wodurch ihre Metadaten samt Standortangaben verschwinden. Sie werden nur dir nach der Anmeldung gezeigt.",
          "Ausführlich steht das in den Datenschutzhinweisen.",
        ],
      },
    ],
  },
};
