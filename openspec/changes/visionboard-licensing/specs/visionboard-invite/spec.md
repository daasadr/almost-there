# visionboard-invite

## ADDED Requirements

### Requirement: Osobní pozvánka

Každý účet SHALL mít trvalý náhodný kód pozvánky a na stránce Extra odkaz
`/visionboard?ref=<kód>` s možností zkopírovat a sdílet. Uživatel SHALL
tamtéž vidět, kolik lidí se přes jeho pozvánku zaregistrovalo. Kód SHALL NOT
prozrazovat id účtu ani e-mail.

#### Scenario: Zobrazení pozvánky

- **WHEN** přihlášený uživatel otevře stránku Extra
- **THEN** vidí svůj odkaz a může ho zkopírovat
- **AND** odkaz je pokaždé stejný
- **AND** vidí počet lidí, kteří se přes něj zaregistrovali

### Requirement: Veřejná stránka Vision Boardu

`/visionboard` SHALL být veřejná stránka přístupná bez přihlášení a SHALL
fungovat i bez parametru `ref`.

#### Scenario: Otevření bez pozvánky

- **WHEN** někdo otevře `/visionboard` bez `ref`
- **THEN** stránka se zobrazí normálně i s výzvou k registraci

### Requirement: Evidence pozvání

Registrace přes odkaz s platným `ref` SHALL u nového účtu uložit, kdo ho
pozval, a jeho licence SHALL mít `src: "invite"`. Neplatný nebo neznámý
`ref` SHALL být tiše ignorován a SHALL NOT registraci zablokovat.

#### Scenario: Registrace přes pozvánku

- **WHEN** se někdo zaregistruje po příchodu z odkazu s platným `ref`
- **THEN** u jeho účtu je uložený zvoucí
- **AND** jeho licence nese `src: "invite"`

#### Scenario: Podvržený ref

- **WHEN** `ref` neodpovídá žádnému účtu
- **THEN** registrace proběhne normálně a zvoucí se neuloží

#### Scenario: Pozvánka sama nic neodemyká

- **WHEN** někdo otevře odkaz s `ref` a nezaregistruje se
- **THEN** nezíská žádnou licenci ani kód
