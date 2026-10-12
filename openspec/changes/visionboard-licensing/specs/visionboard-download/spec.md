# visionboard-download

## ADDED Requirements

### Requirement: Odkaz na nejnovější instalátor

Stránka ke stažení SHALL brát odkaz z veřejného GitHub API
(`releases/latest`), vybrat položku, jejíž `name` končí na `_x64-setup.exe`,
a použít její `browser_download_url`. Název souboru SHALL NOT být zadaný
napevno, protože obsahuje číslo verze.

#### Scenario: Zobrazení nejnovější verze

- **WHEN** uživatel otevře stránku ke stažení
- **THEN** vidí číslo verze z `tag_name` a odkaz na instalátor

### Requirement: Odolnost vůči výpadku GitHubu

Odpověď GitHub API SHALL být cachovaná nejméně hodinu, protože veřejné API
má limit 60 dotazů za hodinu na IP. Při nedostupnosti SHALL stránka nabídnout
trvalý odkaz `releases/latest` místo chyby.

#### Scenario: GitHub neodpovídá

- **WHEN** volání GitHub API selže a cache je prázdná
- **THEN** stránka ukáže odkaz na `https://github.com/daasadr/vision-board/releases/latest`
- **AND** nezobrazí chybovou stránku
