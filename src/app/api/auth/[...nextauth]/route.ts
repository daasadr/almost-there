import { handlers } from "@/auth";

/**
 * Endpointy NextAuth: přihlášení, odhlášení, návrat z Googlu, session.
 * Cesta `/api/auth/...` je pevně daná — stejná adresa musí být
 * v Google Cloud Console v Authorized redirect URIs.
 */
export const { GET, POST } = handlers;

// Prisma ani bcrypt v Edge runtimu neběží.
export const runtime = "nodejs";
