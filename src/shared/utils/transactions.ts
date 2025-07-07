import { toXOnly } from "@/background/services/keyring/ckbhdw/hd/utils";
import type { ITransaction } from "@/shared/interfaces/api";
import * as ecc from "@bitcoinerlab/secp256k1";
import Big from "big.js";
import * as bitcoinjs from "bitcoinjs-lib";
import { payments as bitcoinPayments, payments } from "bitcoinjs-lib";
import {
  getNetworkDataBySlug,
  isBitcoinNetwork,
  AGGRON4,
  LINA,
  isDogecoinNetwork,
} from "../networks";
import { AddressType, NetworkSlug } from "../networks/types";
import { formatNumber } from ".";
import { helpers } from "@ckb-lumos/lumos";
import { ccc } from "@ckb-ccc/core";

export enum TxDirection {
  out = 0,
  in = 1,
}

export const getTxDirection = (
  transaction: ITransaction,
  targetAddress: string
): TxDirection => {
  const totalIn = transaction.vin.reduce(
    (acc, cur) =>
      cur.prevout.scriptpubkey_address === targetAddress
        ? acc + cur.prevout.value
        : acc,
    0
  );

  const totalOut = transaction.vout.reduce(
    (acc, cur) =>
      cur.scriptpubkey_address === targetAddress ? acc + cur.value : acc,
    0
  );

  if (totalIn > totalOut) {
    return TxDirection.out;
  }
  return TxDirection.in;
};

export const isDobTx = (transaction: ITransaction) => {
  if (
    transaction.vin.find(
      (t) =>
        t.address_hash === transaction.address &&
        t.extra_info !== undefined &&
        t.extra_info?.token_id !== undefined
    )
  ) {
    return true;
  }

  if (
    transaction.vout.find(
      (t) =>
        t.scriptpubkey_address === transaction.address &&
        t.extra_info !== undefined &&
        t.extra_info?.token_id !== undefined
    )
  ) {
    return true;
  }

  return false;
};

export const isTxToken = (transaction: ITransaction) => {
  if (
    transaction.vin.find(
      (t) =>
        t.address_hash === transaction.address &&
        t.extra_info !== undefined &&
        t.extra_info?.symbol !== undefined &&
        t.extra_info?.amount !== undefined
    )
  ) {
    return true;
  }

  if (
    transaction.vout.find(
      (t) =>
        t.scriptpubkey_address === transaction.address &&
        t.extra_info !== undefined &&
        t.extra_info?.symbol !== undefined &&
        t.extra_info?.amount !== undefined
    )
  ) {
    return true;
  }

  return false;
};

export const getTransactionValue = (
  transaction: ITransaction,
  targetAddress: string,
  fixed: number = 2
) => {
  const direction = getTxDirection(transaction, targetAddress);
  let value: number;
  switch (direction) {
    case TxDirection.in:
      value =
        transaction.vout.reduce(
          (acc, cur) =>
            cur.scriptpubkey_address === targetAddress ? acc + cur.value : acc,
          0
        ) /
        10 ** 8;
      break;
    case TxDirection.out:
      value =
        (transaction.vin.reduce(
          (acc, cur) =>
            cur.prevout?.scriptpubkey_address === targetAddress
              ? acc - cur.prevout?.value
              : acc,
          0
        ) +
          transaction.vout.reduce(
            (acc, cur) =>
              cur.scriptpubkey_address === targetAddress
                ? cur.value + acc
                : acc,
            0
          )) /
        10 ** 8;
      break;
  }

  return formatNumber(Math.abs(value), 2, 8);
};

export const getTransactionTokenValue = (
  transaction: ITransaction,
  targetAddress: string
) => {
  const direction = getTxDirection(transaction, targetAddress);
  let value: number;
  let symbol: string;
  switch (direction) {
    case TxDirection.in:
      value = transaction.vout.reduce((acc, cur) => {
        if (cur.scriptpubkey_address !== targetAddress || !cur.extra_info) {
          return acc;
        }

        symbol = cur.extra_info.symbol;
        return (
          acc +
          Number(cur.extra_info.amount || 0) /
            10 ** Number(cur.extra_info.decimal)
        );
      }, 0);
      break;
    case TxDirection.out:
      value =
        transaction.vin.reduce((acc, cur) => {
          if (
            cur.prevout?.scriptpubkey_address !== targetAddress ||
            !cur.extra_info
          ) {
            return acc;
          }

          symbol = cur.extra_info.symbol;
          return (
            acc -
            Number(cur.extra_info.amount || 0) /
              10 ** Number(cur.extra_info.decimal)
          );
        }, 0) +
        transaction.vout.reduce((acc, cur) => {
          if (cur.scriptpubkey_address !== targetAddress || !cur.extra_info) {
            return acc;
          }

          symbol = cur.extra_info.symbol;
          return (
            acc +
            Number(cur.extra_info.amount || 0) /
              10 ** Number(cur.extra_info.decimal)
          );
        }, 0);
      break;
  }

  return { amount: value, symbol: symbol };
};

export const getTransactionDobValue = (
  transaction: ITransaction,
  _targetAddress: string
) => {
  let data: string;
  let tokenId: string;
  let name: string;

  const cells = [...transaction.vout, ...transaction.vin];
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i];
    if (cell.extra_info && cell.extra_info.data && cell.extra_info.token_id) {
      data = cell.extra_info.data;
      tokenId = cell.extra_info.token_id;
      name = cell.extra_info.cluster_name;
      return { amount: 1, name, data, tokenId };
    }
  }

  return { amount: 1, name, data, tokenId };
};

export const isIncomeTx = (
  transaction: ITransaction,
  targetAddress: string
) => {
  const direction = getTxDirection(transaction, targetAddress);
  return direction === TxDirection.in;
};

export const getScriptForAddress = (
  publicKey: Uint8Array,
  addressType: AddressType,
  networkSlug: NetworkSlug
) => {
  const network = getNetworkDataBySlug(networkSlug).network;
  if (isBitcoinNetwork(network) || isDogecoinNetwork(network)) {
    switch (addressType) {
      case AddressType.P2WPKH:
        return payments.p2wpkh({
          pubkey: Buffer.from(publicKey),
          network,
        }).output;
      case AddressType.P2SH_P2WPKH:
        return payments.p2sh({
          redeem: payments.p2wpkh({ pubkey: Buffer.from(publicKey) }),
          network,
        }).output;
      case AddressType.P2PKH as any:
        return payments.p2pkh({
          pubkey: Buffer.from(publicKey),
          network,
        }).output;
      case AddressType.P2TR:
        bitcoinjs.initEccLib(ecc);
        return bitcoinPayments.p2tr({
          internalPubkey: toXOnly(Buffer.from(publicKey)),
          network,
        }).output;
      default:
        throw new Error("Invalid AddressType");
    }
  } else {
    throw new Error("Invalid network");
  }
};

export const getRoundedPrice = (value: number) => {
  const strValue = String(value);
  if (strValue.length > 20) {
    if (strValue.split(".")[1].length > 2) {
      return Number(value.toFixed(2));
    }
    return Number(value.toFixed(0));
  }
  return value;
};

export function shortAddress(address?: string, len = 5) {
  if (!address) return "";
  if (address.length <= len * 2) return address;
  return address.slice(0, len) + "..." + address.slice(address.length - len);
}

export const satoshisToBTC = (amount: number) => {
  return amount / 100_000_000;
};

export function tidoshisToAmount(val: number) {
  const num = new Big(val);
  return num.div(100_000_000).toFixed(8);
}

export function toFixed(x: number): string {
  if (Math.abs(x) < 1.0) {
    const e = parseInt(x.toString().split("e-")[1]);
    if (e) {
      x *= Math.pow(10, e - 1);
      return "0." + "0".repeat(e) + x.toString().substring(2);
    }
  } else {
    let e = parseInt(x.toString().split("+")[1]);
    if (e > 20) {
      e -= 20;
      x /= Math.pow(10, e);
      x += parseFloat("0." + "0".repeat(e));
    }
  }
  return x.toString();
}

export const ckbMinTransfer = (address: string, isTestnet: boolean) => {
  const lumosConfig = isTestnet ? AGGRON4 : LINA;

  const toScript = helpers.parseAddress(address, {
    config: lumosConfig,
  });

  const isAddressTypeJoy = ccc.bytesFrom(toScript.args).length > 20;

  if (isAddressTypeJoy) return 63;
  return 61;
};
