# visionboard-activation

## ADDED Requirements

### Requirement: Stránka aktivace vyžaduje přihlášení a zachová parametry

Stránka `/visionboard/activate` SHALL vyžadovat přihlášení. Nepřihlášenému
SHALL nabídnout přihlášení i registraci a po nich ho SHALL vrátit na tutéž
adresu se stejnými parametry.

#### Scenario: Nepřihlášený přichází z aplikace

- **WHEN** nepřihlášený otevře `/visionboard/activate?v=1&challenge=<C>&state=<S>&platform=windows`
- **THEN** uvidí nabídku přihlášení i registrace
- **AND** po dokončení skončí zpět na téže adrese se stejnými `challenge`,
  `state` i `platform`

### Requirement: Validace parametrů aktivace

Systém SHALL ověřit, že `challenge` je 43 znaků base64url a `state` je
nejvýše 64 znaků base64url. Neplatný vstup SHALL vést k chybové stránce
a SHALL NOT se nikam propsat.

#### Scenario: Podvržený challenge

- **WHEN** `challenge` nemá 43 znaků base64url
- **THEN** stránka ukáže chybu a nevydá kód

#### Scenario: State se vrací beze změny

- **WHEN** je `state` platný
- **THEN** se vrátí v přesměrování nezměněný

### Requirement: Kód se vydá až potvrzením, ne otevřením adresy

Aktivační kód SHALL vzniknout až po potvrzení odeslaném metodou POST
s ochranou proti CSRF. Samotné otevření adresy SHALL NOT kód vydat.

#### Scenario: Samotné otevření stránky

- **WHEN** přihlášený uživatel stránku jen otevře
- **THEN** žádný kód nevznikne a uživatel vidí potvrzovací tlačítko

#### Scenario: Potvrzení bez platného tokenu

- **WHEN** přijde POST bez platné ochrany CSRF
- **THEN** systém požadavek odmítne a kód nevydá

### Requirement: Tvar a životnost aktivačního kódu

Kód SHALL mít 12 znaků z abecedy `ABCDEFGHJKMNPQRSTVWXYZ23456789`, SHALL
být kryptograficky náhodný, platit 10 minut a jít použít jednou. Ukládá se
SHALL jen jeho otisk, ne kód sám, spolu s účtem a `challenge`.

#### Scenario: Zobrazení kódu

- **WHEN** je kód vydán
- **THEN** stránka ho ukáže ve tvaru `ABCD-EFGH-JKMN`
- **AND** uvede, že se dá opsat do aplikace, pokud se neotevřela sama

#### Scenario: Kód po deseti minutách

- **WHEN** se kód uplatní po více než 10 minutách
- **THEN** API odpoví `400 expired_code`

### Requirement: Návrat do aplikace jen na pevnou adresu

Přesměrování SHALL mířit výhradně na `visionboard://activate` s kódem
a vráceným `state`. Cíl SHALL NOT pocházet z parametrů požadavku.

#### Scenario: Pokus o přesměrování jinam

- **WHEN** požadavek obsahuje parametr s cizí adresou
- **THEN** systém ho ignoruje a přesměruje na `visionboard://activate`

### Requirement: Ochrana stránky proti vložení do rámu

Stránka aktivace SHALL být nevložitelná do cizího rámu
(`frame-ancestors 'none'`).

#### Scenario: Pokus o vložení do rámu

- **WHEN** se stránka načte uvnitř `iframe` na cizí doméně
- **THEN** prohlížeč její zobrazení odmítne
