# Design

## Zdroj pravdy

Rozhraní popisuje `docs/visionboard-api.md` — kopie kontraktu z repa Vision
Boardu, commit `a28c780`. Nic se v něm nemění jednostranně. Když se při
implementaci ukáže, že kontrakt něco neřeší nebo řeší špatně, zapíše se to
sem a navrhne Dagmar; obě strany se mění zároveň a zvedá se verze.

Klon Vision Boardu (`D:\Users\Dasa\vision-board`) je **jen ke čtení**.
Nic se do něj necommituje, `bd` se v něm nespouští.

## Rozhodnutí Dagmar (12. 10. 2026)

- **Licenci má každý registrovaný, i neplatící.** Je to dárek za přidání se,
  ne odměna za předplatné. Zaniká jen smazáním účtu.
- **Tři zařízení** na účet.
- **Platnost rok s automatickou obnovou.** Zvažovalo se vydávat licence bez
  expirace, ať se „nevyčerpávají". Nejde to: licence se ověřuje offline
  a aplikace se serveru po aktivaci neptá, takže licence bez `exp` je
  neodvolatelná — ani smazání účtu by na ni nedosáhlo. Roční `exp` je
  jediné, co nám nad licencemi nechává kontrolu, a uživatele nic nestojí,
  protože obnovu dělá aplikace sama 14 dní předem. Důsledek, se kterým se
  počítá: po smazání účtu licence doběhne, až vyprší.
- **Vision Board patří na Extra, ne do účtu.** Pozvánka, moje zařízení
  i odkaz ke stažení jsou na jedné stránce; účet má zůstat jednoduchý.
- **Počet přijatých pozvánek** se uživateli ukazuje.
- **Sdílení nastavené nástěnky mezi zařízeními se nedělá.** Data nástěnky
  zůstávají v počítači, synchronizace je mimo rozsah na obou stranách.
  Dodělat by znamenalo ukládat fotky uživatelů na náš server — místo,
  přenosy, šifrování, zálohy a nové povinnosti kolem osobních údajů.
  Samostatné rozhodnutí na jindy, ne součást téhle změny.

## Datový model

Čtyři nové věci v Prismě. Licence sama se neukládá — nárok na ni plyne
z existence účtu, takže zvláštní tabulka „kdo má licenci" by byla jen
kopie seznamu uživatelů, která se rozejde.

- **`VisionBoardInstallation`** — `userId`, `installationId` (z aplikace),
  `platform`, `activatedAt`, `deactivatedAt`, `lastRenewedAt`.
  Unikátní dvojice `(userId, installationId)`: táž dvojice je totéž
  zařízení, takže opakovaná aktivace nezabere další místo. `jti` licence
  je id tohoto záznamu.
- **`VisionBoardActivationCode`** — `codeHash`, `userId`, `challenge`,
  `expiresAt`, `usedAt`. Ukládá se otisk, ne kód: kdo by se dostal
  k databázi, nesmí umět aktivovat cizím jménem.
- **`User.visionBoardRef`** — trvalý náhodný kód pozvánky, unikátní.
  Generuje se líně, až když si ho uživatel poprvé zobrazí; většina
  uživatelů ho nikdy neuvidí a nemá cenu plnit tabulku kódy do zásoby.
- **`User.invitedById`** — kdo koho pozval. Jen pro statistiku.

Šifrování sloupců, které repozitář používá u názvů cílů, se sem nehodí:
`installationId` ani `platform` nejsou osobní text a `codeHash` je otisk.

## Podepisování

Knihovna `jose`, kterou kontrakt uvádí v příkladu. **Dopad na balík žádný** —
běží jen na serveru v API trasách, do klienta se nedostane. V repu už byla
přes NextAuth, ale jen přenesená závislost; teď je přímá, protože spoléhat
na to, co si s sebou tahá někdo jiný, je způsob, jak si jednou ráno
nespustit build. Alternativou by
byl `crypto.sign` z Node, ale `jose` zvládne EdDSA i JWT najednou a používá
ji i příklad v kontraktu, takže se nebudou rozcházet drobnosti ve tvaru.

Soukromý klíč je v `VISIONBOARD_LICENSE_PRIVATE_KEY` (PEM PKCS#8), `kid`
v `VISIONBOARD_LICENSE_KID`. **Veřejný klíč se odvozuje ze soukromého**,
neukládá se zvlášť: dvě proměnné by se mohly rozejít a obnova licencí by
pak tiše odmítala každou platnou — poruchu, kterou nikdo nehledá na
správném místě. **Nikdy ne s prefixem `NEXT_PUBLIC_`** —
takto pojmenovaná proměnná se zapéká do stránky.

Testy se píšou proti vektorům z oddílu 9 kontraktu. Nejsou to naše vektory:
tytéž používají testy Vision Boardu, takže když projdou obě strany, je
jisté, že si budou rozumět. To je jediná kontrola, která tohle ověří dřív,
než se aplikace vydá.

## Aktivační stránka

Zachování parametrů přes přihlášení i registraci řeší `callbackUrl`, který
už přihlašování používá — stejná cesta jako u `/app`. Není potřeba nic
nového, jen se musí hlídat, že se nese celý dotaz, ne jen cesta.

Potvrzení je POST se server action. CSRF ochranu mají server actions v Next
zabudovanou (kontrola `Origin`), takže není nutné nic přidávat — ale je
potřeba to ověřit testem, ne předpokládat.

Přesměrování na `visionboard://activate` se dělá dvakrát: automaticky přes
`window.location` a tlačítkem „Otevřít Vision Board". Prohlížeč se u cizího
schématu často zeptá a automatický pokus může být potlačený, proto to
tlačítko. Cíl je pevný řetězec v kódu; z parametrů se bere jen `state`,
a ten je ověřený jako base64url.

`frame-ancestors 'none'` už nginx posílá pro celý web, takže pro tuhle
stránku nic zvláštního nepřibývá — ale patří to do testu, aby se to
nerozpadlo tiše při příští úpravě hlaviček.

## API

Trasy pod `/api/visionboard/v1/`. Middleware jazyků se jich netýká, jeho
matcher `/api` už vylučuje.

Bez cookies a bez CORS: volá to desktopová aplikace, ne prohlížeč, takže se
hlavičky `Access-Control-*` neposílají vůbec. Kdyby se někdy poslaly, znamenalo
by to, že endpoint jde volat z cizí stránky v prohlížeči uživatele.

Omezení pokusů: 10 za minutu z IP na `/licenses`. Na webu už jedna vrstva
existuje v nginxu pro `/api/demo` a druhá v aplikaci; sem se přidá aplikační,
protože limit má být na endpoint, ne na stroj.

## Pořadí a rizika

Nejdřív model a podepisování, protože bez nich se nedá nic otestovat. Pak
API, pak stránky. Pozvánky a stažení jsou samostatné a dají se udělat kdykoli.

**Největší riziko je vydání klíče.** Dokud je ve Vision Boardu prázdný seznam
produkčních klíčů, licence se nevynucují a všechno je odemčené. Jakmile vyjde
verze s naším veřejným klíčem, začne na webu záviset, jestli lidem aplikace
funguje. Proto je předání klíče poslední úkol a až po review bezpečnosti —
ne naopak.

**Druhé riziko je adresa.** Kontrakt počítá s `https://almost-there.eu` a ta
adresa je zabudovaná v aplikaci. Web na ní běží, takže to sedí; kdyby se
někdy měnila, musí se to říct druhé straně dřív, než se změní.

## Review

Provedeno 19. 10. 2026 nad celým diffem změny, proti hrozbám z oddílu 8
kontraktu a z oddílu „Review bezpečnosti" v CLAUDE.md.

### Nalezeno a opraveno

**Otevřené přesměrování po přihlášení.** Kontrola návratové adresy
vypadala takhle: „začíná lomítkem a ne dvěma". Vypadá správně a není —
`/\evil.com` jí projde, protože začíná jedním lomítkem, jenže prohlížeč
zpětné lomítko v adrese překládá na obyčejné a přečte ji jako
`//evil.com`. Člověk by se přihlásil u nás a skončil na cizí stránce,
která může vypadat jako naše a požádat o heslo znovu.

Horší bylo, kde to sedělo. Serverová kontrola hlídala jen odkazy
a tlačítko Google; **`LoginForm` si parametr četl z adresy sám** a
rovnou na něj navigoval, takže oprava jen na serveru by díru nechala
otevřenou a vypadala by jako hotová.

Opraveno rozborem adresy přes `URL` a porovnáním domény, ne porovnáváním
začátku řetězce — co projde tím, projde i prohlížeči, protože je to
tentýž výpočet. Deset testů, každý je buď útok, nebo běžná adresa.
Viz `src/lib/auth/safe-redirect.ts`.

Nález vznikl mimo rozsah téhle změny: ta kontrola tam přibyla kvůli
návratu z aktivace. O to je to lepší argument pro to dělat review nad
celým diffem a ne jen nad tím, co se zrovna navrhovalo.

### Prověřeno a v pořádku

- **Vložení do rámu.** `frame-ancestors 'none'` i `X-Frame-Options:
  DENY` chodí na všech stránkách, ověřeno na živém webu.
- **Potvrzení aktivace.** Serverová akce, tedy POST s kontrolou původu.
  Z formuláře se nebere nic: účet ze session, `challenge` z cookie,
  kterou píšeme my. Otevření adresy kód nevydá.
- **Odebrání zařízení.** Metoda DELETE vyvolá u cizí domény předběžný
  dotaz, na který neodpovídáme, takže se požadavek vůbec neodešle.
  Formulářem se DELETE poslat nedá.
- **Žádné CORS** na rozhraní pro aplikaci. Kdyby tam bylo, šlo by ho
  volat z cizí stránky v prohlížeči uživatele.
- **Aktivační kód** se spotřebuje i při špatném tajemství, takže jde
  zkusit jednou. Ukládá se jen otisk.
- **Chybové kódy neprozrazují**, jestli účet existuje: na špatný kód se
  odpovídá dřív než na chybějící nárok a odebrané zařízení vypadá stejně
  jako zaniklý účet.
- **V licenci nic citlivého.** `sub` je neprůhledné id, `label` maskovaný
  e-mail. Token je čitelný a leží na cizím disku.
- **Soukromý klíč** jen v prostředí serveru, nikdy s prefixem
  `NEXT_PUBLIC_`, do logu se nedostane.
- **Strop pokusů** na všech třech veřejných koncových bodech.

### Přijatá rizika

**Limit zařízení není v transakci.** Počet se zjistí a pak se zapisuje,
takže dvě aktivace různých zařízení téhož účtu ve stejné milisekundě
projdou obě a účet skončí se čtyřmi. Vyžaduje to jednoho člověka u dvou
počítačů v tomtéž okamžiku a následek je jedno místo navíc. Řeší se
transakcí; teď to za tu složitost nestojí.

**Kód pozvánky vzniká při GET.** Cizí stránka může navigací vyvolat
jeho vytvoření u přihlášeného uživatele. Odpověď si nepřečte (není
CORS) a jediný následek je, že vznikne kód, který by stejně vznikl při
prvním zobrazení. Bez užitku pro útočníka.

**Cookii se zvoucím lze podstrčit.** Kdo přiměje někoho otevřít svůj
odkaz s pozvánkou, připíše si ho, i kdyby ten člověk o Vision Boardu
nikdy neslyšel. Dnes je to bez následku, protože pozvánka nic
neodemyká a nic se za ni nedává. **Jakmile se za pozvané začne cokoliv
odměňovat, musí se to přehodnotit** — spolu se sebepozváním přes druhý
účet, které je dnes stejně bezvýznamné a tehdy přestane být.

## Odchylky při implementaci

**12. 10. 2026 — migrace se neověřila proti databázi.** Úkol 1.1 počítal
s `prisma migrate deploy` na čisté databázi. Na vývojovém stroji není
Docker ani lokální Postgres, takže to nešlo.

Ověřeno náhradou, která nepotřebuje databázi: `prisma migrate diff
--from-empty --to-schema` vygeneruje SQL, které by Prisma pro tohle
schéma napsala sama, a to se porovnalo s ručně psanou migrací. Těla obou
tabulek sedí řádek po řádku, indexy a cizí klíče včetně `ON DELETE` taky.
Zbývá riziko, že se migrace nesnese s **existujícími** daty na serveru —
to tahle kontrola neodhalí. U čistě přidávající migrace bez `NOT NULL`
sloupců bez výchozí hodnoty je ale malé.

Přibyl `prisma/migrations/migration_lock.toml`. Chyběl, protože migrace
v tomhle repu vznikaly ručně, ne přes `prisma migrate dev`. Bez něj
nástroje nepoznají, na jaký databázový stroj jsou migrace psané.
