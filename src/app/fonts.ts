import { Bricolage_Grotesque, Instrument_Sans } from "next/font/google";

/**
 * Typografie na jednom místě, ať jde snadno vyměnit.
 *
 * Vědomě se vyhýbáme Inter / Roboto / systémovým fontům — s nimi appka
 * vypadá jako každá druhá šablona. Bricolage Grotesque má charakter
 * v displayových velikostech, Instrument Sans je čitelný v běžném textu.
 *
 * Pozor: fonty se stahují při buildu, takže `docker build` potřebuje síť.
 */

export const bricolage = Bricolage_Grotesque({
  subsets: ["latin", "latin-ext"],
  variable: "--font-bricolage",
  display: "swap",
  weight: ["600", "700", "800"],
});

export const instrument = Instrument_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-instrument",
  display: "swap",
});
