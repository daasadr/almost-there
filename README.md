# AlmostThere

Webová aplikace, která vezme cíl a termín a pomocí AI ho rozloží do hierarchie
**cíl → měsíce → týdny → denní checklist**. Odpočinek a reflexe jsou součástí
plánu, ne bonusem; tempo se přizpůsobuje skutečnému plnění.

Kompletní zadání je v [zadani-goal-app.md](zadani-goal-app.md).

---

## Co je hotové a co ne

Stavíme po vrstvách. Tahle verze je **landing page + funkční demo**.

**Hotovo**

- Landing page dle vizuálního briefu — strom reagující na kurzor, paleta
  smaragdová / limetková / purpurová, dvě rovnocenná CTA
- Demo režim: uživatel zadá cíl a termín, AI vrátí **měsíční rozpad**
  (fáze 1 z bodu 6 zadání) — bez registrace, viditelně označené jako ukázka
- Vícejazyčnost: angličtina (výchozí), čeština, němčina — včetně jazyka,
  ve kterém AI plán píše
- Cookie lišta s možností odmítnout analytiku jedním kliknutím
- Obchodní podmínky a zásady ochrany osobních údajů — **pracovní návrhy**
- Ochrana API klíče: strop demo generování na IP + rate limit v nginx
- Datový model celé appky v Prisma schématu (databáze zatím nikde neběží naostro)
- Docker image, compose sestava, nginx konfigurace, deploy skript

**Zatím ne** (další vrstvy)

- Registrace, přihlášení, reset hesla (NextAuth + Postgres)
- Stripe platby a napojení stavu předplatného
- Týdenní a denní rozpad, denní checklist, sledování plnění
- Adaptivní přeplánování, milníky s odměnami, multi-goal harmonizace
- Service worker pro offline checklist (manifest pro instalaci už je)
- Capacitor obal pro App Store / Google Play

---

## Lokální vývoj

Potřebuješ Node.js 22+.

```bash
npm install
cp .env.example .env.local     # a doplň ANTHROPIC_API_KEY
npm run dev
```

Aplikace poběží na <http://localhost:3000> a přesměruje na `/en`.

### Vývoj bez spotřeby AI tokenů

V `.env.local` nastav `DEMO_MOCK=true`. Demo pak vrací ukázková data
se stejnou strukturou jako reálná odpověď, takže se dá ladit UI naslepo.

### Užitečné příkazy

| Příkaz              | Co dělá                                  |
| ------------------- | ---------------------------------------- |
| `npm run dev`       | Vývojový server                          |
| `npm run build`     | Produkční build                          |
| `npm run start`     | Spustí produkční build lokálně           |
| `npm run typecheck` | Kontrola typů bez buildu                 |
| `npm run db:push`   | Promítne Prisma schéma do databáze       |

---

## Konfigurace

Všechny proměnné jsou popsané v [.env.example](.env.example). Nejdůležitější:

| Proměnná                   | Význam                                                          |
| -------------------------- | --------------------------------------------------------------- |
| `ANTHROPIC_API_KEY`        | Klíč z <https://console.anthropic.com/settings/keys>             |
| `ANTHROPIC_MODEL`          | Výchozí `claude-opus-5`                                          |
| `ANTHROPIC_EFFORT`         | `low` / `medium` / `high` — kvalita rozpadu vs. rychlost a cena  |
| `DEMO_RATE_LIMIT_PER_HOUR` | Kolik demo generování povolit z jedné IP za hodinu (výchozí 15)  |
| `DEMO_MOCK`                | `true` = negeneruje se přes AI                                   |
| `POSTGRES_PASSWORD`        | Vymyslíš si ho. `openssl rand -hex 24`, jen písmena a číslice     |
| `NEXT_PUBLIC_APP_URL`      | Veřejná adresa — zapéká se do buildu, viz poznámka níž           |

**Heslo k databázi** nikde nehledáš, vymyslíš si ho. `DATABASE_URL` v Dockeru
nenastavuj — `docker-compose.yml` si ji poskládá z `POSTGRES_USER`,
`POSTGRES_PASSWORD` a `POSTGRES_DB`, takže heslo píšeš jen na jedno místo.
Používej jen písmena a číslice; znaky jako `@`, `:` nebo `/` by adresu rozbily.

Pozor: Postgres si heslo zapamatuje **při první inicializaci** datového svazku.
Pozdější změna v `.env` se na existující databázi neprojeví — musel by se smazat
svazek (`docker compose down -v`), což zároveň smaže všechna data.

**`NEXT_PUBLIC_APP_URL`** ovlivňuje jen `robots.txt` a `sitemap.xml`. Zapéká se
do buildu, takže po změně je potřeba přestavět image — ale nic z toho, co
uživatel vidí, na ní nestojí. Dokud nemáš doménu, klidně tam nech IP serveru
a přestav to, až doménu nasměruješ.

**Poznámka k rychlosti a ceně.** Rozpad běží na `claude-opus-5` s úsilím
`medium` a trvá zhruba 30–45 sekund. Když bude demo působit pomale, sniž
`ANTHROPIC_EFFORT` na `low`. Když budou plány málo přesné, zvyš na `high` —
zaplatíš to delším čekáním a vyšší spotřebou tokenů.

---

## Nasazení na Hetzner VPS

Předpoklad: na serveru běží Docker, Docker Compose, nginx a git.

### 1. První nasazení

```bash
# na serveru
cd /opt
git clone https://github.com/daasadr/almost-there.git almostthere
cd almostthere

cp .env.example .env
nano .env        # doplň ANTHROPIC_API_KEY a POSTGRES_PASSWORD (viz Konfigurace)

docker compose up -d --build
```

Když build spadne nebo ho přerušíš, nic se nerozbije — Docker si nechá, co
už stihl, a příště naváže. Před dalším pokusem ukliď zbytky:

```bash
docker compose down -v     # -v smaže i svazek databáze
docker image prune -f      # zahodí nedodělané vrstvy z přerušeného buildu
docker compose up -d --build
```

`-v` je bezpečné jen dokud v databázi nic není. Jakmile budou v appce reální
uživatelé, `-v` nikdy nepoužívej — smazalo by jejich data.

Aplikace poslouchá na `127.0.0.1:3000` — do internetu ji pouští až nginx.

**Když na serveru běží víc projektů**, může být 3000 obsazený. Poznáš to podle
chyby `Bind for 0.0.0.0:3000 failed: port is already allocated`. Zjisti, kdo ho
drží, a přepni se na volný port:

```bash
sudo ss -tlnp | grep :3000     # co na portu sedí
docker ps                      # a jestli je to jiný kontejner

echo "APP_PORT=3001" >> .env    # zvol volný port
docker compose up -d            # rebuild není potřeba, port je jen mapování
```

Uvnitř kontejneru zůstává 3000 vždy; mění se jen port na serveru. Stejný port
pak nastav v nginx konfiguraci v bloku `upstream almostthere_app`.

### 2a. Bez domény — dočasný přístup přes IP

Když chceš appku vidět dřív, než vyřídíš doménu, použij
[deploy/nginx-ip-docasny.conf.example](deploy/nginx-ip-docasny.conf.example).
nginx rozlišuje projekty podle hlavičky `Host`, takže blok se `server_name`
nastaveným na IP nesebere provoz projektu, který má vlastní doménu.

```bash
sudo cp deploy/nginx-ip-docasny.conf.example /etc/nginx/sites-available/almostthere-ip
sudo nano /etc/nginx/sites-available/almostthere-ip   # doplň IP a port
sudo ln -s /etc/nginx/sites-available/almostthere-ip /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Běží to po HTTP, tedy nešifrovaně — Let's Encrypt certifikát na holou IP
adresu nevystaví. Dokud v appce nejsou účty ani platby, je to únosné
provizorium pro ukázku. **Než přibude registrace, musí být doména s HTTPS**,
jinak by hesla uživatelů šla po síti čitelně.

### 2. nginx a HTTPS

Doména projektu je **almost-there.eu**. Nejdřív u registrátora nastav
A záznamy na IP serveru — pro kořen i pro `www`. Ověř, že se to rozšířilo:

```bash
dig +short almost-there.eu
dig +short www.almost-there.eu
```

Obojí musí vrátit IP serveru. Teprve pak pokračuj — certbot ověřuje vlastnictví
domény tím, že si na ni sáhne, takže bez funkčního DNS certifikát nevystaví.

Nasazuje se ve dvou krocích, a to schválně. Ostrá konfigurace má blok
s `listen ... ssl`, který nginx bez existujícího certifikátu odmítne
načíst — a certbot potřebuje běžící nginx, aby si přes něj doménu ověřil.
Zaváděcí konfigurace ten kruh rozetne.

**Krok 1 — zavedení a certifikát:**

```bash
sudo cp deploy/nginx-bootstrap.conf.example /etc/nginx/sites-available/almostthere
sudo ln -s /etc/nginx/sites-available/almostthere /etc/nginx/sites-enabled/   # jen poprvé
sudo nginx -t && sudo systemctl reload nginx

sudo mkdir -p /var/www/html
sudo certbot certonly --webroot -w /var/www/html \
  -d almost-there.eu -d www.almost-there.eu
```

Používáme `certonly --webroot`, ne `--nginx`. Certbot tak jen vydá certifikát
a do konfigurace nesahá — zůstává naše, ne půl na půl s generovanou.

**Krok 2 — ostrá konfigurace s HTTPS:**

```bash
sudo cp deploy/nginx.conf.example /etc/nginx/sites-available/almostthere
sudo nginx -t && sudo systemctl reload nginx
```

Až ověříš v prohlížeči, že HTTPS funguje, odkomentuj v konfiguraci řádek
s `Strict-Transport-Security` a znovu načti nginx — dřív ne, protože jakmile
tu hlavičku prohlížeč jednou dostane, rok odmítne jít na HTTP.

Obnovu certifikátu řeší certbot sám časovačem. Ověřovací cesta
`/.well-known/acme-challenge/` proto musí zůstat i v ostré konfiguraci.
Otestovat to jde nanečisto:

```bash
sudo certbot renew --dry-run
```

Pak přepiš veřejnou adresu a přestav image, aby seděl `sitemap.xml`:

```bash
sed -i 's|^NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=https://almost-there.eu|' .env
./deploy/deploy.sh
```

Nakonec vypni dočasný přístup přes IP, ať appka neběží na dvou adresách:

```bash
sudo rm /etc/nginx/sites-enabled/almostthere-ip
sudo nginx -t && sudo systemctl reload nginx
```

### 3. Další nasazení

```bash
cd /opt/almostthere
./deploy/deploy.sh
```

Skript stáhne změny, přestaví image, restartuje kontejner a počká,
až aplikace odpoví. Když neodpoví do minuty, skončí chybou.

### Provozní příkazy

```bash
docker compose logs -f app        # živé logy
docker compose ps                 # stav kontejnerů
docker compose restart app        # restart bez rebuildu
docker compose exec db psql -U almostthere   # do databáze
```

---

## Struktura projektu

```
src/
  app/
    [locale]/            stránky (landing, demo, terms, privacy)
    api/demo/            endpoint pro demo generování
    globals.css          design systém — paleta, tlačítka, karty
  components/
    TreeBackground.tsx   strom na canvasu reagující na kurzor
    demo/                formulář a výstup dema
  lib/
    ai/                  ★ jádro produktu — rozpad cíle
      decompose.ts       fáze 1: měsíční milníky, prompt a volání API
      schemas.ts         JSON schéma výstupu + validace
    rate-limit.ts        ochrana demo endpointu
    demo-validation.ts   validace formuláře, sdílená klientem i serverem
  content/legal.ts       obchodní podmínky a zásady, per jazyk
  i18n/                  konfigurace jazyků
messages/                překlady UI (en, cs, de)
prisma/schema.prisma     datový model celé aplikace
deploy/                  nginx konfigurace a deploy skript
```

### Kde je jádro

`src/lib/ai/decompose.ts`. Kvalita rozpadu rozhoduje o úspěchu produktu,
takže prompt si zaslouží vlastní iterace — testuj ho na reálných cílech
z různých oborů a sleduj, jestli jsou milníky **ověřitelné** (dá se u nich
na konci měsíce odpovědět ano/ne) a jestli je poslední měsíc lehčí.

---

## Přidání dalšího jazyka

Zadání počítá s rozšířením o španělštinu, italštinu a francouzštinu.
Postup je záměrně bez zásahu do kódu:

1. Přidej kód jazyka do `locales` v `src/i18n/routing.ts` a doplň ho
   do `localeNames` a `localeAiNames`.
2. Zkopíruj `messages/en.json` na `messages/<kod>.json` a přelož.
3. Doplň právní texty do `src/content/legal.ts`.

U právních textů platí, že strojový překlad nestačí — pro trhy, kde appka
reálně prodává, je potřeba kontrola rodilým mluvčím nebo právníkem.

---

## Bezpečnost a právní věci

- `.env` a `.env.local` jsou v `.gitignore`. Klíče nikdy necommituj.
- Demo endpoint má strop na IP; IP se ukládá jen jako otisk, ne v čitelné podobě.
- Obchodní podmínky a zásady ochrany údajů v `src/content/legal.ts` jsou
  **pracovní návrhy**. Před spuštěním plateb je musí zkontrolovat právník
  se specializací na e-commerce/SaaS. Všude, kde je `[DOPLNIT]`, chybí
  skutečné údaje provozovatele.
- Limit spotřeby AI je v podmínkách vysvětlený jako ochrana proti zneužití,
  ne jako omezování zákazníků — tak jak to vyžaduje zadání.
