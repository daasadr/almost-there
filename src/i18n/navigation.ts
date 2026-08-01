import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/**
 * Lokalizované náhrady za next/link a next/navigation.
 * Používej `Link` z tohoto souboru — automaticky drží jazykový prefix.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
