"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Po návratu z platby obnovuje stránku, dokud předplatné nenaskočí.
 *
 * Stripe vrátí uživatele zpátky hned, ale potvrzení chodí zvlášť webhookem
 * a může mít pár vteřin zpoždění. Bez tohohle by uživatel viděl „platba
 * proběhla" a musel by sám mačkat F5.
 *
 * Jakmile předplatné platí, server tuhle komponentu přestane vykreslovat
 * a obnovování samo skončí.
 */
export function CheckoutPending() {
  const router = useRouter();

  useEffect(() => {
    let attempts = 0;

    const timer = setInterval(() => {
      attempts += 1;
      router.refresh();

      // Po půl minutě to vzdáme. Když potvrzení nedorazilo ani do té doby,
      // je něco špatně a další dotazy tomu nepomůžou.
      if (attempts >= 10) clearInterval(timer);
    }, 3000);

    return () => clearInterval(timer);
  }, [router]);

  return null;
}
