# AlmostThere — popis projektu

Průvodce projektem: co stavíme, proč to je řešené takhle, co už běží a co čeká.
Technické zadání je v [zadani-goal-app.md](zadani-goal-app.md), postup nasazení
v [README.md](README.md). Tenhle dokument je nad nimi — dává jim kontext.

Poslední aktualizace: **4. 8. 2026**

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
Vícejazyčnost přes `next-intl`. Autentizace bude NextAuth, platby Stripe
na webu a nativní nákupy v mobilních aplikacích.

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

### Kde je jádro

`src/lib/ai/decompose.ts` — prompt a volání API. Tenhle soubor rozhoduje
o kvalitě produktu víc než všechno ostatní dohromady. Zaslouží si vlastní
iterace a testování na reálných cílech z různých oborů.

---

## 3. Co už běží

Nasazeno na **https://almost-there.eu**.

- **Landing page** dle vizuálního briefu — animovaný strom reagující na kurzor
  i dotyk, paleta smaragdová / limetková / purpurová, dvě rovnocenná CTA
- **Demo režim** bez registrace: cíl a termín → rozpad na roky, měsíce nebo
  týdny podle horizontu, s hodnocením reálnosti termínu a ukazatelem průběhu
- **Tři jazyky**: angličtina (výchozí), čeština, němčina — včetně jazyka,
  ve kterém píše AI
- **Cookie lišta** s možností odmítnout analytiku jedním kliknutím
- **Obchodní podmínky a zásady ochrany údajů** ve třech jazycích — pracovní
  návrhy, čekají na kontrolu právníkem
- **Ochrana API klíče**: 15 generování na IP za hodinu v aplikaci, druhá
  vrstva rate limitu v nginx
- **Datový model celé aplikace** v Prisma schématu; databáze běží prázdná
- **Nasazení**: Docker image, compose sestava, nginx konfigurace, deploy skript
- **Měření spotřeby AI** — každé volání se loguje včetně odhadu ceny

---

## 4. Co čeká

V pořadí, jak na sebe navazuje:

| # | Krok | Poznámka |
|---|---|---|
| 1 | Registrace a přihlášení | NextAuth + Postgres. Prisma modely hotové včetně `Consent` s verzí podmínek |
| 2 | Platby | Stripe Checkout, webhook na stav předplatného, paywall, převzetí demo cíle |
| 3 | Plný rozpad a denní checklist | Fáze 2 a 3 z bodu 6 zadání, tlačítko na rozpracování dalšího období |
| 4 | Strop spotřeby AI | **Musí být dřív než platby** — slibujeme ho v obchodních podmínkách |
| 5 | Zálohy databáze | Cron, `pg_dump`, rotace. Teď je databáze prázdná, pak už bude pozdě |
| 6 | Adaptivní přeplánování | Fáze 2 zadání |
| 7 | Multi-goal harmonizace | Fáze 2 zadání |
| 8 | Milníky s odměnami | Fáze 2 zadání |
| 9 | Service worker pro offline checklist | Manifest pro instalaci už je |
| 10 | Capacitor, App Store, Google Play | Fáze 3, nativní nákupy povinné |

### Paralelně, nezávisle na kódu

- **Kontrola obchodních podmínek právníkem** — trvá týdny, rozjet dřív než platby
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

Při ceně 179 Kč včetně DPH:

| | Web (Stripe) | Mobil (Apple/Google) |
|---|---|---|
| Cena s DPH | 179 Kč | 179 Kč |
| Po odvodu DPH 21 % | ~148 Kč | řeší obchod |
| Po provizi platební brány | ~139 Kč | ~125 Kč (15 %) až ~103 Kč (30 %) |
| Po AI u běžného uživatele (~35 Kč) | **~104 Kč** | **~68 až 90 Kč** |

Z toho ještě jde server, e-maily, případná podpora.

### ⚠️ Strop v zadání je nastavený špatně

Zadání v bodě 9 počítá s tím, že náklady na AI nesmí překročit **150 Kč
měsíčně** na uživatele. To bylo nastavené od stolu a při ceně 179 Kč
nedává smysl: po odvodu DPH a provizi obchodu by 150 Kč **spotřebovalo
celou marži a ještě by se prodělávalo** — obzvlášť na mobilu, kde po
třicetiprocentní provizi zbývá kolem 103 Kč.

Realističtější nastavení, až budou data z provozu:

- **měkké upozornění kolem 35 Kč** měsíční spotřeby — informační hláška,
  zpomalení nákladných ručních operací
- **tvrdý strop kolem 60–70 Kč** — dvojnásobek běžné spotřeby, takže ho
  reálné používání nedosáhne, ale zneužití zastaví

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

### Doména

`almost-there.eu`. Přesný název byl obsazený na všech silných koncovkách
včetně `.com`, `.eu`, `.app`, `.io`, `.co` a `.me`. Pomlčka má jednu známou
nevýhodu: kdo ji vynechá, přistane na `almostthere.eu`, což je cizí italská
sportovní značka. Stojí za zvážení přikoupit `almostthere.cz` jako
přesměrování pro domácí trh.

---

## 7. Otevřené otázky

- Přihlášení přes Google v první vlně, nebo jen e-mail a heslo?
- Roční předplatné — potvrdit slevu (zadání navrhuje rok za cenu deseti měsíců)
- Sbírat v plné verzi dostupný čas denně? Bez toho si ho model odhaduje sám
  a odhad ukazuje v sekci „Z čeho AI vycházela"
- Termín odvozený z míry úsilí („nevím kdy, vím kolik času denně") — hezký
  nápad, ale je to druhý vstupní tok. Až po platbách.
