# Proposal

## Why

„Posunout termín" dnes znamená: smazat celý zbytek plánu a nechat model
napsat nový od dneška. To není přepočet termínu, to je založení nového
cíle se stejným názvem. Dagmar to řekla rovnou — *„měl jen úkoly
posunout do budoucna a náležitě změnit termín, ne začít dnešním datem
odznova"*.

Je to drahé (volání modelu na celý plán), trvá to minuty, a hlavně to
bere člověku rozmyšlenou cestu, se kterou už žije. U volby, která se
nabízí při skluzu — tedy ve chvíli, kdy je člověk nejblíž tomu cíl
vzdát — je to ta nejhorší možná odpověď.

Termín se přitom posouvá právě proto, že **obsah zůstává a jen potřebuje
víc času**. Přepsat kvůli tomu obsah je obrácené naruby.

## What Changes

- **Posun termínu plán roztáhne, ne přepíše.** Období si nechají název,
  milník i pořadí; mění se jen jejich data, aby zbytek sahal ode dneška
  k novému termínu. Model se nevolá vůbec — je to zdarma a okamžité.
- **Běžící období se nehýbe.** Dnešek, rozepsaný týden a odškrtané dny
  zůstávají přesně tak, jak jsou. Roztahuje se až to, co po nich přijde.
- **Milníky jdou s obdobími**, kterým patří. Dosažené zůstávají na svém
  datu — to se stalo a posouvat se nedá.
- **Volba, co s propadlou prací.** Při posunu termínu se uživatel ptá:
  vrátit nedodělané úkoly na nejbližší dny, nebo je nechat být. Dosud
  rozhodoval kód za něj a vždycky stejně.
- Volání modelu zůstává jen tam, kde se opravdu mění obsah: úprava směru
  a rozšíření cíle.

## Non-goals

- **Rušit přeplánování modelem.** Úprava směru a rozšíření cíle mění to,
  co se má dělat, a ty bez modelu nejdou.
- **Měnit, jak se nový termín počítá.** `estimateNewTarget` z tempa
  zůstává, jen se jinak naloží s výsledkem.
- **Přepisovat minulost.** Co proběhlo, zůstává i s odškrtáním — je to
  jediný zdroj, ze kterého jde tempo vyčíst.
- **Dohánět za uživatele.** Vracení propadlých úkolů je jeho volba, ne
  výchozí chování.
