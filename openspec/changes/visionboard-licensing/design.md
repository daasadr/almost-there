# Design

## Zdroj pravdy

Rozhraní popisuje `docs/visionboard-api.md` — kopie kontraktu z repa Vision
Boardu, commit `a28c780`. Nic se v něm nemění jednostranně. Když se při
implementaci ukáže, že kontrakt něco neřeší nebo řeší špatně, zapíše se to
sem a navrhne Dagmar; obě strany se mění zároveň a zvedá se verze.

Klon Vision Boardu (`D:\Users\Dasa\vision-board`) je **jen ke čtení**.
Nic se do něj necommituje, `bd` se v něm nespouští.

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
běží jen na serveru v API trasách, do klienta se nedostane. Alternativou by
byl `crypto.sign` z Node, ale `jose` zvládne EdDSA i JWT najednou a používá
ji i příklad v kontraktu, takže se nebudou rozcházet drobnosti ve tvaru.

Soukromý klíč je v `VISIONBOARD_LICENSE_PRIVATE_KEY` (PEM PKCS#8), `kid`
v `VISIONBOARD_LICENSE_KID`. **Nikdy ne s prefixem `NEXT_PUBLIC_`** —
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

Vyplní se při posledním úkolu.

## Odchylky při implementaci

Zatím žádné.
