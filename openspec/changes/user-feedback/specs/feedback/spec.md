# feedback

## ADDED Requirements

### Requirement: Přihlášený uživatel může poslat hlášení

Aplikace SHALL na stránce účtu nabídnout formulář, kterým přihlášený
uživatel pošle volný text o čemkoliv, co mu nevyhovuje — závadě
i nešikovném ovládání.

#### Scenario: Odeslané hlášení se uloží

- **WHEN** přihlášený uživatel odešle text o délce 10 až 4000 znaků
- **THEN** se uloží nové hlášení se stavem „nové"
- **AND** uživatel uvidí potvrzení, že hlášení dorazilo

#### Scenario: Příliš krátký text se odmítne

- **WHEN** uživatel odešle text kratší než 10 znaků
- **THEN** se nic neuloží
- **AND** uživatel se dozví, že má napsat víc

#### Scenario: Nepřihlášený neprojde

- **WHEN** požadavek přijde bez přihlášení
- **THEN** se odpoví stavem 401 a nic se neuloží

### Requirement: Text hlášení je šifrovaný

Text hlášení SHALL být v databázi uložený šifrovaně, stejně jako obsah
cílů a důvody odložení úkolů.

#### Scenario: V databázi není čitelný text

- **WHEN** se hlášení uloží
- **THEN** sloupec s textem neobsahuje zadaný text v čitelné podobě

### Requirement: K hlášení se připojí kontext ze serveru

Aplikace SHALL ke každému hlášení uložit, z které stránky přišlo, jaký
měl uživatel jazyk a zda šlo o aplikaci z obchodu. Tyto údaje SHALL
pocházet ze serveru, ne z těla požadavku.

#### Scenario: Podvržený kontext se ignoruje

- **WHEN** tělo požadavku obsahuje vlastní `path` nebo `locale`
- **THEN** se uloží hodnoty zjištěné na serveru, ne ty z těla

### Requirement: Správce dostane oznámení bez obsahu

Aplikace SHALL po uložení hlášení poslat správcům e-mail s tím, že
hlášení přišlo, od koho (maskovaný e-mail) a z které stránky. E-mail
SHALL NOT obsahovat text hlášení.

#### Scenario: Selhání pošty neshodí hlášení

- **WHEN** se oznámení nepodaří odeslat
- **THEN** hlášení zůstane uložené
- **AND** uživatel uvidí potvrzení

### Requirement: Omezení četnosti

Aplikace SHALL přijmout nejvýš pět hlášení za hodinu od jednoho účtu.

#### Scenario: Šesté hlášení v hodině

- **WHEN** účet odešle šesté hlášení během hodiny
- **THEN** se odpoví stavem 429 a nic se neuloží

### Requirement: Smazání účtu maže hlášení

Smazáním účtu SHALL zmizet i všechna jeho hlášení.

#### Scenario: Po smazání účtu nezbydou hlášení

- **WHEN** se smaže účet, který poslal hlášení
- **THEN** v databázi nezůstane žádné jeho hlášení

### Requirement: Správce vidí hlášení a může je odbavit

Správa SHALL vypsat hlášení od nejnovějšího, s textem, kontextem a
stavem, a SHALL umožnit označit hlášení za vyřízené.

#### Scenario: Výpis vidí jen správce

- **WHEN** stránku správy otevře někdo, kdo není správce
- **THEN** se hlášení nezobrazí
