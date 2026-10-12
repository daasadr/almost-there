# AlmostThere

Z cíle a termínu udělá plán až na úroveň dnešního dne: roky → měsíce → týdny →
denní checklist. S odpočinkem, který v plánu stojí napsaný, a s přepočítáním,
když se cesta rozejde se skutečností.

Běží na `almost-there.eu`. Vlastní server (Docker, nginx, Postgres), vedle něj
na témže stroji ještě tři jiné projekty — proto jsou porty 3000–3004 obsazené
a naše aplikace jede na 3002, měření na 3100.

## Čím to je

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 4 ·
next-intl (cs/en/de, prefix v URL vždy) · Prisma 7 + PostgreSQL ·
NextAuth v5 · Stripe · web push (VAPID) · Umami.

Aplikace běží jako web, jako PWA přidaná na plochu a jako obal z obchodu Play.
Ten obal nemá Push API ani předčítání — co se ho týká, je označené
`isStoreApp()`.

## Příkazy

```bash
npm run dev          # vývoj
npm run check        # typecheck + lint + testy, tohle musí projít
npm run build        # i prisma generate
npm run og           # překreslí náhledové obrázky po změně názvů šablon
npm run motivation   # přehled knihovny myšlenek, hledá opakování napříč texty
npm run indexnow     # ohlásí stránky vyhledávačům, až po nasazení
```

`npm run check` je závazek, ne doporučení. Úkol není hotový, dokud neprojde.

## Jazyky

- **Kód, identifikátory, názvy souborů:** anglicky.
- **Komentáře v kódu, zprávy commitů, dokumentace, specifikace:** česky.
  Celý repozitář je takhle psaný a míchat jazyky by z historie udělalo
  nečitelnou směs.
- **Texty pro uživatele:** vždy cs, en i de zároveň. Chybějící překlad se
  neprojeví jako chyba — uživateli se jen ukáže holý klíč.

Komentáře vysvětlují **proč**, ne co. Co dělá řádek kódu, je vidět z řádku
kódu; proč je zrovna takový, většinou ne.

### Čeština musí být bezrodá

Minulý čas v češtině určuje rod, takže „všiml sis" mluví k polovině lidí.
Píše se tedy přítomným časem, podstatnými jmény nebo neosobně. Platí to
pro texty v UI stejně jako pro obsah — a je to snadné přehlédnout, protože
mužský rod zní „normálně". Pravidelně se to sem vrací i mně; vyplatí se po
sobě hledat tvary na `-l jsem/jsi`, `sám`, `sama`.

## Workflow (OpenSpec + Beads)

- **Úkoly:** Beads. `bd ready`, `bd show <id>`, `bd update <id> --claim`,
  `bd close <id>`. Žádné TODO v markdownu ani TodoWrite. Prefix úkolů `at-`.
- **Poznatky mezi sezeními:** `bd remember "…"`.
- **Specifikace:** `openspec/changes/<změna>/` — `proposal.md` (proč, co,
  non-goals), `specs/<capability>/spec.md` (SHALL/MUST se scénáři WHEN/THEN),
  `design.md` (jak, rozhodnutí, rizika), `tasks.md` (úkoly s ověřením).
  Design a tasks se píšou **just-in-time** před začátkem změny, ne dopředu
  pro všechno. Po dokončení archivovat (`/opsx:archive`).
- Každý úkol v Beads odkazuje na svou změnu. **Testy a dokumentace patří
  k úkolu**, ne na konec.
- Odchylky od designu zapiš do `design.md` i s datem a důvodem.
- Nová práce, na kterou se narazí, = nový úkol v Beads, ne poznámka v textu.
- **Produktové otázky nerozhoduj sám.** Označ a zeptej se.

Projekt je v pokročilém stavu, takže se **nespecifikuje zpětně.** Specifikace
vznikají jen pro to, na čem se zrovna pracuje; pro zbytek je zdroj pravdy kód.

Na drobnou opravu se celá tahle mašinérie nepouští — stála by víc než ta
oprava. Je pro změny, které mají víc než jeden krok a kde se chyba pozná pozdě.

### Review bezpečnosti

Změna, která se dotýká přihlašování, plateb, licencí, vstupů od uživatele nebo
přidává závislost, má na konci úkol „Review bezpečnosti". Projít diff proti
hrozbám: neověřené vstupy, autorizace, únik tajemství, CSRF, rate limit,
logování citlivých údajů. Nálezy opravit, přijatá rizika zapsat do `design.md`.

## Git

- **Commit a push po hotové práci, bez ptaní.** Jinak se práce nemá jak dostat
  na server; nasazení dělá Dagmar sama.
- Zprávy commitů česky, prózou. Vysvětlují, proč se co změnilo a co by se
  stalo bez toho — ne výčet souborů.
- Po pushi zkontrolovat, jestli něco nespadlo.

## Na co se naráží

- **Oznámení se značí jako doručená, až když opravdu odejdou.** Značka
  zapsaná napřed spálí celý den: příští běh uživatele přeskočí.
- **Volání modelu stojí peníze** a mají měsíční strop na uživatele. Nové
  volání se nepřidává bez rozmyslu.
- **Next.js metadata neslučuje do hloubky.** Stránka, která uvede vlastní
  `openGraph`, přijde o ten z layoutu. Proto `pageSocial()` v `lib/seo`.
- **Klientské komponenty dostávají jen vyjmenované oddíly překladů**
  (`CLIENT_NAMESPACES` v layoutu). Chybějící oddíl nespadne, jen vypíše klíč.
- **Plán píše model, ne odborník.** U zdraví, jídla a pohybu musí být
  upozornění vidět.
- **Tajemství nikdy do chatu**, ani ve výpisech. Přepsat na `XXX`.
- **Nikdy nespouštět** `docker compose down -v` ani `docker volume prune`.

## Vision Board

Desktopová aplikace (repo `daasadr/vision-board`) se aktivuje účtem
AlmostThere. Kontrakt mezi oběma stranami:
`https://github.com/daasadr/vision-board/blob/main/docs/almost-there-api.md`.

Kontrakt se nemění jednostranně. Když je potřeba změna, navrhnout ji Dagmar,
která ji předá druhé straně, aby se obě změnily zároveň.
