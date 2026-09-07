import crypto from "crypto";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";

  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

function base32Decode(input: string): Buffer {
  const cleaned = input.replace(/=+$/, "").toUpperCase();
  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (const char of cleaned) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(output);
}

export function generateMfaSecret(): string {
  return base32Encode(crypto.randomBytes(20));
}

function hotp(secret: string, counter: number): string {
  const key = base32Decode(secret);
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter));

  const hmac = crypto.createHmac("sha1", key).update(buffer).digest();
  const offset = hmac[hmac.length - 1]! & 0x0f;
  const code =
    ((hmac[offset]! & 0x7f) << 24) |
    ((hmac[offset + 1]! & 0xff) << 16) |
    ((hmac[offset + 2]! & 0xff) << 8) |
    (hmac[offset + 3]! & 0xff);

  return (code % 1_000_000).toString().padStart(6, "0");
}

function totp(secret: string, timeStep: number): string {
  return hotp(secret, timeStep);
}

export function verifyMfaCode(secret: string, code: string): boolean {
  const normalized = code.replace(/\s/g, "").padStart(6, "0");
  if (!/^\d{6}$/.test(normalized)) return false;

  const timeStep = Math.floor(Date.now() / 30_000);
  for (let delta = -1; delta <= 1; delta += 1) {
    const expected = totp(secret, timeStep + delta);
    try {
      if (crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(normalized))) {
        return true;
      }
    } catch {
      return false;
    }
  }
  return false;
}

export function buildOtpAuthUrl(email: string, secret: string): string {
  const account = encodeURIComponent(email);
  const issuer = encodeURIComponent("Affecio");
  return `otpauth://totp/${issuer}:${account}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
}
