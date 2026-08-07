import Link from "next/link";
import "@/app/globals.css";

/**
 * Kořenová 404 — chytí cesty mimo jazykové segmenty (např. /neco).
 * Musí si vykreslit vlastní `<html>`, protože kořenový layout je prázdný.
 */
export default function RootNotFound() {
  return (
    <html lang="en">
      <body className="grid min-h-dvh place-items-center px-6">
        <div className="text-center">
          <h1 className="display text-4xl">This page took a wrong turn.</h1>
          <p className="mt-3 text-[var(--color-paper-dim)]">
            The page you&rsquo;re looking for doesn&rsquo;t exist — or it moved.
          </p>
          <Link href="/en" className="btn-primary mt-8">
            Back to home
          </Link>
        </div>
      </body>
    </html>
  );
}
