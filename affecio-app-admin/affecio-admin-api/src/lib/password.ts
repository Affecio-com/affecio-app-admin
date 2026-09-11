import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;
const DUMMY_PASSWORD = "affecio-invalid-login-placeholder";
let dummyHashPromise: Promise<string> | null = null;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

async function dummyHash() {
  dummyHashPromise ??= hashPassword(DUMMY_PASSWORD);
  return dummyHashPromise;
}

/** Always performs a bcrypt compare so missing accounts don't leak timing. */
export async function verifyPasswordOrDummy(password: string, hash: string | null): Promise<boolean> {
  if (hash) return verifyPassword(password, hash);
  await verifyPassword(password, await dummyHash());
  return false;
}
