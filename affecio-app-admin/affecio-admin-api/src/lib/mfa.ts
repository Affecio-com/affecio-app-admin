import crypto from "crypto";

export function generateMfaSecret(): string {
  return crypto.randomBytes(20).toString("hex");
}

export function generateMfaCode(secret: string): string {
  const counter = Math.floor(Date.now() / 30000);
  const hmac = crypto.createHmac("sha1", secret);
  hmac.update(counter.toString());
  const hash = hmac.digest();
  const offset = hash[hash.length - 1]! & 0x0f;
  const code =
    ((hash[offset]! & 0x7f) << 24) |
    ((hash[offset + 1]! & 0xff) << 16) |
    ((hash[offset + 2]! & 0xff) << 8) |
    (hash[offset + 3]! & 0xff);
  return (code % 1_000_000).toString().padStart(6, "0");
}

export function verifyMfaCode(secret: string, code: string): boolean {
  const expected = generateMfaCode(secret);
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(code.padStart(6, "0")));
}
