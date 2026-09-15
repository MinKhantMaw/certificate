import { createHmac, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { query } from "./db";

const COOKIE = "cms_session";
const secret = () => process.env.SESSION_SECRET || "change-this-session-secret";

export function hashPassword(password: string) {
  return scryptSync(password, secret(), 32).toString("hex");
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

export function sessionCookie(userId: string) {
  const value = `${userId}.${Date.now() + 1000 * 60 * 60 * 24}`;
  return `${COOKIE}=${value}.${sign(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`;
}

function safeSignatureMatches(value: string, expected: string) {
  const actualBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

export function clearSessionCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export async function currentUser(cookie?: string) {
  const value = cookie?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 3 || !Number.isFinite(Number(parts[1])) || Number(parts[1]) < Date.now() || !safeSignatureMatches(parts[2], sign(parts[0] + "." + parts[1]))) return null;
  const rows = await query<{ id: string; email: string; name: string; role: "ADMIN" | "TRAINER" | "APPROVER"; signature_image?: string }>("SELECT id, email, name, role, signature_image FROM users WHERE id = ?", [parts[0]]);
  const user = rows[0];
  return user ? { id: user.id, email: user.email, name: user.name, role: user.role, signatureImage: user.signature_image } : null;
}

export async function requireUser(req: { headers?: { cookie?: string } }, res: { status: (code: number) => any; json: (body: unknown) => void }) {
  const user = await currentUser(req.headers?.cookie);
  if (!user) {
    res.status(401).json({ error: "Authentication required." });
    return null;
  }
  return user;
}

export async function ensureUser(email: string, password: string) {
  const rows = await query<{ id: string; email: string; name: string; role: "ADMIN" | "TRAINER" | "APPROVER"; password_hash: string | null }>("SELECT id, email, name, role, password_hash FROM users WHERE email = ?", [email]);
  const existing = rows[0];
  if (existing) {
    if (!existing.password_hash || existing.password_hash !== hashPassword(password)) return null;
    return existing;
  }
  const id = randomUUID();
  await query("INSERT INTO users (id, email, name, password_hash, role) VALUES (?, ?, ?, ?, 'ADMIN')", [id, email, email.split("@")[0], hashPassword(password)]);
  return { id, email, name: email.split("@")[0], role: "ADMIN" as const };
}
