# Tasks

## 1. Jádro bez DOM

- [ ] 1.1 `rules.ts`: prahy, časy, počty, zakázané cíle. Žádná logika.
- [ ] 1.2 `machine.ts`: čtyři stavy, přechody událostmi. Ověřit:
      posloupnost událostí → očekávaný stav; nenapovídá v PŘÍCHOD
      ani ČTE; strop za návštěvu a klid mezi nápovědami se dodrží
      i při záplavě událostí.
- [ ] 1.3 `target.ts`: výběr cíle ze zaregistrovaných. Ověřit: zakázaný
      cíl se nikdy nevybere.

## 2. Vzhled

- [ ] 2.1 `--color-guide` ve všech šesti motivech, kontrast aspoň 3:1.
- [ ] 2.2 Prstenec v CSS, `pointer-events: none`, dvakrát objede
      a zhasne. Při `prefers-reduced-motion` jen klidné zabarvení.

## 3. Zapojení

- [ ] 3.1 `useGuide.ts`: myš, rolování, čas, viditelnost karty.
      Časovače se zastaví v zavřené kartě.
- [ ] 3.2 Vykreslení jen na veřejných stránkách, podle téhož seznamu
      jako měření.
- [ ] 3.3 Událost do Umami. Ověřit: test nad obsahem události, že
      neobsahuje nic mimo povolený seznam.

## 4. Dokončení

- [ ] 4.1 Odstavec v zásadách soukromí + test, že se seznam zakázaných
      cílů shoduje s tím, co je tam napsané.
- [ ] 4.2 Review bezpečnosti a soukromí.
- [ ] 4.3 Archivace změny.
