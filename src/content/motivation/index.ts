import type { Locale } from "@/i18n/routing";
import { block as block01 } from "./01";

/**
 * Myšlenka na den.
 *
 * Krátký text, který uživatel dostane ráno v oznámení a může si ho nechat
 * přečíst nahlas. Původně to mělo být namluvené audio; od toho se ustoupilo,
 * protože natočit pět minut denně ve třech jazycích se udržet nedá a
 * generované hlasy zněly špatně. Text je rychlejší napsat, jde přeložit,
 * opravit překlep trvá vteřinu — a od strojového předčítání nikdo nečeká
 * herecký výkon, takže nevadí, že zní jako předčítání.
 *
 * ── Proč je to rozdělené po měsících ─────────────────────────────────
 *
 * Cílem je tři sta šedesát pět textů. V jednom souboru by to byly skoro
 * tři megabajty a hledání dvěstěsedmatřicátého textu by znamenalo
 * rolovat. Každý soubor drží jeden měsíc, tedy třicet textů.
 *
 * Přidání dalšího měsíce: nový soubor podle vzoru `01.ts`, import nahoře
 * a položka v `BLOCKS` níž. Nic jiného.
 *
 * ── Pořadí je závazek, ne jen uspořádání ─────────────────────────────
 *
 * Číslo textu je jeho pozice v řadě a zároveň jeho veřejná adresa:
 * `/motivation/12` je dvanáctý text. Jakmile se odkaz jednou dostane ven,
 * musí na tom čísle ten text zůstat.
 *
 * **Na konec se smí přidávat. Uprostřed se nesmí mazat ani přehazovat** —
 * posunulo by to všechno za tím a odkazy by vedly na jiné texty, než na
 * jaké vedly včera. Text, který se přestal líbit, se přepíše; nemaže se.
 *
 * ── Jak přidat další ─────────────────────────────────────────────────
 *
 * Přidej položku do `cs`, `en` i `de` — pořadí musí sedět, protože se
 * vybírá podle čísla. Kontrolu drží `assertSameLength` dole: když jeden
 * jazyk zůstane pozadu, projeví se to při sestavení, ne až u uživatele.
 *
 * ── Tvar ─────────────────────────────────────────────────────────────
 *
 * První odstavec je oslovení, poslední je rozloučení. Upoutávka do
 * oznámení se bere z prvního skutečného odstavce — viz `teaser()`.
 *
 * ── Čeština mluví k oběma ────────────────────────────────────────────
 *
 * Minulý čas je v češtině rodově určený, takže „všiml sis“ a „žil jsem“
 * mluví k muži a polovina čtenářů se v tom nenajde. Texty se proto píšou
 * tak, aby se rodu vyhnuly: přítomným časem („napadlo tě někdy“),
 * podstatnými jmény („po dnech plných řešení“) nebo infinitivem („jde
 * o to rozhodnout“). Oslovení je bezrodé — „ty na cestě“, ne „příteli“.
 *
 * Němčina tenhle problém nemá, angličtina taky ne. Hlídat se musí jen
 * čeština, a je to snadné přehlédnout, protože mužský rod zní „normálně“.
 *
 * ── Hodnota z toho, co je ────────────────────────────────────────────
 *
 * „Nikdo jiný to nemá.“ „Už se to nikdy nevrátí.“ Takhle se hodnota staví
 * na nedostatku a ráno to spíš sevře, než nabije — je to memento mori
 * v hezkých šatech. Píše se to obráceně: jeden den z miliard, a přitom
 * jediný svého druhu. A když to jde, i s podmínkou, kterou čtenář může
 * splnit hned — všimnout si.
 *
 * Prakticky: projít text na „nikdo“, „nikdy“, „nic“ a „ne-“ a u každého
 * výskytu se zeptat, jestli jde říct totéž kladně. Skoro vždycky jde.
 *
 * ── Opakované obraty ─────────────────────────────────────────────────
 *
 * Z jednoho textu se nepozná to, co je vidět napříč knihovnou: čtyři
 * z prvních osmi začínaly „je tu tichá pravda“, „je tichý rozdíl“, „je
 * jedna tichá dovednost“, „existuje tichá síla“. Jednotlivě to nevadí,
 * po sobě to čtenář ucítí — a je to nejrozpoznatelnější kadence
 * jazykových modelů v tomhle žánru.
 *
 * Než se text přidá, stojí za to projít začátky a rozloučení všech
 * ostatních a ujistit se, že se neopakuje tah, jen slova.
 *
 * ── Tón ──────────────────────────────────────────────────────────────
 *
 * Konkrétně a vlídně, tykání. Text nemá nic chtít: nemá vybízet
 * k otevření aplikace ani připomínat, co se nestihlo. Když někoho ráno
 * potěší nebo mu něco došlo, splnil svůj účel.
 *
 * ── Pořadí čtení ─────────────────────────────────────────────────────
 *
 * Nečte se podle kalendáře, ale podle toho, kolikátý den ten člověk
 * aplikaci má. Kdo se přidá v březnu, začíná jedničkou. Texty proto na
 * sebe nesmí navazovat a nesmí odkazovat na roční období ani na svátky.
 */

export type MotivationPiece = {
  /** Nadpis. Krátký — jde i do oznámení na zamčenou obrazovku. */
  title: string;
  /** Tělo textu po odstavcích, včetně oslovení a rozloučení. */
  paragraphs: string[];
};

/** Jeden měsíc textů ve všech jazycích. */
export type MotivationBlock = Record<Locale, MotivationPiece[]>;

/** Měsíce v pořadí. Nový se přidává na konec, nikdy doprostřed. */
const BLOCKS: MotivationBlock[] = [block01];

/**
 * Jazyky musí mít stejný počet textů — vybírá se podle čísla, ne podle
 * obsahu, takže chybějící položka v jednom jazyce by znamenala, že tomu
 * uživateli ten den nepřijde nic. Padne to při sestavení.
 */
function assertSameLength(): void {
  BLOCKS.forEach((block, index) => {
    const counts = { cs: block.cs.length, en: block.en.length, de: block.de.length };
    if (counts.cs !== counts.en || counts.cs !== counts.de) {
      throw new Error(
        `Myšlenky na den, měsíc ${index + 1}: jazyky mají různý počet textů ` +
          `(cs=${counts.cs}, en=${counts.en}, de=${counts.de}). Doplň chybějící překlad.`,
      );
    }
  });
}

assertSameLength();

export const motivationByLocale: Record<Locale, MotivationPiece[]> = {
  cs: BLOCKS.flatMap((block) => block.cs),
  en: BLOCKS.flatMap((block) => block.en),
  de: BLOCKS.flatMap((block) => block.de),
};

/** Kolik textů knihovna má. Všechny jazyky stejně — viz `assertSameLength`. */
export const MOTIVATION_COUNT = motivationByLocale.cs.length;
