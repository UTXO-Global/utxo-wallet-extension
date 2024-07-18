import BN from "bn.js";
import { assert } from "../hd/common";

export const COIN = 100000000;
export const MAX_MONEY = 21000000 * COIN;
export const BASE_REWARD = 40 * COIN;
export const HALF_REWARD = Math.floor(BASE_REWARD / 2);
export const MAX_BLOCK_SIZE = 6000000;
export const MAX_RAW_BLOCK_SIZE = 8000000;
export const MAX_BLOCK_WEIGHT = 8000000;
export const MAX_BLOCK_SIGOPS = 1000000 / 50;
export const MAX_BLOCK_SIGOPS_COST = 80000;
export const MEDIAN_TIMESPAN = 11;
export const VERSION_TOP_BITS = 0x20000000;
export const VERSION_TOP_MASK = 0xe0000000;
export const COINBASE_MATURITY = 100;
export const WITNESS_SCALE_FACTOR = 4;
export const LOCKTIME_THRESHOLD = 500000000;
export const SEQUENCE_DISABLE_FLAG = (1 << 31) >>> 0;
export const SEQUENCE_TYPE_FLAG = 1 << 22;
export const SEQUENCE_GRANULARITY = 9;
export const SEQUENCE_MASK = 0x0000ffff;
export const MAX_SCRIPT_SIZE = 100000;
export const MAX_SCRIPT_STACK = 2000;
export const MAX_SCRIPT_PUSH = 1897;
export const MAX_SCRIPT_OPS = 201;
export const MAX_MULTISIG_PUBKEYS = 20;
export const BIP16_TIME = 1333238400;
export const ZERO_HASH = Buffer.allocUnsafe(32);
export const ZERO_FALCON_HASH = Buffer.allocUnsafe(48);

export function fromCompact(compact: number) {
  if (compact === 0) return new BN(0);

  const exponent = compact >>> 24;
  const negative = (compact >>> 23) & 1;

  let mantissa = compact & 0x7fffff;
  let num;

  if (exponent <= 3) {
    mantissa >>>= 8 * (3 - exponent);
    num = new BN(mantissa);
  } else {
    num = new BN(mantissa);
    num.iushln(8 * (exponent - 3));
  }

  if (negative) num.ineg();

  return num;
}

export function toCompact(num: BN): number {
  if (num.isZero()) return 0;

  let exponent = num.byteLength();
  let mantissa;

  if (exponent <= 3) {
    mantissa = num.toNumber();
    mantissa <<= 8 * (3 - exponent);
  } else {
    mantissa = num.ushrn(8 * (exponent - 3)).toNumber();
  }

  if (mantissa & 0x800000) {
    mantissa >>= 8;
    exponent++;
  }

  let compact = (exponent << 24) | mantissa;

  if (num.isNeg()) compact |= 0x800000;

  compact >>>= 0;

  return compact;
}

export function verifyPOW(hash: string, bits: number): boolean {
  const target = fromCompact(bits);
  if (target.isNeg() || target.isZero()) return false;

  const num = new BN(hash, "le");
  if (num.cmp(target) > 0) return false;
  return true;
}

export function getReward(height: number, interval: number): number {
  assert(height >= 0, "Bad height for reward.");

  const halvings = Math.floor(height / interval);

  if (halvings >= 33) return 0;
  if (halvings === 0) return BASE_REWARD;

  return HALF_REWARD >>> (halvings - 1);
}

export function hasBit(version: number, bit: number): boolean {
  const TOP_MASK = exports.VERSION_TOP_MASK;
  const TOP_BITS = exports.VERSION_TOP_BITS;
  const bits = (version & TOP_MASK) >>> 0;
  const mask = 1 << bit;
  return bits === TOP_BITS && (version & mask) !== 0;
}
