"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import { isStoreAppClient } from "@/lib/store-app";

/**
 * V aplikaci z obchodu pošle přihlášeného rovnou do aplikace.
 *
 * Android aplikaci odloženou na pozadí běžně zruší, aby uvolnil paměť,
 * a po návratu ji spustí znovu. Obal přitom vždycky načte adresu ze
 * serveru, tedy úvodní stránku — kdo odskočil na zprávu, vracel se na
 * uvítací stránku s tlačítkem „vyzkoušet demo“, jako by tu byl poprvé.
 * Na mobilu se mezi aplikacemi přepíná pořád, takže to potkalo skoro
 * každého.
 *
 * Samotnému restartu zabránit nejde, o paměti rozhoduje systém. Jde ale
 * zařídit, aby po něm člověk skončil tam, kde má: rozepsaný cíl se drží
 * v prohlížeči a na dnešku se hned nabídne k dokončení.
 *
 * Jen v aplikaci z obchodu a jen pro přihlášené. Ve webovém prohlížeči
 * má úvodní stránka svůj smysl i pro přihlášeného — chodí se na ni
 * z vyhledávání a z odkazů.
 *
 * `replace`, ne `push`: krok zpět má aplikaci ukončit, ne vrátit na
 * uvítací stránku, ze které se právě odešlo.
 */
export function StoreAppHome() {
  const router = useRouter();
  const locale = useLocale();
  const { status } = useSession();

  useEffect(() => {
    if (status !== "authenticated") return;
    if (!isStoreAppClient()) return;
    router.replace(`/${locale}/app`);
  }, [status, router, locale]);

  return null;
}
