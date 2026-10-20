# Nasazení licencí Vision Boardu

Jednorázová věc. Než proběhne, aktivace z aplikace nefunguje a zbytek
webu běží normálně dál.

Celé to jsou tři příkazy na serveru:

```sh
cd /opt/almostthere
sh scripts/visionboard-key.sh
./deploy/deploy.sh
```

Skript vygeneruje klíč, zapíše ho do `.env` a vypíše veřejnou část
i s označením (`kid`) — **to je to, co patří do Vision Boardu.**
Soukromou část nevypíše schválně; co je na obrazovce, to se jednou
zkopíruje i tam, kam nemá.

`deploy.sh` si sám stáhne změny z gitu, pustí migrace a teprve pak
nasadí novou verzi. **Nestačí `docker compose up -d --build`** —
kontejner s migracemi je v profilu `tools` a ten se takhle nespustí,
takže by nová aplikace běžela nad starým schématem databáze.

Nikdy ne `docker compose down -v` ani `docker volume prune` — smazalo
by to databázi.

## Zálohovat klíč

Na serveru:

```sh
cat /opt/almostthere/visionboard-license.pem
```

Tři řádky označit, zkopírovat a vložit **rovnou do správce hesel** —
nikam jinam, ani „na chvíli" do poznámek. Přímá cesta z obrazovky do
správce hesel je v pořádku; nebezpečné je to mezizastavení.

(`scp` z notebooku by byl čistší, ale root na serveru notebookový klíč
nezná, takže skončí na `Permission denied (publickey)`.)

Kdyby se klíč ztratil a vygeneroval se nový, **všechny vydané licence
přestanou platit.** Aplikace je ověřuje offline vestavěným veřejným
klíčem a o výměně se nemá jak dozvědět. Stejná kategorie jako
`ENCRYPTION_KEY`.

Dokud klíčem nejsou podepsané žádné licence, dá se bez následků
vyměnit — `scripts/visionboard-key.sh` se na to při druhém spuštění
zeptá.

## Ověřit

1. `almost-there.eu/cs/visionboard` — stránka se ukáže i s obrázky.
2. `almost-there.eu/cs/visionboard/download` — tlačítko vede na GitHub.
3. V aplikaci Nastavení → Licence → Aktivovat: otevře se prohlížeč,
   přihlášení, návrat do aplikace, licence platná rok.
4. Na Extra se pod pozvánkou objeví zařízení.

## Až jednou bude potřeba klíč vyměnit

Skript dá novému klíči označení podle roku (`at-2027-1`). Vision Board
musí znát **oba**, než se starý vyřadí — jinak zneplatníš licence všem,
kdo si zatím nestáhli novou verzi aplikace. Licence platí rok, takže
starý klíč musí přežít aspoň rok po té poslední vydané.
