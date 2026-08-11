import { randomBytes, scryptSync, timingSafeEqual, createHash } from "node:crypto";

const KEY_LENGTH = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, KEY_LENGTH);
  return `scrypt$${salt}$${derivedKey.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  if (!stored) return false;
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") {
    return timingSafeEqual(
      createHash("sha256").update(password).digest(),
      createHash("sha256").update(stored).digest()
    );
  }
  const [, salt, hash] = parts;
  const derivedKey = scryptSync(password, salt as string, KEY_LENGTH);
  const expected = Buffer.from(hash as string, "hex");
  if (expected.length !== derivedKey.length) return false;
  return timingSafeEqual(derivedKey, expected);
}