"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import type { ReactNode } from "react";

/**
 * Odkaz, u kterého je vidět, že se na něco čeká.
 *
 * Obyčejný `Link` na stránku, která se vykresluje na serveru, nedá
 * uživateli vůbec nic: klepne a nestane se nic viditelného, dokud
 * odpověď nedorazí. U „Začít s touhle šablonou" to znamenalo deset
 * klepnutí za sebou v domnění, že tlačítko nefunguje — a každé další
 * klepnutí tu odpověď jen oddálí.
 *
 * `useLinkStatus` musí běžet uvnitř `Link`, ne vedle něj; jinak o tom
 * přechodu neví. Proto ta vnitřní komponenta.
 */
function Pending({ children, label }: { children: ReactNode; label: string }) {
  const { pending } = useLinkStatus();

  return (
    <>
      <span className={pending ? "opacity-0" : undefined}>{children}</span>
      {pending && (
        <span className="absolute inset-0 flex items-center justify-center gap-2">
          {/* Tečky, ne točící se kolečko: na pozadí v barvě značky se
              kolečko ztrácí a tohle drží tvar tlačítka. */}
          <span className="sr-only">{label}</span>
          <Dot delay="0ms" />
          <Dot delay="150ms" />
          <Dot delay="300ms" />
        </span>
      )}
    </>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      aria-hidden="true"
      style={{ animationDelay: delay }}
      className="size-1.5 animate-bounce rounded-full bg-current"
    />
  );
}

export function PendingLink({
  href,
  className,
  label,
  children,
}: {
  href: string;
  className?: string;
  /** Co uslyší čtečka, když se čeká. */
  label: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={`relative ${className ?? ""}`}>
      <Pending label={label}>{children}</Pending>
    </Link>
  );
}
