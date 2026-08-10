"use client";

import { useEffect } from "react";

/**
 * Chování, které od aplikace čeká samotný telefon.
 *
 * Zatím jedna věc: hardwarové tlačítko zpět. Bez obsluhy by ho Android
 * poslal rovnou webview, které nemá kam couvnout, a aplikace by se
 * zavřela uprostřed rozepsaného cíle. Když je kam jít, jde se o krok
 * zpátky; teprve na začátku se aplikace ukončí.
 *
 * V prohlížeči se nic nenačítá — plugin se dotahuje až po zjištění, že
 * běžíme v aplikaci z obchodu.
 */
export function NativeShell() {
  useEffect(() => {
    let remove: (() => void) | undefined;
    let cancelled = false;

    void (async () => {
      const { Capacitor } = await import("@capacitor/core");
      if (cancelled || !Capacitor.isNativePlatform()) return;

      const { App } = await import("@capacitor/app");
      const listener = await App.addListener("backButton", ({ canGoBack }) => {
        if (canGoBack) {
          window.history.back();
        } else {
          void App.exitApp();
        }
      });

      if (cancelled) {
        void listener.remove();
        return;
      }
      remove = () => void listener.remove();
    })();

    return () => {
      cancelled = true;
      remove?.();
    };
  }, []);

  return null;
}
