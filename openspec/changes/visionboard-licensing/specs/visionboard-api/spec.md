# visionboard-api

## ADDED Requirements

### Requirement: Výměna kódu za licenci

`POST /api/visionboard/v1/licenses` SHALL přijmout `code`, `verifier`,
`installationId`, `platform` a `appVersion` a při splnění všech podmínek
vrátit `200 { "license": "<JWT>" }`. Server SHALL ověřit, že kód existuje,
neprošel a nebyl použit, že base64url(SHA-256(`verifier`)) odpovídá
uloženému `challenge`, že účet má licenci a že nepřekročí limit zařízení.

#### Scenario: Úspěšná aktivace

- **WHEN** přijde platný kód se správným verifierem
- **THEN** odpověď je `200` s podepsanou licencí pro dané `installationId`

#### Scenario: Špatný verifier

- **WHEN** verifier neodpovídá uloženému challenge
- **THEN** odpověď je `400 invalid_code`
- **AND** kód je zneplatněný, takže druhý pokus se stejným kódem selže taky

#### Scenario: Normalizace kódu

- **WHEN** přijde kód s pomlčkami nebo malými písmeny
- **THEN** server ho normalizuje a přijme

### Requirement: Obnova licence

`POST /licenses/renew` SHALL přijmout stávající licenci, ověřit vlastní
podpis (i u licence prošlé nejvýše 90 dní), že instalace není deaktivovaná
a že účet licenci pořád má, a vrátit novou licenci se stejným `iid` a `sub`.

#### Scenario: Obnova krátce po expiraci

- **WHEN** přijde licence prošlá 30 dní
- **THEN** odpověď je `200` s novou licencí, stejným `iid` a novým `exp`

#### Scenario: Obnova deaktivovaného zařízení

- **WHEN** instalace byla deaktivovaná
- **THEN** odpověď je `403 revoked`

#### Scenario: Cizí podpis

- **WHEN** licence není podepsaná naším klíčem
- **THEN** odpověď je `400 invalid_license`

### Requirement: Deaktivace zařízení

`POST /licenses/deactivate` SHALL označit instalaci za deaktivovanou
a odpovědět `204`, i když už deaktivovaná byla.

#### Scenario: Opakovaná deaktivace

- **WHEN** se deaktivace zavolá podruhé
- **THEN** odpověď je `204` a nic dalšího se nestane

### Requirement: Chybové kódy podle kontraktu

Chyby SHALL mít tvar `{ "error": "<kód>", "message": "<text pro log>" }`
s kódy a stavy podle oddílu 3.4 kontraktu. Zprávy SHALL NOT obsahovat
citlivé údaje.

#### Scenario: Chybějící pole

- **WHEN** v těle chybí `installationId`
- **THEN** odpověď je `400 invalid_request`

#### Scenario: Účet bez licence

- **WHEN** účet nárok na licenci nemá
- **THEN** odpověď je `403 no_license`

### Requirement: Omezení počtu pokusů

`/licenses` SHALL omezit počet pokusů z jedné IP na 10 za minutu
a při překročení odpovědět `429 rate_limited`.

#### Scenario: Zkoušení kódů hrubou silou

- **WHEN** z jedné IP přijde jedenáctý požadavek během minuty
- **THEN** odpověď je `429 rate_limited`

### Requirement: Rozhraní bez cookies a bez prohlížeče

Koncové body SHALL fungovat bez cookies a bez CORS a SHALL NOT vyžadovat
přihlášenou relaci; volá je desktopová aplikace.

#### Scenario: Volání bez cookies

- **WHEN** přijde požadavek bez jakýchkoli cookies
- **THEN** je obsloužen normálně
