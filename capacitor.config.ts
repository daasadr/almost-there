import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Obal pro obchody s aplikacemi.
 *
 * Aplikace běží na serveru (Next.js se serverovým vykreslováním), takže ji
 * nejde zabalit do telefonu jako statické soubory — obal proto načítá
 * ostrou adresu. Prakticky to znamená, že vydaná verze v obchodě dostane
 * každou opravu ve chvíli nasazení na server, bez čekání na schválení.
 *
 * Daň za to je, že bez internetu aplikace neběží; o to se stará service
 * worker a jeho náhradní stránka.
 */
const config: CapacitorConfig = {
  appId: "eu.almostthere.app",
  appName: "AlmostThere",
  // Nepoužívá se — obsah se načítá ze serveru — ale Capacitor cestu
  // vyžaduje a při buildu ji musí najít.
  webDir: "public",

  server: {
    url: "https://almost-there.eu",
    // Jen HTTPS. Bez tohohle by šlo obsah podstrčit na nezabezpečené síti.
    androidScheme: "https",
    cleartext: false,
    /**
     * Kam smí aplikace odejít, aniž by otevřela prohlížeč.
     *
     * Platební stránka Stripu sem patří: kdyby se otevřela mimo aplikaci,
     * uživatel by se po zaplacení nevrátil zpátky a nevěděl by, jestli
     * platba prošla. Google jako přihlašovací poskytovatel taky.
     */
    allowNavigation: [
      "almost-there.eu",
      "*.almost-there.eu",
      "checkout.stripe.com",
      "*.stripe.com",
      "accounts.google.com",
    ],
  },

  /**
   * Podpis v hlavičce prohlížeče.
   *
   * Server podle něj pozná, že požadavek přišel z aplikace z obchodu, a ne
   * z webu. Bez toho by se nedalo splnit pravidlo Google Play, které
   * zakazuje odkazovat uvnitř aplikace na vlastní placení mimo obchod.
   */
  appendUserAgent: "AlmostThereApp/1.0 (store)",

  android: {
    // Odkazy mimo povolený seznam otevře systémový prohlížeč, ne webview.
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
      backgroundColor: "#04100c",
      androidSplashResourceName: "splash",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#04100c",
    },
    LocalNotifications: {
      /**
       * Ve stavovém řádku bere Android z ikony jen tvar a obarví si ho
       * sám. Barevná ikona aplikace by se ukázala jako bílý čtvereček,
       * proto je pro oznámení zvlášť bílá silueta.
       */
      smallIcon: "ic_stat_almostthere",
      iconColor: "#bef264",
    },
  },
};

export default config;
