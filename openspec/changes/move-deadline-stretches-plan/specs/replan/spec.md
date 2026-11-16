# Posun termínu

## ADDED Requirements

### Requirement: Posun termínu mění data, ne obsah

Při posunu termínu kvůli skluzu SHALL zůstat obsah plánu beze změny.
Období si nechají název, milník i pořadí; přepočítají se jejich data
tak, aby zbytek plánu sahal od konce běžícího období k novému termínu.
Model se při tom NESMÍ volat.

#### Scenario: Skluz v polovině cíle

- **WHEN** uživatel posune termín u cíle, který má před sebou další
  období
- **THEN** zůstanou názvy i milníky těch období stejné
- **AND** jejich data se roztáhnou až k novému termínu
- **AND** poslední období končí přesně novým termínem
- **AND** období na sebe navazují bez mezer a bez překryvů
- **AND** nezaznamená se žádná spotřeba modelu

#### Scenario: Běžící období a dnešek

- **WHEN** se posune termín
- **THEN** období, kterým právě dnešek prochází, si nechá svá data
- **AND** rozepsané týdny a dny v něm zůstanou beze změny
- **AND** odškrtnuté úkoly zůstanou odškrtnuté

#### Scenario: Cíl, který už je ve svém posledním období

- **WHEN** se posune termín u cíle, před kterým žádné další období není
- **THEN** se roztahovat nemá co a plán se dopíše modelem jako dosud

### Requirement: Milníky jdou s obdobími

Milník patří období. Když se období přesune, SHALL se s ním přesunout
i datum jeho milníku. Dosažené milníky se NESMÍ hýbat.

#### Scenario: Posun termínu u cíle s milníky

- **WHEN** se posune termín
- **THEN** nedosažené milníky dostanou datum podle nového konce svého
  období
- **AND** dosažené milníky zůstanou na datu, kdy se staly

### Requirement: O propadlé práci rozhoduje uživatel

Při posunu termínu SHALL aplikace nabídnout volbu, co s úkoly, které
zůstaly nesplněné. Bez volby se NESMÍ dít ani jedno.

#### Scenario: Nabídka při posunu termínu

- **WHEN** se uživatel chystá posunout termín a má nesplněné úkoly
  z minulých dnů
- **THEN** se ukáže volba mezi dodělat je a nechat je být
- **AND** je u ní vidět, kolika úkolů se to týká

#### Scenario: Uživatel chce propadlé dodělat

- **WHEN** zvolí, že je chce dodělat
- **THEN** se nesplněné úkoly z minulosti přesunou na nejbližší dny
- **AND** rozloží se po jednom na den, od nejstaršího
- **AND** odpočinek ani odložené úkoly se nevracejí

#### Scenario: Uživatel chce jet dál

- **WHEN** zvolí, že je nechá být
- **THEN** zůstanou propadlé úkoly v minulosti
- **AND** v nadcházejících dnech nepřibude nic

#### Scenario: Cíl bez propadlé práce

- **WHEN** nejsou žádné nesplněné úkoly z minulých dnů
- **THEN** se volba nenabízí a termín se posune rovnou
