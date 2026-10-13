import "server-only";
import { cookies } from "next/headers";
import { timingSafeEqual } from "node:crypto";
import { firma, firmaValida } from "./firma";

// Area riservata: una sola password (variabile ADMIN_PASSWORD), cookie firmato per 30 giorni
const COOKIE = "eventi_admin";
const segreto = () => process.env.ADMIN_PASSWORD ?? "";

export async function isAdmin() {
  const pw = segreto();
  if (!pw) return false;
  const v = (await cookies()).get(COOKIE)?.value ?? null;
  return firmaValida("eventi-admin", v, pw);
}

export async function login(password: string) {
  const pw = segreto();
  if (!pw || !timingSafeEqual(Buffer.from(firma(password, "cmp")), Buffer.from(firma(pw, "cmp")))) return false;
  (await cookies()).set(COOKIE, firma("eventi-admin", pw), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 60 * 60 * 24 * 30, path: "/" });
  return true;
}

export async function logout() {
  (await cookies()).delete(COOKIE);
}
