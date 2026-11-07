# Umami: co zbývá a jak s tím pracovat

Měření návštěvnosti na vlastním serveru. Tenhle soubor je proto, aby
se k tomu dalo vrátit po měsíci bez dohadování, co se tenkrát udělalo.

## Co to je a proč zrovna tohle

Umami je obdoba Google Analytics, která běží u nás. Rozdíl, na kterém
celé rozhodnutí stojí: **neukládá nic do prohlížeče návštěvníka.**
Žádná cookie, žádný identifikátor, žádné sledování napříč weby.

Z toho plyne to podstatné — **nepotřebuje souhlas a nemusíme mít
cookie lištu.** Souhlas podle ePrivacy potřebuje to, co si něco uloží
do zařízení nebo si tam něco přečte, a tohle ani jedno nedělá.

Kdyby někdy přibylo měření, které si do prohlížeče ukládá, souhlas se
musí vrátit, a na třech místech najednou: skript se smí načíst až po
něm, do `legal.ts` se vrátí souhlas jako právní základ a ze značky
o cookies se zase stane volba místo oznámení. Je to napsané
v `Analytics.tsx` a není to k udělání mimochodem.

## Kde to běží

| | |
| --- | --- |
| kontejner | `umami` ve stejném `docker-compose.yml` jako aplikace |
| port | 3100 na serveru, jen na localhost |
| databáze | vlastní databáze `umami` ve společném Postgresu |
| adresa měřicího skriptu | `almost-there.eu/stats/script.js` |
| hlášení | `almost-there.eu/stats/api/send` |

Nástěnka Umami **není veřejně dostupná** a to je schválně. Nginx pouští
ven jen ty dvě adresy výš, nic víc — kdyby byla přístupná celá, ležela
by na internetu přihlašovací stránka k datům o návštěvnosti.

### Jak se dostat na nástěnku

Přes SSH tunel z notebooku:

```sh
ssh -L 3100:127.0.0.1:3100 root@46.224.46.43
```

Nechat okno otevřené a v prohlížeči jít na `http://localhost:3100`.
Zavřením okna se tunel zavře.

## Co zbývá udělat

- [ ] **Změnit heslo správce.** Umami se instaluje s `admin` / `umami`.
      Dokud se nezmění, chrání data jen to, že se na nástěnku nedá
      zvenčí.
- [ ] **Vytvořit web v Umami** (Settings → Websites → Add website,
      doména `almost-there.eu`) a zkopírovat jeho **Website ID**.
- [ ] **Vložit ho do `.env`** na serveru jako
      `NEXT_PUBLIC_UMAMI_WEBSITE_ID=...` a nasadit přes
      `./deploy/deploy.sh`.
- [ ] **Ověřit, že se měří**: otevřít `almost-there.eu` a v Umami
      kouknout na Realtime. Návštěva se objeví do pár vteřin.

Dokud ID chybí, **měřicí skript se do stránky vůbec nevloží**. Nic se
nerozbije a nikam se nic neposílá — jen se nic neměří. Pozná se to
tak, že ve zdroji stránky není `script` s `/stats/script.js`.

## Jak zjistit, jestli to funguje

Čtyři kontroly od nejrychlejší:

**1. Je skript ve stránce?** Otevři `almost-there.eu`, `Ctrl+U`
(zobrazit zdroj) a hledej `stats/script.js`. Když tam je, měří se.
Když ne, chybí ID webu — a nic se neměří, aniž by se kdekoliv
objevila chyba.

**2. Došlo ID do kontejneru?** Na serveru:

```sh
docker compose exec app printenv NEXT_PUBLIC_UMAMI_WEBSITE_ID
```

Nic tajného, je to identifikátor webu. Prázdný výstup znamená, že se
nezapekl do sestavení.

**3. Běží Umami?**

```sh
docker compose ps umami
```

**4. Chodí návštěvy?** Přes tunel na nástěnku, záložka Realtime.
Otevři si web v jiném okně a návštěva se objeví do pár vteřin.

### Past: NEXT_PUBLIC_ se zapéká při sestavení

Proměnné s tímhle prefixem Next **nahrazuje hodnotou při sestavení**,
ne za běhu. Dopsat je do `.env` a restartovat kontejner proto
nestačí — musí projít jako `args` v `docker-compose.yml` až do
`Dockerfile`.

Dlouho tam nebyly a projevilo se to tak, že měření prostě neběželo,
nikde nic nehlásilo a nedalo se poznat, jestli je špatně nastavení,
nginx, nebo Umami. Teď tam jsou; po změně ID je ale **vždycky
potřeba přestavět** (`./deploy/deploy.sh`), ne jen restartovat.

## Jak s tím pracovat

### Co se měří samo

Zobrazení veřejných stránek. **Uvnitř aplikace se neměří nic** — za
přihlášením je soukromá práce na vlastních cílech, ne návštěvnost.
Ta hranice je v `Analytics.tsx` a je schválně ostrá.

### Co stojí za to sledovat

- **Realtime** — jestli právě teď něco běží. Dobré hned po nasazení.
- **Pages** — které stránky lidé otevírají. Tady se pozná, jestli mají
  smysl stránky se šablonami a s PDF plány.
- **Referrers** — odkud přišli. Po příspěvku na LinkedIn se tu ukáže,
  jestli někdo klikl.
- **Events** — vlastní události, viz níž.

### Vlastní události

V kódu je na to `trackEvent` v `components/Analytics.tsx`:

```ts
import { trackEvent } from "@/components/Analytics";

trackEvent("demo-spusteno");
```

Mlčí, když měření neběží — ve vývoji, u nenastaveného ID nebo když
skript zablokuje rozšíření v prohlížeči. Událost, která se nepovede
odeslat, nesmí shodit akci, u které vznikla.

**Do jména události nikdy nedávej nic od uživatele.** Ani cíl, ani
e-mail, ani adresu stránky s dotazem — v té od vyhledávače bývá, co
ten člověk hledal. Jména musí být z pevného seznamu v kódu.

### Značky v odkazech

Když dáváš odkaz někam ven (schránka na domě, leták, 3D tisk), přidej
`?utm_source=neco`. V Umami se pak dá odlišit, odkud lidé přišli —
jinak to vypadá jako přímá návštěva a nepozná se, jestli ten lísteček
k něčemu byl.

Hotové QR kódy to už mají: `?utm_source=schranka` a `?utm_source=tisk`.

## Čím nezačínat

Čísla sama o sobě nic neřeknou, dokud nemáš s čím srovnávat. První
měsíc se vyplatí jen kouknout jednou týdně a nic podle toho neměnit —
teprve když je vidět obvyklý stav, pozná se změna.

A hlavně: `umami:postgresql-latest` v `docker-compose.yml` nemá
připnutou verzi. Při přestavbě se může stáhnout novější a rozbít se.
Až na to bude čas, dopsat konkrétní verzi.
