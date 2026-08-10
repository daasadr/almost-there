/**
 * Service worker.
 *
 * Dělá dvě věci a víc schválně ne: zrychluje načtení tím, že si drží
 * statické soubory, a při výpadku sítě ukáže srozumitelnou stránku
 * místo dinosaura.
 *
 * ZÁSADNÍ: nikdy neukládá HTML přihlášených stránek. Mezipaměť
 * prohlížeče přežije odhlášení i přepnutí účtu, takže uložený checklist
 * by se mohl ukázat někomu jinému — na společném telefonu doma je to
 * reálná situace, ne teoretická. Stejně tak se neukládá nic z /api:
 * jsou to cizí data a stav, který má být vždy čerstvý.
 *
 * Verze v názvu mezipaměti je tu proto, aby se při nasazení nové verze
 * ta stará celá zahodila. Bez toho by v telefonech zůstávaly kusy
 * předchozího buildu.
 */

const VERSION = "v1";
const STATIC_CACHE = `almostthere-static-${VERSION}`;
const OFFLINE_URL = "/offline.html";

/** Co musí být po ruce, i když síť není. */
const PRECACHE = [OFFLINE_URL, "/icon.svg", "/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      // Nová verze nemá čekat, až uživatel zavře všechny karty.
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

/** Soubory s otiskem v názvu. Jejich obsah se nikdy nemění. */
function isImmutableAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/fonts/") ||
    url.pathname.endsWith(".woff2")
  );
}

self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Zápisy se neukládají a neopakují — od toho tu service worker není.
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Cizí domény si spravuje prohlížeč sám.
  if (url.origin !== self.location.origin) return;

  // Nic z API. Jsou to data konkrétního uživatele a stav, který musí
  // být vždy čerstvý — od stavu předplatného po odškrtnuté úkoly.
  if (url.pathname.startsWith("/api/")) return;

  if (isImmutableAsset(url)) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ??
          fetch(request).then((response) => {
            // Ukládá se jen to, co se povedlo stáhnout celé.
            if (response.ok) {
              const copy = response.clone();
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
    return;
  }

  // Stránky: vždy ze sítě. Když síť není, náhradní stránka — ale nikdy
  // ne stará verze té skutečné, viz komentář nahoře.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(OFFLINE_URL).then(
          (offline) =>
            offline ??
            new Response("Offline", {
              status: 503,
              headers: { "Content-Type": "text/plain; charset=utf-8" },
            }),
        ),
      ),
    );
  }
});
