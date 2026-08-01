import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Vše kromě API, statických souborů Next.js a souborů s příponou.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
