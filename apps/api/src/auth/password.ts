import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";

const N = 32_768;
const r = 8;
const p = 1;
const keyLength = 64;
const maxMemory = 64 * 1024 * 1024;

function scrypt(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, keyLength, { N, r, p, maxmem: maxMemory }, (error, key) => {
      if (error) reject(error);
      else resolve(key as Buffer);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt);
  return `scrypt$${N}$${r}$${p}$${salt.toString("base64url")}$${key.toString("base64url")}`;
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const [algorithm, nValue, rValue, pValue, saltValue, keyValue] = encoded.split("$");
  if (algorithm !== "scrypt" || nValue !== String(N) || rValue !== String(r) || pValue !== String(p)) {
    return false;
  }

  if (!saltValue || !keyValue) return false;

  try {
    const salt = Buffer.from(saltValue, "base64url");
    const expected = Buffer.from(keyValue, "base64url");
    if (salt.length !== 16 || expected.length !== keyLength) return false;

    const actual = await scrypt(password, salt);
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
