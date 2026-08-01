# Zadání pro Claude Code: AI aplikace na rozpad cílů do denních akcí

## 1. Vize projektu

Webová aplikace (Next.js + PWA, později obalená přes Capacitor do App Store / Google Play), která vezme uživatelův cíl (nebo více cílů současně) a cílové datum, a pomocí AI ho rozloží do hierarchie: **cíl → měsíce → týdny → denní checklist konkrétních úkolů**. Zásadní odlišnost od konkurence: appka aktivně zahrnuje odpočinek a reflexi jako rovnocennou součást plánu (ne jako "bonus"), umí kombinovat víc cílů do jednoho harmonogramu bez kolize, a průběžně adaptuje tempo podle skutečného plnění.

Sekundární, ale důležitá funkce: systém milníků s odměnami, které si uživatel může nastavit sám, nebo mu je může navrhnout AI.

**Název: AlmostThere.** Z uvažovaných variant (AlmostThere / Here We Go / Achiever) je tohle nejsilnější volba — je to jméno navázané na emoční moment, kvůli kterému appka existuje (pocit "už tam skoro jsem" u každého denního úkolu i milníku), funguje mezinárodně bez překladu, zní byznysově a motivačně zároveň, a nekoliduje s generickými názvy konkurence ("Goals...", "...Planner"). "Achiever" zní spíš jako herní/gamifikační badge a "Here We Go" nese víc energii začátku než cesty k cíli — u appky, která má provázet celý proces, je AlmostThere přesnější. Před finálním rozhodnutím ověřit dostupnost domény (almostthere.app / .io / .co) a ochranné známky.

## 2. Cílová skupina

Lidé, kteří potřebují opakovaně a rychle převést ambiciózní cíl na akční plán – typicky networkeři/MLM (explicitně zmíněný use case), freelanceři, podnikatelé, studenti dlouhodobých zkoušek. Sekundárně kdokoliv s osobním cílem (fitness, jazyk, projekt).

## 3. Klíčová diferenciace (musí být v jádru produktu, ne dodatek)

1. **Hierarchický rozpad cíle** – AI musí umět vzít cíl + termín a systematicky ho rozložit shora dolů: nejdřív měsíční milníky (co musí být hotové na konci každého měsíce, aby se stihl termín), pak každý měsíc rozdělit na týdenní cíle, a z týdenního cíle vygenerovat denní checklist. Toto je JÁDRO produktu — přesnost a použitelnost tohoto rozpadu rozhoduje o úspěchu appky.
2. **Multi-goal harmonizace** – pokud má uživatel 2+ aktivní cíle, AI musí generovat denní checklisty tak, aby se úkoly nepřekrývaly a nepřetěžovaly jeden den (rozpočet času na den je omezený zdroj sdílený mezi všemi cíli).
3. **Vestavěný odpočinek a reflexe** – při generování plánu AI dostává explicitní instrukci zahrnout dny/bloky odpočinku a čas na přemýšlení jako položky v checklistu, ne jen "prázdné dny". Frekvence by měla být konfigurovatelná uživatelem (např. "chci 1 den v týdnu bez úkolů" nebo "chci každý den 15 min na reflexi").
4. **Adaptivní přeplánování** – systém sleduje míru plnění denních úkolů. Pokud uživatel dlouhodobě nestíhá (např. plní < 60 % úkolů 2 týdny po sobě), appka mu nabídne buď (a) přepočítat zbytek plánu s pomalejším tempem, nebo (b) posunout cílové datum, nebo (c) pokračovat beze změny. Pokud plní výrazně nad plán, nabídne zrychlení nebo přidání dalšího cíle.
5. **Milníky a odměny** – ke každému měsíčnímu/klíčovému milníku si uživatel může přiřadit vlastní odměnu ("až dokončím X, dovolím si Y"). Pokud uživatel neví, co si dát za odměnu, AI navrhne 2-3 varianty přiměřené velikosti milníku (drobná odměna za týdenní milník, větší za měsíční/finální).

## 4. Technický stack

- **Frontend/Backend:** Next.js (App Router), TypeScript
- **Databáze:** PostgreSQL
- **Hosting:** Hetzner VPS + Docker (stávající stack)
- **AI:** Anthropic API (Claude) — strukturované JSON výstupy pro plán/rozpad, viz sekce 6
- **Autentizace:** NextAuth.js nebo Clerk (zvážit Clerk kvůli snazší správě platících uživatelů a rychlejšímu MVP)
- **Platby web:** Stripe (Checkout + Billing pro předplatné)
- **Platby mobil:** Nativní App Store / Google Play in-app subscription (povinné pro appky ve storech, nelze obejít Stripem uvnitř nativní appky) — potřeba synchronizace entitlementu mezi App Store/Play a backendem (webhook/receipt validation)
- **Mobilní obal:** Capacitor (obalí existující Next.js/PWA do iOS/Android shellu, přístup k nativním purchase API a push notifikacím)
- **PWA:** manifest.json + service worker pro offline checklist a instalaci na plochu mobilu jako doplněk k nativní appce (ne náhrada, kvůli platbám)

## 5. Datový model (návrh entit)

```
User
- id, email, auth_provider, created_at
- subscription_status (trial/active/canceled), subscription_source (stripe/apple/google)
- preferences: rest_frequency, reflection_minutes_per_day, timezone

Goal
- id, user_id, title, description, target_date, created_at, status (active/paused/completed/abandoned)
- priority_weight (pro harmonizaci víc cílů)

TimeBlock
- id, goal_id, level (month/week/day), start_date, end_date
- summary (co má být na konci bloku hotové)
- parent_block_id (self-reference pro hierarchii)

Task
- id, time_block_id (den), goal_id, title, description
- type (action/rest/reflection)
- status (pending/done/skipped), completed_at

Milestone
- id, goal_id, time_block_id, title, target_date
- reward_text, reward_source (user/ai_suggested), reward_claimed (bool)

CheckIn
- id, user_id, date, tasks_completed, tasks_total, note (volitelný text od uživatele)

ReplanEvent
- id, goal_id, triggered_at, reason (behind_schedule/ahead_of_schedule/manual)
- old_target_date, new_target_date, ai_summary (co a proč se změnilo)
```

## 6. Klíčový algoritmus – AI dekompozice cíle

Toto je nejdůležitější technická část a stojí za to jí věnovat vlastní iterační vývoj (promptové inženýrství, testování na reálných cílech).

**Vstup do AI promptu při založení cíle/cílů:**
- Seznam všech aktivních cílů uživatele (ne jen ten nový — kvůli harmonizaci)
- Cílová data
- Preference odpočinku a reflexe (frekvence, délka)
- Dnešní datum

**Postup generování (dvoufázový nebo třífázový, ne jeden velký prompt):**

1. **Fáze 1 – měsíční milníky:** AI vygeneruje seznam měsíčních milníků mezi dneškem a cílovým datem pro KAŽDÝ aktivní cíl současně, s ohledem na to, že se nesmí kumulovat příliš mnoho velkých milníků ve stejném měsíci napříč cíli. Výstup: strukturovaný JSON se seznamem TimeBlock (level=month) a jejich summary.
2. **Fáze 2 – týdenní rozpad:** Pro aktuální (a případně následující) měsíc AI rozloží měsíční milník na týdenní cíle. Generuj vždy jen na dohlednou budoucnost (např. příští 4-6 týdnů), ne na celý rok dopředu — šetří to náklady na AI a umožňuje to přeplánování bez zahazování velkého množství práce.
3. **Fáze 3 – denní checklist:** Z týdenního cíle AI vygeneruje denní úkoly na aktuální týden, včetně explicitně vložených položek typu "rest"/"reflection" podle preferencí uživatele. Tuto fázi je vhodné generovat průběžně (např. vždy na příští týden dopředu), ne všechno najednou.

**Doporučení pro implementaci:** negenerovat celý rok úkolů dopředu při založení cíle — je to zbytečně drahé na AI tokeny a stejně se to bude měnit při přeplánování. Generuj jen měsíční kostru dopředu (levné, jeden běh), a týdenní/denní detail vždy "just in time" pár týdnů dopředu, s cronjobem, který dogeneruje další týden, jakmile se ten aktuální blíží ke konci.

## 6a. Ukázkový příklad rozkladu (referenční pro demo i plnou verzi)

Tento příklad slouží jako referenční ukázka pro vývoj promptu z bodu 6 a zároveň jako vzor pro to, co přesně se ukazuje v demo režimu (bod 8) vs. v plné verzi.

**Vstup:** Cíl: *"Naučit se základy němčiny na úroveň A2"*. Termín: 6 měsíců od dneška. Preference odpočinku: 1 den v týdnu bez úkolů, 10 minut reflexe denně.

**Výstup fáze 1 — měsíční milníky (toto vidí uživatel i v demo režimu):**

| Měsíc | Milník |
|---|---|
| 1 | Základní slovní zásoba (pozdravy, čísla, dny), abeceda výslovnosti, 100 nejčastějších slov |
| 2 | Přítomný čas pravidelných/nepravidelných sloves, jednoduché věty o sobě |
| 3 | Slovní zásoba běžných situací (obchod, restaurace, cestování), otázky |
| 4 | Minulý čas (perfektum), delší konverzace, poslech jednoduchých textů |
| 5 | Rozšíření slovní zásoby na úroveň A2, čtení jednoduchých textů |
| 6 | Procvičení a příprava na zkoušku/reálnou konverzaci, zopakování celého rozsahu A2 |

*(V demo režimu appka u tohoto výstupu zobrazí poznámku: "Toto je zjednodušená ukázka — ukazuje pouze měsíční rozvržení. Plná verze každý měsíc rozloží na týdny a každý týden na konkrétní denní úkoly, které rovnou uvidíš v checklistu.")*

**Výstup fáze 2 — týdenní rozpad měsíce 1 (toto je již JEN v plné verzi):**

- Týden 1: Abeceda, výslovnost, pozdravy a základní fráze
- Týden 2: Čísla 1-100, dny v týdnu, měsíce
- Týden 3: Prvních 50 nejčastějších slov + jednoduché fráze
- Týden 4: Dalších 50 slov, zopakování celého měsíce, mini test sama sobě

**Výstup fáze 3 — denní checklist týdne 1 (pondělí, jen v plné verzi):**

- [ ] Akce: Projít abecedu a její výslovnost (20 min)
- [ ] Akce: Naučit se 5 základních pozdravů/frází
- [ ] Reflexe: 10 minut — zapsat si, co bylo dnes nejtěžší zapamatovat
- [ ] (úterý až neděle pokračuje obdobně, s jedním dnem bez úkolů dle preference odpočinku)

## 7. Adaptivní přeplánování — logika

**Spouštěče vyhodnocení tempa (dva typy):**

1. **Automatický** — denní/týdenní cronjob vyhodnotí completion rate za posledních 7-14 dní na goal_id. Prahové hodnoty (konfigurovatelné, návrh): < 60 % plnění po dobu 2 týdnů → appka aktivně upozorní uživatele, že tempo neodpovídá termínu. > 90 % plnění s velkým předstihem → upozorní na možnost zrychlení/přidání dalšího cíle.
2. **Manuální** — u každého cíle je vždy k dispozici tlačítko **"Překontrolovat tempo postupu"**. Po kliknutí AI vyhodnotí aktuální plnění vůči zbývajícímu času do termínu a vrátí verdikt: tempo odpovídá / tempo nestačí / tempo je napřed.

**Rozhodovací flow (platí pro oba spouštěče), pokud AI vyhodnotí, že tempo neodpovídá termínu:**

1. Zobrazí se modal: **"Tempo neodpovídá zvolenému termínu. Přeplánovat cíl?"** [ANO] [NE]
2. Pokud **NE** → appka pokračuje beze změny, uživatel vědomě zvolil pokračovat ve stejném tempu/termínu (typicky když je termín pro něj pevně daný a nechce ho posouvat — appka to respektuje, jen zaznamená rozhodnutí do CheckIn/ReplanEvent jako "user_declined_replan" pro pozdější kontext).
3. Pokud **ANO** → druhá volba, typ přeplánování:
   - **"Jen časově"** — úkoly zůstávají obsahově stejné, jen se přerozvrhnou: rozestupy mezi nimi se natáhnou/zhustí a přepočítá se zbývající časová osa (měsíční/týdenní bloky) tak, aby seděla k původnímu nebo mírně upravenému termínu. Nejde o novou strategii, jen o optimalizaci rozvrhu.
   - **"Celkově"** — cíl se nechá znovu rozpadnout od aktuálního stavu (fáze 1-3 z bodu 6 se spustí znovu), včetně možnosti navrhnout nový reálný termín a nový postup, pokud AI usoudí, že původní přístup nebyl efektivní.
4. Výsledek vždy zapsat do `ReplanEvent` s `ai_summary` — uživatel musí vidět, co přesně a proč se změnilo.

Přeplánování se **nikdy neprovede automaticky bez potvrzení uživatele** — appka jen upozorní a navrhne, rozhodnutí je vždy na uživateli.

## 8. Onboarding a paywall flow

Landing page nabízí **dvě rovnocenná CTA tlačítka vedle sebe**: **"Vyzkoušet demo"** a **"Koupit rovnou"**. Ne každý chce/potřebuje demo — někdo appku hned pochopí z popisu a chce začít pracovat okamžitě, ten jde rovnou na registraci + platbu (bod 3 níže).

### Demo režim — přesná pravidla

Cílem dema je ukázat hlavní hodnotu appky (kvalitu hierarchického rozpadu), ne dát uživateli plnohodnotný nástroj zdarma.

- Uživatel zadá **jeden** cíl a cílové datum (bez registrace, nebo s lehkou registrací jen e-mailem — zvolit podle konverzních dat, doporučuju začít bez registrace kvůli nejnižší bariéře).
- AI vygeneruje **pouze měsíční rozpad** (fáze 1 z bodu 6) — tedy vidí, na jaké měsíční milníky se cíl rozpadne. NEgeneruje se týdenní ani denní checklist.
- Demo výstup je **viditelně označen jako ukázka** — přímo v UI musí být jasná poznámka typu: *"Toto je zjednodušená ukázka. Plná verze rozloží každý měsíc na týdny a každý týden na konkrétní denní úkoly, bude sledovat tvůj postup a přizpůsobovat tempo, a umožní kombinovat víc cílů najednou."*
- Demo se **neukládá trvale** do plnohodnotné databáze uživatelských cílů (nebo se ukládá jen ve `stavu draft/demo`, odděleně od plnohodnotných `Goal` záznamů).
- Po zobrazení demo rozpadu → CTA: *"Chceš tohle mít pro všechny svoje cíle, uložené, s denním trackingem a přizpůsobováním tempa? Tady je cena."* → registrace + platba.

### Převod demo cíle na plnou verzi

Pokud uživatel po zaplacení chce, aby se cíl, který si zadal v demu, stal jeho prvním plnohodnotným cílem, appka mu to musí nabídnout automaticky (nemá znovu přepisovat, co už jednou zadal):

- Po úspěšné platbě, pokud existuje demo cíl (uložený v session/draftu), appka se zeptá: *"Chceš tento cíl [\"[název]\"] rozpracovat naplno?"* [Ano, dokončit] [Ne, začnu nový].
- Při "Ano" appka vezme zadání z dema (cíl, termín) jako vstup a spustí **plný proces**: doplní preference odpočinku/reflexe (které demo nesbíralo), spustí fáze 1-3 z bodu 6 (měsíce → týdny → dny) a založí ho jako plnohodnotný `Goal`.

### Registrace a platba

1. **Paywall hned po registraci, před založením prvního plnohodnotného cíle** (platí i pro cestu "Koupit rovnou", i pro cestu z dema) — cena musí být stejná, jaká byla uvedená na landing page a v popisu appky ve storu. Žádné překvapení.
2. Součástí registračního formuláře je povinné odsouhlasení obchodních podmínek a zásad zpracování osobních údajů (checkbox, nelze pokračovat bez zaškrtnutí) — viz bod 12.
3. Po zaplacení → onboarding: (případně převzetí cíle z dema, viz výše) → doplnění preferencí odpočinku/reflexe → AI vygeneruje první měsíční rozpad a rovnou i první týden/den → uživatel má co dělat ještě ten den.

## 9. Cena a limity použití AI

**Jednotný tarif, žádné tiery** — use case se mezi uživateli příliš neliší, komplikovat appku několika plány není potřeba.

- **Cena: 179 Kč/měsíc.** Mezi 179 a 225 Kč doporučuju nižší částku — u appky s jedním jasným tarifem (bez free tieru, bez zkoušky zdarma na kartu) je cenová bariéra při rozhodování silnější než u appek s freemiem, a 179 Kč je psychologicky výrazně blíž "impulzivní měsíční útraty" než 225 Kč. Cenu lze později zvýšit pro nové uživatele, jakmile appka získá recenze a důvěru (stávající předplatitele nechat na původní ceně jako "věrnostní" gesto).
- **Roční varianta se slevou** (např. rok za cenu 10 měsíců) pro uživatele, kteří chtějí dlouhodobý závazek.

**Limity použití AI — účel a výpočet:**

- Účelem limitu **není omezovat běžné platící uživatele** (naprostá většina reálných use casů — i při více souběžných cílech — ho nepřiblíží), ale ochránit provozovatele appky před zneužitím (např. skript, který by cíleně generoval stovky požadavků na AI přeplánování za účelem vyčerpání nákladů).
- Limit se nastaví jako měsíční strop na spotřebu AI tokenů/volání na uživatele, vypočítaný tak, aby **reálné náklady na AI u jednoho uživatele nikdy nepřekročily cca 150 Kč/měsíc** (při ceně 179 Kč) — tedy zůstane bezpečná marže na provoz, platební brány a zisk.
- Implementačně: sledovat kumulativní náklady/tokeny na `user_id` za rozhodné období (kalendářní měsíc), a jakmile se přiblíží stropu, zobrazit informační hlášku (ne tvrdé zablokování appky, spíš zpomalení frekvence AI operací jako je ruční "Překontrolovat tempo" nebo opakované manuální přegenerování) a v krajním případě dočasně znepřístupnit další AI generování do dalšího zúčtovacího období, s jasným vysvětlením proč.
- Tento limit a jeho účel musí být **transparentně popsaný v obchodních podmínkách** (viz bod 11) — explicitně uvést, že se nejedná o záměrné omezování zákazníků, ale o ochranu proti zneužití.

## 10. Vícejazyčnost (i18n)

- Výchozí jazyk appky: **angličtina**. Přepínatelné jazyky: **čeština, němčina**, a jako rozšíření (nízká náročnost navíc, jakmile je i18n architektura hotová) **španělština, italština, francouzština**.
- Implementačně použít standardní Next.js i18n řešení (např. `next-intl` nebo `next-i18next`) s texty v JSON/YAML souborech per jazyk — architektura musí od začátku počítat s tím, že veškerý UI text (včetně e-mailů, chybových hlášek, obchodních podmínek) prochází přes translation systém, ne hardcoded stringy. Přidání dalšího jazyka pak znamená "jen" překlad existujících klíčů, ne zásah do kódu.
- **Pozor:** obsah generovaný AI (rozpad cíle, denní úkoly) musí respektovat aktuálně zvolený jazyk appky — do promptu pro AI je třeba předávat jazykový parametr, aby uživatel dostal svůj plán ve svém jazyce, ne v angličtině napevno.
- Obchodní podmínky a zásady zpracování osobních údajů musí existovat právně korektně přeložené minimálně pro jazyky trhů, kde appka reálně cílí na zákazníky (ČR/SK minimálně česky, případně slovensky; DE trh německy) — strojový překlad právního textu bez kontroly rodilým mluvčím/právníkem nedoporučuji pro finální verzi.

## 11. Landing page — vizuální brief

- Barevná paleta: smaragdová, limetková, purpurová — kombinace organického růstu (zelené odstíny) a prémiovosti/ambice (fialová).
- Animované pozadí reagující na pohyb kurzoru (desktop) / dotyk (mobil) — světelné efekty, prolínání barev.
- Centrální vizuální motiv: strom v jasně zelených až limetkových tónech — symbolika růstu/větvení odpovídá i logice appky (jeden cíl se větví do menších a menších kroků, přesně jako strom).
- Styl: business/premium, ne hravý/dětský, ne strohý/účetní. Inspirace spíš směrem k moderním B2B SaaS landing pages (výrazná typografie, hodně prostoru, jemné animace) než k wellness/lifestyle appkám.
- Doporučuju konzultovat s `frontend-design` skillem/postupem při reálné implementaci, aby výsledek nepůsobil jako generický šablonovitý web.

## 12. Fázování MVP

**Fáze 1 (MVP):** jeden cíl, měsíční+týdenní+denní rozpad, manuální check-in (checkbox), bez adaptivního přeplánování, web + PWA, Stripe platba.
**Fáze 2:** multi-goal harmonizace, adaptivní přeplánování, milníky s odměnami.
**Fáze 3:** Capacitor obal, App Store/Google Play, nativní in-app purchase, push notifikace na denní checklist.

## 13. Autentizace, právní náležitosti a compliance

Toto je samostatný blok práce, který je třeba zadat Claude Code stejně explicitně jako appku samotnou — nejde o "nice to have", ale o podmínku, aby appka mohla legálně vybírat platby.

**Autentizace a uživatelské účty:**
- Registrace e-mailem + heslem, případně OAuth (Google) pro nižší bariéru vstupu.
- Reset hesla, ověření e-mailu.
- Napojení stavu předplatného (`subscription_status`) na účet, včetně stavu ze Stripe webhooks (a později App Store/Google Play server notifikací, viz bod 4).

**GDPR compliance:**
- Právní základ zpracování osobních údajů (plnění smlouvy pro účet/platbu, oprávněný zájem/souhlas pro analytiku).
- Právo na přístup, opravu a výmaz dat (appka musí umět uživatele i jeho cíle skutečně smazat, ne jen deaktivovat účet).
- Jasná retenční politika (jak dlouho appka drží data po zrušení předplatného).
- Appka bude sloužit uživatelům z více zemí EU (ČR, SK, případně SI, DE) — zpracování musí splňovat GDPR jako celoevropský standard, ne jen český zákon o ochraně osobních údajů.

**Cookies compliance:**
- Cookie lišta/banner při první návštěvě s možností odmítnout nezbytné vs. analytické/marketingové cookies zvlášť (ne jen "OK, souhlasím" tlačítko bez volby — to neodpovídá aktuálnímu výkladu GDPR/ePrivacy).
- Analytické nástroje (pokud budou použity) načítat až po souhlasu, ne předem.

**Obchodní podmínky (ToC) — povinný souhlas při registraci:**
- Checkbox "Souhlasím s obchodními podmínkami a zásadami zpracování osobních údajů" — povinný, nelze pokračovat bez zaškrtnutí, s odkazem na plné znění.
- Obchodní podmínky musí explicitně obsahovat a srozumitelně vysvětlit **limit na použití AI** popsaný v bodě 9 — konkrétně, že se jedná o ochranné opatření proti zneužití/nadměrné spotřebě AI kreditů jednotlivým uživatelem, nikoli o záměrné omezování běžného používání appky, a že prakticky žádný běžný use case tento limit nemůže vyčerpat.
- Obchodní podmínky dále musí pokrývat: podmínky předplatného a jeho zrušení, reklamace/vrácení peněz (v ČR/EU platí zákonná lhůta na odstoupení od smlouvy u služeb — je třeba ošetřit specifika digitálního obsahu/služby dle občanského zákoníku a směrnice EU o právech spotřebitelů), odpovědnost provozovatele (appka pomáhá s plánováním, negarantuje dosažení cíle), zpracování dat třetími stranami (Anthropic API, Stripe, App Store/Google Play).
- Doporučuju nechat finální znění obchodních podmínek zkontrolovat právníkem specializovaným na e-commerce/SaaS před ostrým spuštěním plateb — Claude Code může vytvořit kvalitní pracovní návrh, ale právní odpovědnost za finální text nelze delegovat na AI.

**Bezpečnost dat:**
- Vzhledem k tomu, že appka bude ukládat osobní cíle (často citlivé — finanční, zdravotní, kariérní), platí zvýšené nároky na zabezpečení: šifrování at-rest pro obsah cílů, řízení přístupu, logování přístupů k citlivým datům.
