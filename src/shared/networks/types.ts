import { Network as BitcoinNetwork } from "bitcoinjs-lib";
import { NetworkConfig as CkbNetwork } from "./ckb/offckb.config";

export enum AddressType {
  P2PKH = 0,
  P2WPKH = 1,
  P2TR = 2,
  P2SH_P2WPKH = 3,
  M44_P2WPKH = 4,
  M44_P2TR = 5,
  CKB_ADDRESS = 6,
}

export type ChainAddressType = {
  value: AddressType;
  label: string;
  name: string;
  hdPath: string;
};

export type NetworkSlug =
  | "btc"
  | "btc_testnet"
  | "btc_testnet_4"
  | "btc_signet"
  | "nervos"
  | "nervos_testnet";
export type ChainSlug = "btc" | "nervos";

type WalletToImport = {
  name: string;
  passphrase: string;
};

export type NetworkData = {
  slug: NetworkSlug;
  parentSlug?: string;
  name: string;
  esploraUrl: string;
  explorerUrl: string;
  ordUrl?: string;
  addressTypes: ChainAddressType[];
  coinName: string;
  coinSymbol: string;
  network: BitcoinNetwork | CkbNetwork;
  decimal?: number;
  walletToImport?: WalletToImport[];
  rpc?: string;
};

export type ChainData = {
  name: string;
  slug: ChainSlug;
  networks: NetworkData[];
};
