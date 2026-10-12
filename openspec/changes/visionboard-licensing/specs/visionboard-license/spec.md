# visionboard-license

## ADDED Requirements

### Requirement: Licenci má každý registrovaný účet

Nárok na licenci Vision Boardu SHALL mít každý uživatel s potvrzeným účtem,
bez ohledu na předplatné. Nárok SHALL zaniknout jen smazáním účtu.

#### Scenario: Registrovaný uživatel bez předplatného

- **WHEN** uživatel bez aktivního předplatného zahájí aktivaci
- **THEN** systém mu vydá aktivační kód jako komukoli jinému

#### Scenario: Uživatel po zrušení předplatného

- **WHEN** uživateli doběhlo zaplacené období a předplatné se neobnovilo
- **THEN** jeho licence zůstává platná a obnova licence projde

#### Scenario: Smazaný účet

- **WHEN** uživatel smaže účet
- **THEN** všechny jeho instalace jsou označené za deaktivované
- **AND** obnova jeho licence vrátí `403 revoked`
- **AND** už vydaná licence doběhne, až vyprší — ověřuje se offline,
  takže na ni zpětně nedosáhneme

### Requirement: Licence platí rok a obnovuje se sama

Vydaná licence SHALL mít `exp` nastavené na rok od vydání. Expirace SHALL
být povinná, ne volitelná: licence bez ní je neodvolatelná, protože se
ověřuje offline a aplikace se serveru po aktivaci neptá.

#### Scenario: Běžný uživatel expiraci nepozná

- **WHEN** aplikace 14 dní před koncem platnosti zavolá obnovu
- **THEN** dostane novou licenci se stejným `iid` a novým `exp`
- **AND** uživatel nedělá nic

### Requirement: Evidence instalací

Systém SHALL u každé vydané licence evidovat instalaci: účet,
`installationId` z požadavku, platformu, čas aktivace a čas deaktivace.
Táž dvojice účet + `installationId` SHALL znamenat totéž zařízení.

#### Scenario: Opakovaná aktivace téhož zařízení

- **WHEN** přijde aktivace se stejným `installationId` u téhož účtu
- **THEN** systém použije existující záznam instalace
- **AND** nezabere další místo z limitu zařízení

#### Scenario: Aktivace po deaktivaci

- **WHEN** se aktivuje zařízení, které bylo dříve deaktivované
- **THEN** systém záznam znovu zaktivní a nevytvoří druhý

### Requirement: Limit aktivních zařízení

Účet SHALL mít nanejvýš 3 aktivní instalace. Deaktivované se nepočítají.

#### Scenario: Čtvrté zařízení

- **WHEN** účet má 3 aktivní instalace a přijde aktivace čtvrtého
- **THEN** API odpoví `403 too_many_installations`
- **AND** aktivační kód je i tak zneplatněný

### Requirement: Přehled zařízení na stránce Extra

Uživatel SHALL na stránce Extra vidět svá aktivní zařízení s platformou a datem
aktivace a SHALL je moci jednotlivě odebrat.

#### Scenario: Odebrání zařízení

- **WHEN** uživatel odebere zařízení z přehledu
- **THEN** instalace je označená za deaktivovanou
- **AND** uvolní se místo z limitu
- **AND** obnova licence z toho zařízení vrátí `403 revoked`

### Requirement: Podepsaná licence

Licence SHALL být kompaktní JWT podepsaný EdDSA (Ed25519) soukromým klíčem
z prostředí serveru, s claims podle oddílu 4 kontraktu. Soukromý klíč
SHALL NOT být dostupný v klientském balíku.

#### Scenario: Vydaná licence odpovídá kontraktu

- **WHEN** systém vydá licenci
- **THEN** hlavička obsahuje `alg: EdDSA`, `typ: JWT` a `kid` z prostředí
- **AND** claims obsahují `iss`, `aud`, `sub`, `iid`, `features`, `label`,
  `src`, `jti`, `iat` a `exp`
- **AND** `label` je maskovaný e-mail nejvýše 80 znaků
- **AND** `sub` není e-mail

#### Scenario: Shoda s testovacími vektory

- **WHEN** se podepíše testovacím klíčem z oddílu 9 kontraktu se stejnými
  vstupy, `iat` a `exp`
- **THEN** výsledný token se znak po znaku shoduje s vektorem
