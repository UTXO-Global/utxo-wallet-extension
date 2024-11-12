import { Script } from "@ckb-lumos/base";
import { NetworkSlug } from "../networks/types";

export function getRgbppAssetApiUrl(networkSlug: NetworkSlug): string {
  switch (networkSlug) {
    case "btc":
    //   return "https://api.rgbpp.io";
    case "btc_testnet":
      //   return "https://api.testnet.rgbpp.io";
      return "http://localhost:3001";
    case "btc_signet":
      //   return "https://api.signet.rgbpp.io";
      return "http://localhost:3000";
    default:
      throw Error(`Invalid network slug: ${networkSlug}`);
  }
}

export interface RgbppAsset {
  cellOutput: {
    capacity: string;
    lock: {
      codeHash: string;
      args: string;
      hashType: string;
    };
    type: {
      codeHash: string;
      args: string;
      hashType: string;
    };
  };
  data: string;
  balance: number;
  outPoint: {
    txHash: string;
    index: string;
  };
  blockNumber: string;
  txIndex: string;
  typeHash: string;
}

const fromHexString = (hexString: string) =>
  Uint8Array.from(hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));

const toHexString = (bytes: Uint8Array) =>
  bytes.reduce(
    (str: string, byte: number) => str + byte.toString(16).padStart(2, "0"),
    ""
  );

export function getRgbppBtcOutpoint(cell: RgbppAsset) {
  const args = cell.cellOutput.lock.args;
  const tx = toHexString(fromHexString(args.slice(10)).reverse());
  const outIndex = parseInt(
    toHexString(fromHexString(args.slice(2, 10)).reverse()),
    16
  );
  return {
    tx,
    outIndex,
  };
}

export interface RgbppXudtBalance {
  symbol: string;
  name: string;
  decimal: number;
  type_hash: string;
  type_script: {
    codeHash: string;
    args: string;
    hashType: string;
  };
  total_amount: string;
  available_amount: string;
  pending_amount: string;
}

export function xudtBalanceFormat(xudt: RgbppXudtBalance) {
  return parseInt(xudt.available_amount, 16) / Math.pow(10, xudt.decimal);
}

export interface RgbppTx {
  btcTx: {
    txid: string;
    vin: {
      txid: string;
      vout: number;
      prevout: {
        scriptpubkey_address: string;
        value: number;
      };
    }[];
    vout: {
      scriptpubkey_address: string;
      value: number;
    }[];
    status: {
      confirmed: boolean;
      block_height: number;
      block_time: number;
    };
  };
  isomorphicTx: {
    ckbTx: {
      hash: string;
      outputsData: string[];
    };
    inputs: {
      capacity: string;
      lock: Script;
      type: Script;
    }[];
    outputs: {
      capacity: string;
      lock: Script;
      type: Script;
    }[];
    status: {
      confirmed: true;
    };
  };
}
