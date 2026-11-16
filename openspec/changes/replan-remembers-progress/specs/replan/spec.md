# Přeplánování cíle v běhu

## ADDED Requirements

### Requirement: Hotová práce se do nového plánu nevrací

Při přeplánování cíle SHALL plán vycházet z toho, co už člověk udělal.
Práce, která je prokazatelně hotová, se do nového plánu nesmí dostat
podruhé.

#### Scenario: Cíl v polovině cesty

- **WHEN** se přeplánovává cíl, na kterém jsou odškrtané úkoly a
  dosažené milníky
- **THEN** zadání pro model obsahuje názvy dosažených milníků
- **AND** obsahuje názvy posledních odškrtaných úkolů
- **AND** obsahuje datum, odkdy se na cíli pracuje
- **AND** obsahuje pokyn, že hotové se znovu neplánuje

#### Scenario: Cíl, na kterém zatím nic není

- **WHEN** se přeplánovává cíl bez jediného odškrtnutí
- **THEN** se seznamy hotového v zadání neobjeví vůbec
- **AND** zadání nepředstírá postup, který se nestal

### Requirement: Výchozí bod je historie, ne dnešní úroveň

Pole `startingPoint` popisuje, odkud člověk vycházel při zakládání
cíle. Při přeplánování SHALL být označené jako minulost, aby se podle
něj neplánovala znovu cesta pro začátečníka.

#### Scenario: Přeplánování po měsících práce

- **WHEN** se přeplánovává cíl, který má vyplněný `startingPoint`
- **THEN** je u něj v zadání uvedeno, že jde o stav při založení cíle
- **AND** je u něj datum založení
- **AND** zadání odkazuje na soupis hotového jako na dnešní stav

#### Scenario: První rozpad cíle

- **WHEN** se cíl rozpadá poprvé
- **THEN** `startingPoint` zůstává popsaný jako dnešní stav člověka

### Requirement: Odborný pokyn ze šablony platí na zbytek cesty

Pokyn ze šablony se používá i při přeplánování. Popisuje ale celý
oblouk od začátku, takže SHALL být při přeplánování doplněn o to, že
člověk je už kus za jeho začátkem.

#### Scenario: Šablona s předepsaným začátkem

- **WHEN** se přeplánovává cíl ze šablony, jejíž pokyn předepisuje
  úvodní kroky („v prvních dnech něco, co běží")
- **THEN** zadání u pokynu uvádí, že popisuje cestu od začátku
- **AND** žádá, aby se použil na to, co je ještě před člověkem

### Requirement: Rozpad na týdny a dny zná dosažené milníky

Nižší úrovně rozpadu SHALL dostat seznam dosažených milníků cíle, aby
se hotová věc neobjevila jako denní úkol ani v případě, že se do
souhrnu období nějak dostala.

#### Scenario: Rozpis týdne po přeplánování

- **WHEN** se rozepisuje týden cíle, který má dosažené milníky
- **THEN** zadání obsahuje jejich seznam
- **AND** pokyn, že se už neplánují
