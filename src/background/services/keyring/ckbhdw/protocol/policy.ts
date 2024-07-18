import {
  COIN,
  MAX_BLOCK_SIGOPS,
  MAX_BLOCK_SIGOPS_COST,
  MAX_BLOCK_SIZE,
  WITNESS_SCALE_FACTOR,
} from "./consensus";

export const MAX_TX_VERSION = 2;
export const MAX_TX_SIZE = MAX_BLOCK_SIZE / 10;
export const MAX_BLOCK_WEIGHT = 6000000 * WITNESS_SCALE_FACTOR;
export const MAX_TX_WEIGHT = MAX_BLOCK_WEIGHT / 10;
export const MAX_TX_SIGOPS = MAX_BLOCK_SIGOPS / 5;
export const MAX_TX_SIGOPS_COST = MAX_BLOCK_SIGOPS_COST / 5;
export const BYTES_PER_SIGOP = 20;
export const MIN_RELAY = 1000;
export const BARE_MULTISIG = true;
export const FREE_THRESHOLD = (COIN * 144) / 250;
export const MAX_P2SH_SIGOPS = 15;
export const MAX_OP_RETURN_BYTES = 83;
export const MAX_OP_RETURN = 80;
export const MAX_P2WSH_STACK = 100;
export const MAX_P2WSH_PUSH = 80;
export const MAX_P2WSH_SIZE = 3600;
export const MEMPOOL_MAX_ANCESTORS = 25;
export const MEMPOOL_MAX_SIZE = 100 * 1000000;
export const MEMPOOL_EXPIRY_TIME = 72 * 60 * 60;
export const MEMPOOL_MAX_ORPHANS = 100;
export const MIN_BLOCK_WEIGHT = 0;
export const SIGNATURE_SIZE = 690;
export const PUBKEY_SIZE = 898;
export const PRIVKEY_SIZE = 1281;
export const BLOCK_PRIORITY_WEIGHT = 0;
export const BLOCK_PRIORITY_THRESHOLD = FREE_THRESHOLD;

export function getMinFee(size?: number, rate?: number): number {
  if (rate === undefined) rate = MIN_RELAY;

  if (size === 0 || size === undefined) return 0;

  let fee = Math.floor((rate * size) / 1000);

  if (fee === 0 && rate > 0) fee = rate;

  return fee;
}

export function getRoundFee(size?: number, rate?: number): number {
  if (rate === undefined) rate = MIN_RELAY;

  if (size === 0 || size === undefined) return 0;

  let fee = rate * Math.ceil(size / 1000);

  if (fee === 0 && rate > 0) fee = rate;

  return fee;
}

export function getRate(size: number, fee: number): number {
  if (size === 0) return 0;

  return Math.floor((fee * 1000) / size);
}
