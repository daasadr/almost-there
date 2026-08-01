import type { ReactNode } from "react";

/**
 * Kořenový layout je záměrně prázdný — `<html>` a `<body>` staví až
 * `[locale]/layout.tsx`, protože atribut `lang` závisí na jazyce.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
