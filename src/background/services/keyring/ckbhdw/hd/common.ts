import { ripemd160 } from "@noble/hashes/ripemd160";
import { PRIVKEY_SIZE, PUBKEY_SIZE } from "../protocol/policy";
import { sha256 } from "@noble/hashes/sha256";
import { utf8ToBytes } from "@noble/hashes/utils";

export const MIN_ENTROPY: number = 128;
export const MAX_ENTROPY: number = 512;
export const ZERO_KEY = Buffer.allocUnsafe(PUBKEY_SIZE);
export const ZERO_PRIVKEY = Buffer.allocUnsafe(PRIVKEY_SIZE);
export const SEED_SALT = utf8ToBytes("Tidecoin seed");

export const hash160 = (value: string | Uint8Array) => ripemd160(sha256(value));
export const hash256 = (value: string | Uint8Array) => sha256(sha256(value));
export const assert = (exp: boolean | number, message?: string) => {
  if (exp) return true;
  throw new Error(message);
};
