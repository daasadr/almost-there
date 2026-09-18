# AlmostThere — popis projektu

Průvodce projektem: co stavíme, proč to je řešené takhle, co už běží a co čeká.
Technické zadání je v [zadani-goal-app.md](zadani-goal-app.md), postup nasazení
v [README.md](README.md). Tenhle dokument je nad nimi — dává jim kontext.

Poslední aktualizace: **18. 9. 2026**

---

## 1. Co to je a k čemu

Aplikace vezme ambiciózní cíl a termín a rozloží ho na to, co se dá dnes
odškrtat. Mezi „chci mluvit německy" a „dnes se naučím pět frází" je propast,
kterou většina lidí nepřekročí — ne z lenosti, ale protože převod velkého
záměru na dnešní odpoledne je vlastní dovednost, kterou nikdo neučí.

Hierarchie je **cíl → roky → měsíce → týdny → denní checklist**. Horní úroveň
se volí podle délky horizontu, takže desetiletý cíl začíná roky a třítýdenní
rovnou týdny.

### Čím se to liší od konkurence

Tohle nejsou marketingové odrážky, ale rozhodnutí, která tvarují kód:

1. **Rozpad shora dolů, který drží.** Každá úroveň se odvozuje z té nad sebou.
   Dnešní úkol prokazatelně posouvá termín. Na kvalitě tohohle rozpadu stojí
   celý produkt — všechno ostatní je obal.
2. **Odpočinek jako položka, ne mezera.** Dny volna a bloky reflexe jsou
   součástí checklistu, protože plán, který ignoruje regeneraci, se opustí.
3. **Víc cílů, jeden poctivý den.** Den je pevný rozpočet sdílený všemi cíli.
   Dva cíle si nesmí potichu nárokovat stejný večer.
4. **Tempo se přizpůsobí.** Systém sleduje skutečné plnění a nabídne úpravu.
   Nikdy nepřeplánuje bez potvrzení uživatele.
5. **Milníky s odměnami**, vlastními nebo navrženými AI podle velikosti kroku.

### Pro koho

Lidé, kteří opakovaně převádějí ambice na plán: networkeři a MLM, freelanceři,
podnikatelé, studenti dlouhých zkoušek. Sekundárně kdokoliv s osobním cílem.

---

## 2. Jak je to řešené

### Technologie

Next.js (App Router) a TypeScript, PostgreSQL, Docker na Hetzner VPS, nginx
jako reverzní proxy. AI přes Anthropic API, model `claude-opus-5`.
Vícejazyčnost přes `next-intl`. Autentizace NextAuth, platby Stripe na webu.
Mobilní aplikace je obal přes Capacitor, který načítá web ze serveru.

### Rozhodnutí, která stojí za vysvětlení

**Rozpad běží po fázích, ne najednou.** Generovat rok úkolů dopředu by bylo
drahé a zbytečné — plán se stejně změní. Nejdřív vznikne jen horní kostra,
detail se dogeneruje „just in time" pár týdnů dopředu. U víceletých cílů se
podrobně rozpracuje jen nejbližší období a další se aktivuje, až se k němu
dojde.

**Horní úroveň se volí podle horizontu.** Do 10 týdnů týdny, do 18 měsíců
měsíce, dál roky. Výsledek má vždy 2–15 položek, takže se dá přečíst.
Desetiletý cíl rozdělený na 120 měsíců by nikdo nepřečetl a stál by pětkrát
víc.

**Výstup AI je strukturovaný JSON proti schématu**, ne volný text. Model
dostane schéma a odpověď se validuje zodem. Bez toho by UI padalo na
každé odchylce ve formátu.

**Model dostává instrukci být upřímný k termínu.** Když cíl do času nevejde,
řekne to a označí plán jako nereálný — místo aby mlčky předstíral. Plán,
který lže, je horší než žádný.

**Demo generuje jen horní úroveň.** Ukazuje kvalitu rozpadu, ne aby nahradilo
placenou verzi. Hranice je v UI výslovně pojmenovaná.

**Jazyk se předává do promptu.** Plán vzniká v jazyce aplikace, ne anglicky.
U levnějších volání (odměny, závěrečné shrnutí) je jazyk i v systémovém
pokynu — jedna řádka uprostřed anglického zadání jim nestačila a sklouzávaly
zpátky do angličtiny.

**Denní úkol nese návod, jak ho udělat.** Dva až čtyři kroky, ne jedna věta.
Poslední krok má pokud možno ověřit, že práce dopadla, ne že proběhla —
vysvětlit látku nahlas, jeden těžší příklad, krátký test. Odškrtnout „věnoval
jsem se tomu" umí každý a vytváří to falešný pocit pokroku.

**U učení se sahá po AI chatu jako po zdroji, který má každý.** Když uživatel
neuvedl materiály — a to je většina — dostane úkol typu „nech si od chatu
vysvětlit uzávěry a pak se nechej vyzkoušet". Je to jediný zdroj dostupný
komukoliv zdarma a lidé ho k učení skoro nepoužívají.

**Plán se dá upravit, ne jen přeplánovat po skluzu.** Tlačítko „upravit směr":
uživatel napíše vlastními slovy, co chce dělat jinak, a zbytek se přepracuje
kolem toho. Termín ani cíl se nemění a co je k dosažení nutné, v plánu zůstane
— jinak by z toho byl nástroj na odplánování nepříjemných částí.

**Přeplánování nemaže minulost a vychází z toho, co plán chystal.** Do modelu
jdou proběhlá i nadcházející období s instrukcí nechat, co dál sedí. Plán,
který se po malé úpravě vrátí k nepoznání, naučí člověka na něj nesahat.

**Pozastavení cíle posune zbytek plánu.** Po pauze se všechno od data
pozastavení posune o její délku, v jediném SQL příkazu — roční cíl má stovky
denních bloků. Negeneruje se nic znovu: rozvržení zůstává i s rozestupy, jen
dostane dnešní data.

**Vzhled si volí uživatel.** Šest motivů, přepínatelných za běhu. Celá aplikace
kreslí z barevných tokenů, takže motiv je jen jejich přepsání a žádná
komponenta o motivech neví.

**Aplikace z obchodu se hlásí podpisem v hlavičce prohlížeče.** Podle něj se
v ní schová všechno, co vede k placení mimo obchod — pravidlo Google Play.
Ze stejného důvodu v ní není přihlášení Googlem: to ve vloženém webview
Google zakazuje.

### Kde je jádro

`src/lib/ai/decompose.ts` — prompt a volání API. Tenhle soubor rozhoduje
o kvalitě produktu víc než všechno ostatní dohromady. Zaslouží si vlastní
iterace a testování na reálných cílech z různých oborů.

---

## 3. Co už běží

Nasazeno na **https://almost-there.eu**.

### Web a rozhraní

- **Landing page** — animovaný strom reagující na kurzor i dotyk, který se
  přebarvuje podle zvoleného motivu
- **Demo režim** bez registrace, s naměřeným časem rozpadu ve výsledku
- **Šest vzhledů** přepínatelných za běhu: Classic (tmavý), Steampunk,
  Sweet růžová a modrá, Jungle, Minimalist — včetně vlastních ozdob
- **Tři jazyky**: angličtina (výchozí), čeština, němčina
- **Návod** ve třech jazycích, psaný i pro jazykové modely
- **Blog** na `/blog`, obsah v `src/content/articles.ts`
- **Cookie lišta**, obchodní podmínky a zásady ochrany údajů

### Účty a platby

- **Registrace a přihlášení** e-mailem i přes Google, obnova hesla, ověření
  adresy (nepovinné — účet funguje hned)
- **Stripe naostro**: měsíční i roční předplatné, webhook, zrušení z aplikace,
  slevové kódy
- **Přidělený přístup** pro testery a blízké, s datem konce a varováním týden
  předem
- **Smazání účtu** z aplikace, včetně zrušení předplatného

### Jádro produktu

- **Plný rozpad** cíl → období → týdny → denní checklist s návody ke každému
  úkolu
- **Odložení úkolu** na jindy s důvodem, který se použije při přeplánování
- **Vyhodnocení tempa** a nabídka dohnat skluz nebo posunout termín
- **Úprava směru** — přepracování plánu podle přání uživatele
- **Pozastavení cíle** s posunem plánu při návratu
- **Milníky s odměnami**, navrhovanými podle toho, co má uživatel rád
- **Kalendář** s měsíčním přehledem plnění a proužkem posledních třiceti dnů
- **Motivační obrázky** u cíle, s volbou polohy vůči seznamu úkolů
- **Sdílení postupu** jako obrázek, kreslený v prohlížeči

### Mobilní aplikace

- **Capacitor obal** načítající web ze serveru — opravy jsou v telefonu hned
  po nasazení, bez čekání na schválení
- **Vydaná v uzavřeném testu Google Play** jako `eu.almostthere.app`
- **Denní připomínka** přes systémová oznámení
- Skryté placení a přihlášení Googlem podle pravidel obchodu

### Provoz a bezpečnost

- **Šifrování obsahu cílů** v databázi
- **Webová oznámení** s vlastním časem, týdenním režimem a večerní kontrolou;
  rozesílá je úloha v systému, ne časovač v aplikaci
- **Strop spotřeby AI** na uživatele a měsíc, s měřením každého volání
- **Omezení počtu pokusů** u přihlášení, registrace, dema i generování
- **Zálohy databáze** a nasazení jedním skriptem

---

## 4. Co blokuje vydání a co čeká

Produkt je hotový. To, co zbývá, **z větší části není kód** — a je dobré si to
přiznat, protože je snazší programovat než shánět lidi.

### Blokuje vydání

| # | Krok | Poznámka |
|---|---|---|
| 1 | **Dvanáct testerů po čtrnáct dní** | Podmínka Google Play pro produkci. Momentálně devět. Vývojářské komunity na Redditu (r/AndroidClosedTesting) tohle řeší výměnou „test za test" |
| 2 | Ostré platby vyzkoušené skutečnou kartou | Klíče i webhook jsou nastavené, chybí průchod naostro |
| 3 | Kontrola obchodních podmínek právníkem | Trvá týdny, mělo by běžet už teď |

### Čeká, ale nic neblokuje

| Krok | Poznámka |
|---|---|
| Nativní přihlášení Googlem v mobilní aplikaci | Teď se v ní přihlašuje jen heslem — Google svoje přihlášení ve webview zakazuje. Vyžaduje novou AAB a OAuth klienta s otiskem podpisového klíče |
| Doporučení mezi uživateli | „Pozvi kamaráda, oba dostanete měsíc." Levnější než afiliace a nic neodtéká ven. Má smysl až u pár desítek platících |
| Články na blog | Základ hotový, obsah chybí. Blog není nikde odkazovaný, dokud nebude co ukázat |
| Build mimo server | Nasazení trvá skoro dvě hodiny, protože se staví na VPS. Přesun do GitHub Actions z toho udělá minutu |
| ESLint | V projektu není a skript `lint` volá zrušený `next lint`. Žádná automatická kontrola kvality |
| Offline checklist se synchronizací | Service worker existuje, ale data neukládá |
| App Store | Vyžaduje placený vývojářský účet. Až po Google Play |

### Přehodnotit s vydáním v obchodech

**Daňová kategorie produktu ve Stripu** je nastavená jako SaaS bez mobilní
aplikace, což s vydáním v obchodech přestane platit.

### Paralelně, nezávisle na kódu

- **Kontrola obchodních podmínek právníkem** — trvá týdny, rozjet dřív než platby
- **Daně — konzultace s účetní, dřív než ostré platby.** Provozovatelka není
  plátcem DPH, ale dvě věci s tuzemskou hranicí obratu nesouvisí:
  (1) nákup služeb ze zahraničí (Anthropic, Stripe, Resend, Hetzner) typicky
  zakládá povinnost registrace jako **identifikovaná osoba** — vzniká hned,
  ne až u nějakého obratu; (2) prodej digitálních služeb spotřebitelům v EU
  má vlastní hranici kolem 10 000 € ročně, nad níž se DPH odvádí podle země
  zákazníka přes režim OSS. V obchodních podmínkách je zatím uvedeno, že
  provozovatel není plátcem DPH, označené k ověření.
- **Ochranná známka** — v rejstříku ÚPV je jediný nález „almostthere beyond
  sport", obrazová známka ve třídách 25/28/41, stav **zaniklá**. Třídy 9
  (software) a 42 (SaaS) jsou volné. Zbývá ověřit i tvar **„almost there"**
  se dvěma slovy, ten jednoslovný dotaz nemusel zachytit.

---

## 5. Ekonomika: co stojí AI

### Naměřeno

Skutečná spotřeba jednoho demo rozpadu na `claude-opus-5` při
`ANTHROPIC_EFFORT=medium`, měřeno 4. 8. 2026:

| Rozsah plánu | Vstup | Výstup | Cena |
|---|---|---|---|
| 6 měsíců | 1 431 | 1 322 | 0,94 Kč |
| 10 let (10 období) | 1 625 | 2 138 | 1,45 Kč |
| 18 měsíců | 1 444 | 2 664 | 1,73 Kč |

Cena roste s počtem období, ne s délkou horizontu. **Jedno volání stojí
zhruba 1 až 1,75 Kč.**

Podstatné: většinu ceny tvoří **výstupní tokeny**, do kterých se počítá
i přemýšlení modelu. Vstup je zanedbatelný, takže cachování promptu by
skoro nepomohlo — hlavní páka je úroveň úsilí a volba modelu.

### Naměřeno v provozu (září 2026)

Odhady níž vznikly před spuštěním. Skutečnost z běžícího provozu je
**pod 20 Kč měsíčně i u aktivnějšího uživatele** — tedy výrazně příznivější,
než se čekalo.

Dvě věci to mění:

**Marže je zdravá i při velké slevě.** Padesátiprocentní sleva znamená 89,50 Kč
příjmu proti nákladu do dvaceti, což unese i dlouhodobou akci.

**Delší popisy úkolů se vejdou.** Rozpad na dny je nejčastější volání v celém
provozu a návody ke každému úkolu ho prodražují. Při téhle marži je to
v pořádku, ale je to první místo, kde se náklady projeví — stojí za to
sledovat, jak se to číslo vyvíjí s přibývajícími uživateli.

### Odhad pro plnou verzi

Plná verze volá AI opakovaně, ne jednou. Na jeden aktivní cíl a měsíc:

| Operace | Četnost | Odhad |
|---|---|---|
| Založení cíle (tři fáze rozpadu) | jednorázově | ~5 Kč |
| Denní checklist na týden dopředu | 4× měsíčně | ~7 Kč |
| Přegenerování týdenní úrovně | 1× měsíčně | ~1,5 Kč |
| Kontrola tempa | ~4× měsíčně | ~4 Kč |
| Občasné přeplánování | ~0,5× měsíčně | ~1,5 Kč |

**Zhruba 12–15 Kč měsíčně na jeden aktivní cíl.** Uživatel se třemi cíli
se dostane na 35–45 Kč, a u víc cílů rostou i prompty kvůli harmonizaci.

### Kolik z toho zbude

Platby na webu jdou přes **Stripe Managed Payments** — Stripe je právním
prodejcem a přebírá DPH, reklamace i podvodné platby. Ceny jsou nastavené
jako **včetně daně**, takže zákazník platí inzerovaných 179 Kč a DPH se
odvádí z nich.

Důsledek, který stojí za zdůraznění: **DPH se účtuje i českým zákazníkům**,
přestože provozovatelka není plátcem. Daň se řídí registrací Linku jako
prodejce, ne její. Byl to vědomý kompromis — výměnou odpadá řešení DPH
v zahraničí, včetně režimu OSS.

| | Web (Managed Payments) | Mobil (Apple/Google) |
|---|---|---|
| Zákazník zaplatí | 179 Kč | 179 Kč |
| DPH (21 % u ČR, jinde jinak) | −31 Kč | řeší obchod |
| Poplatek Managed Payments 3,5 % | −6 Kč | — |
| Zpracování platby (~1,4 % + 6 Kč) | −9 Kč | −27 Kč (provize 15 %) |
| **Zbude** | **~133 Kč** | **~125 Kč** |
| Po AI u běžného uživatele (~35 Kč) | **~98 Kč** | **~90 Kč** |

Marže se liší podle země zákazníka, protože se liší sazba DPH — Německo
19 %, Česko 21 %, Maďarsko 27 %.

Pro srovnání: bez Managed Payments by z českého zákazníka zbylo asi 170 Kč,
protože by se žádná DPH neúčtovala. Rozdíl zhruba 37 Kč měsíčně je cena
za to, že se o daně nikde nestará provozovatelka.


**K provizi obchodů.** Předplatné prodané uvnitř mobilní aplikace musí projít
platebním systémem Applu nebo Googlu — Stripe je tam zakázaný. Základní sazba
je 30 %, ale pro vývojáře pod 1 milion USD ročního obratu platí **15 %**:
u Applu přes Small Business Program (nutno se přihlásit), u Googlu
u předplatného automaticky. Počítáme proto s 15 %. Prodej přes web provizi
obchodů nemá vůbec — proto se obě cesty počítají zvlášť.

### ⚠️ Strop v zadání je nastavený špatně

Zadání v bodě 9 počítá s tím, že náklady na AI nesmí překročit **150 Kč
měsíčně** na uživatele. To bylo nastavené od stolu a při ceně 179 Kč
nedává smysl: po odvodu DPH a provizi obchodu by 150 Kč **spotřebovalo
celou marži a ještě by se prodělávalo** — na webu i na mobilu, kde po
patnáctiprocentní provizi zbývá kolem 125 Kč.

Realističtější nastavení:

- **měkké upozornění kolem 35 Kč** měsíční spotřeby — informační hláška,
  zpomalení nákladných ručních operací
- **tvrdý strop kolem 60–70 Kč** — dvojnásobek běžné spotřeby, takže ho
  reálné používání nedosáhne, ale zneužití zastaví

Data z provozu tenhle odhad potvrdila: skutečná spotřeba je pod 20 Kč měsíčně,
takže strop kolem 60 Kč je trojnásobek běžného použití — dost daleko, aby
nikoho neomezoval, a dost blízko, aby zastavil zneužití.

Text obchodních podmínek to snese beze změny — slibuje ochranu proti
zneužití, ne konkrétní číslo.

### Páky, kterými jde náklady snížit

1. **Úroveň úsilí.** `ANTHROPIC_EFFORT=low` výrazně sníží přemýšlení, které
   tvoří většinu výstupních tokenů. Za cenu horší kvality rozpadu — a ta je
   jádro produktu, takže tuhle páku bych použila až po měření kvality.
2. **Levnější model na levné operace.** Rozpad cíle potřebuje Opus. Kontrola
   tempa nebo návrh odměny ne — Sonnet 5 je o 40 % levnější, Haiku 4.5
   o 80 %. Rozdělení podle typu operace je největší úspora bez dopadu na to,
   co uživatel posuzuje.
3. **Just-in-time generování** už používáme.

### Co s tím teď

Nic. Čísla máme, měření běží, a dokud aplikace nemá plný rozpad, jsou
odhady pro kroky 3 a dál jen odhady. Rozhodnutí o stropu i případné úpravě
ceny padne, až poběží skutečný provoz — ale s tím, že **150 Kč ze zadání
je horní hranice, kterou nechceme, ne cíl**.

---

## 6. Provoz

Server: Hetzner VPS, `46.224.46.43`, sdílený se třemi dalšími projekty.

| Projekt | Doména | Port |
|---|---|---|
| handmade | handmade.net | 3000, 3001 |
| **almostthere** | **almost-there.eu** | **3002** |
| skrytokraj | skrytokraj.portfolioparadise.eu | 3003 |
| familyfood | zatím nenasazeno | 3004 (vyhrazeno) |

Aplikace poslouchá jen na `127.0.0.1`, ven ji pouští nginx s certifikátem
od Let's Encrypt. Nasazení novou verzí: `./deploy/deploy.sh`.

### Úlohy v systému

Rozesílání oznámení běží z cronu, ne z aplikace — časovač uvnitř by nepřežil
restart při nasazení a při dvou instancích by běžel dvakrát:

```
*/5 * * * * curl -fsS -H "Authorization: Bearer $CRON_SECRET" \
  https://almost-there.eu/api/cron/notify > /dev/null
```

### Tajemství, která se nedají obnovit

Tyhle tři patří do zálohy mimo server. Ztráta každého z nich znamená jinou,
ale nevratnou škodu:

| Klíč | Co se stane při ztrátě |
|---|---|
| `ENCRYPTION_KEY` | Obsah cílů v databázi je trvale nečitelný |
| `VAPID_PRIVATE_KEY` | Přestanou chodit oznámení všem, kdo se přihlásili; musí se přihlásit znovu |
| `almostthere-upload.jks` | Nejde vydat aktualizace aplikace pod stejným záznamem v Google Play |

Nové proměnné oproti dřívějšku: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`,
`VAPID_SUBJECT`, `CRON_SECRET`. Musí být vyjmenované v `docker-compose.yml` —
do kontejneru se ze souboru `.env` samy nedostanou.

### Doba nasazení

Build běží na serveru a trvá skoro dvě hodiny. Typová kontrola se v něm
přeskakuje (`SKIP_TYPE_CHECK=1`), protože proběhla před commitem; ušetřilo to
dvacet minut. Zbytek je výkon stroje. Řešením je stavět mimo server — viz
sekce 4.

### Doména

`almost-there.eu`. Přesný název byl obsazený na všech silných koncovkách
včetně `.com`, `.eu`, `.app`, `.io`, `.co` a `.me`. Pomlčka má jednu známou
nevýhodu: kdo ji vynechá, přistane na `almostthere.eu`, což je cizí italská
sportovní značka. Stojí za zvážení přikoupit `almostthere.cz` jako
přesměrování pro domácí trh.

---

## 7. Otevřené otázky

- **Proč lidé po registraci nezačnou.** Největší otevřená otázka celého
  projektu. Nejlevnější hypotéza k ověření: první dny plánu jsou moc velké
  a je potřeba je udělat směšně malé, aby se člověk vrátil i druhý den.
- **Šablony cílů** („VibeCoding to Coding", „Fast Sketching") — odstranily by
  překážku lidem, kteří netuší, jaký cíl si dát. Má smysl je stavět až
  z cílů, které si provozovatelka sama projde a opraví v nich, co plán netrefil.
- **Napojení na Google Kalendář.** Zní dobře, používala by to menšina.
  Vyžaduje OAuth, souhlas a rozhodnutí, co se stane při přeplánování.
- Termín odvozený z míry úsilí („nevím kdy, vím kolik času denně") — hezký
  nápad, ale je to druhý vstupní tok.
- Zda barva lišty prohlížeče na mobilu má reagovat na zvolený motiv. Teď je
  staticky tmavá u všech.
