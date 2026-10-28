# Design

## Šifrování textu

Text hlášení se šifruje stejně jako obsah cílů — přidá se pole `message`
do `ENCRYPTED_FIELDS` v `lib/crypto/prisma-extension.ts`.

Důvod je stejný jako u `deferReason`, který už šifrovaný je: uživatel
píše vlastními slovy a může v tom být cokoliv. „Nejde mi uložit cíl
o odvykání" je hlášení o chybě i zdravotní údaj zároveň.

Seznam šifrovaných polí platí podle **názvu pole napříč modely**, ne
podle modelu. `message` je proto nové jméno, které zatím nikde jinde
ve schématu není — kdyby ho někdo v budoucnu použil pro něco, co se
vyhledává, šifrování by to rozbilo.

## Oznámení neobsahuje text

E-mail správci říká jen, že hlášení přišlo, od koho (maskovaný e-mail)
a z které stránky. Obsah ne.

Šifrovat text v databázi a vzápětí ho poslat nešifrovanou poštou do
schránky, kterou indexuje někdo třetí, by to šifrování zrušilo.
Nepohodlí je jedno kliknutí na odkaz do správy.

Odchylka, kdyby se ukázala jako nepraktická: přidat prvních pár set
znaků jako náhled. Rozhodnutí Dagmar, ne moje.

## Smazání účtu maže i hlášení

Vazba na uživatele je `onDelete: Cascade`, takže hlášení zmizí s účtem.

`lib/account/delete.ts` slibuje, že výmaz znamená smazání dat doslova,
a text hlášení je osobní údaj. Záznamy o spotřebě AI se od uživatele
jen odpojují, protože v nich osobní údaje nejsou — tady to neplatí.

Následek: užitečné hlášení se dá ztratit. Patří proto co nejdřív
přepsat do Beads, kam ostatně práce patří tak jako tak.

## Kontext se bere ze serveru, ne z formuláře

Adresa stránky, jazyk a příznak aplikace z obchodu se doplňují na
serveru z hlavičky `Referer`, z adresy a z `lib/store-app.ts`.

Kdyby je posílal prohlížeč v těle požadavku, dal by se obsah podvrhnout
a ve správě by pak stálo něco, co se nestalo. U údaje, podle kterého se
hledá chyba, je to horší než žádný údaj.

Uživatelský agent se ukládá zkrácený na 200 znaků — delší nic nepřidá
a jsou to řetězce, které umí mít kilobajt.

## Bez kategorií

Zvažovalo se rozdělení „chyba / návrh / jiné". Zahozeno: kdo má problém,
nemá ho ještě třídit, a špatně zvolená kategorie je horší než žádná,
protože se podle ní pak filtruje.

Třídí se až ve správě, kde je vidět celý text.

## Omezení četnosti

Pět hlášení za hodinu na účet, přes `lib/rate-limit.ts` jako jinde.

Počítá se na účet, ne na IP: přihlášení je podmínka, takže účet je
přesnější a nepostihne dva lidi za jedním připojením.

## Odchylky

- Ověřeno bez lokální databáze, stejně jako u předchozích změn — na
  tomhle počítači Postgres ani Docker není. Migrace se porovnává proti
  výstupu `prisma migrate diff`.
