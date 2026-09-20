import next from "eslint-config-next";
import nextTypeScript from "eslint-config-next/typescript";

/**
 * Statická kontrola kódu.
 *
 * Do projektu přišla pozdě — skript `lint` do té doby volal `next lint`,
 * který Next 16 zrušil, takže jen spadl a nikdo si toho nevšiml. Celý
 * projekt tedy vznikl bez jediné automatické kontroly kvality; typy
 * hlídal jen překladač a ten o nepoužitých proměnných ani o chybějících
 * závislostech efektů nic neví.
 *
 * Sada je záměrně blízko výchozímu nastavení Nextu. Vlastní pravidla se
 * dopisují, až když něco skutečně způsobí chybu — jinak vznikne seznam
 * zákazů, které nikdo nečetl a které se obchází komentářem.
 */
const config = [
  ...next,
  ...nextTypeScript,

  {
    ignores: [
      ".next/**",
      "node_modules/**",
      /** Vygenerovaný klient Prismy. Není náš kód a je obrovský. */
      "src/generated/**",
      /** Service worker běží v prohlížeči bez modulů a má vlastní pravidla. */
      "public/sw.js",
      "android/**",
    ],
  },

  {
    rules: {
      /*
       * Nepoužitá proměnná je skoro vždycky zbytek po úpravě — něco se
       * přepsalo a stará cesta zůstala viset. Podtržítko na začátku
       * znamená „vím o tom a je to schválně“; používá se u parametrů,
       * které vyžaduje podpis funkce, ale nepotřebujeme je.
       */
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      /*
       * Chybějící závislost efektu je zdroj chyb, které se těžko hledají:
       * komponenta se tváří správně a jen se neaktualizuje, když má.
       * Přesně takhle nám zmizel motiv po přepnutí jazyka.
       */
      "react-hooks/exhaustive-deps": "warn",

      /*
       * Nastavení stavu z efektu — upozornění, ne chyba.
       *
       * Pravidlo má pravdu v tom, že to znamená vykreslení navíc. Jenže
       * u hodnoty, kterou zná jedině prohlížeč — zvolený motiv, souhlas
       * s cookies, rozepsaný cíl v úložišti — jinak než po připojení
       * načíst nejde: server ji neví a serverem vykreslené HTML by se
       * s ní rozešlo.
       *
       * Čistší cesta existuje (`useSyncExternalStore`), ale u hodnoty,
       * která se čte jednou při otevření stránky, je to kanón na vrabce.
       * Necháváme jako upozornění, ať je vidět, kde to je — a ať se nad
       * každým dalším výskytem někdo zamyslí.
       */
      "react-hooks/set-state-in-effect": "warn",
    },
  },

  {
    /*
     * Serverové komponenty se vykreslí jednou za požadavek, takže je
     * v nich čtení aktuálního času v pořádku a nijak se mu vyhnout nedá.
     * Pravidlo míří na komponenty v prohlížeči, kde si React vykreslení
     * může zopakovat a dostat pokaždé jinou hodnotu.
     */
    files: ["src/app/**/page.tsx", "src/app/**/layout.tsx"],
    rules: {
      "react-hooks/purity": "off",
    },
  },
];

export default config;
