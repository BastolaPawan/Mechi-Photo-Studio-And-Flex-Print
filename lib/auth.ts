import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "mechi_admin_session";

export function passwordMatches(input: string) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(password);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function createSessionValue() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;
  const expires = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const payload = `admin:${expires}`;
  return `${payload}.${createHmac("sha256", secret).update(payload).digest("base64url")}`;
}

export function validSessionValue(value: string | undefined) {
  const secret = process.env.SESSION_SECRET;
  if (!secret || !value) return false;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return false;
  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  if (!timingSafeEqual(a, b)) return false;
  const expires = Number(payload.split(":")[1]);
  return payload.startsWith("admin:") && Number.isFinite(expires) && expires > Date.now();
}
