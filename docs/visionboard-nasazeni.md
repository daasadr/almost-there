# Nasazení licencí Vision Boardu

Jednorázová věc. Než proběhne, aktivace z aplikace nefunguje a zbytek
webu běží normálně dál.

Celé to jsou tři příkazy na serveru:

```sh
cd /opt/almostthere
git pull
sh scripts/visionboard-key.sh
docker compose up -d --build
```

Skript vygeneruje klíč, zapíše ho do `.env` a vypíše veřejnou část
i s označením (`kid`) — **to je to, co patří do Vision Boardu.**
Soukromou část nevypíše schválně; co je na obrazovce, to se jednou
zkopíruje i tam, kam nemá.

Migrace (`finalChallenge` s odměnou, `templateId`, `motivationSent`,
index `Milestone_timeBlockId_idx`, `visionboard_licensing`) jedou samy
při posledním příkazu.

Nikdy ne `docker compose down -v` ani `docker volume prune` — smazalo
by to databázi.

## Zálohovat klíč

Z notebooku:

```sh
scp root@handmade-production:/opt/almostthere/visionboard-license.pem .
```

Obsah do správce hesel, stažený soubor pak z notebooku smazat.

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
