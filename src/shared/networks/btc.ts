import { networks } from "bitcoinjs-lib";
import { AddressType, ChainAddressType, NetworkData } from "./types";

const BTC_TESTNET_ADDRESS_TYPES: ChainAddressType[] = [
  {
    value: AddressType.P2WPKH,
    label: "P2WPKH",
    name: "Native Segwit (P2WPKH)",
    hdPath: `m/84'/1'/0'/0/0`,
  },
  {
    value: AddressType.P2SH_P2WPKH,
    label: "P2SH-P2WPKH",
    name: "Nested Segwit (P2SH-P2WPKH)",
    hdPath: `m/49'/1'/0'/0/0`,
  },
  {
    value: AddressType.P2PKH,
    label: "P2PKH",
    name: "Legacy (P2PKH)",
    hdPath: `m/44'/1'/0'/0/0`,
  },
  {
    value: AddressType.P2TR,
    label: "P2TR [Payment]",
    name: "Taproot (P2TR) [Payment]",
    hdPath: `m/86'/1'/0'/0/0`,
  },
  {
    value: AddressType.P2TR,
    label: "P2TR [Ordinals]",
    name: "Taproot (P2TR) [Ordinals]",
    hdPath: `m/86'/1'/1'/0/0`,
  },
];

export const BTC_LIVENET_ADDRESS_TYPES: ChainAddressType[] = [
  {
    value: AddressType.P2WPKH,
    label: "P2WPKH",
    name: "Native Segwit (P2WPKH)",
    hdPath: `m/84'/0'/0'/0/0`,
  },
  {
    value: AddressType.P2SH_P2WPKH,
    label: "P2SH-P2WPKH",
    name: "Nested Segwit (P2SH-P2WPKH)",
    hdPath: `m/49'/0'/0'/0/0`,
  },
  {
    value: AddressType.P2PKH,
    label: "P2PKH",
    name: "Legacy (P2PKH)",
    hdPath: `m/44'/0'/0'/0/0`,
  },
  {
    value: AddressType.P2TR,
    label: "P2TR [Payment]",
    name: "Taproot (P2TR) [Payment]",
    hdPath: `m/86'/0'/0'/0/0`,
  },
  {
    value: AddressType.P2TR,
    label: "P2TR [Ordinals]",
    name: "Taproot (P2TR) [Ordinals]",
    hdPath: `m/86'/0'/1'/0/0`,
  },
];

export const BTC_LIVENET: NetworkData = {
  slug: "btc",
  name: "Bitcoin Livenet",
  esploraUrl: "https://mempool.space/api",
  explorerUrl: "https://mempool.space",
  ordUrl: "https://ord.utxo.global",
  addressTypes: BTC_LIVENET_ADDRESS_TYPES,
  coinName: "Bitcoin",
  coinSymbol: "BTC",
  network: networks.bitcoin,
  decimal: 8,
};

export const BTC_TESTNET: NetworkData = {
  slug: "btc_testnet",
  name: "Bitcoin Testnet3",
  esploraUrl: "https://mempool.space/testnet/api",
  explorerUrl: "https://mempool.space/testnet",
  ordUrl: "https://ord-testnet3.utxo.global",
  addressTypes: BTC_TESTNET_ADDRESS_TYPES,
  coinName: "Bitcoin Testnet3",
  coinSymbol: "tBTC",
  network: networks.testnet,
  decimal: 8,
};

export const BTC_TESTNET4: NetworkData = {
  slug: "btc_testnet_4",
  name: "Bitcoin Testnet4",
  esploraUrl: "https://mempool.space/testnet4/api",
  explorerUrl: "https://mempool.space/testnet4",
  ordUrl: "https://ord-testnet4.utxo.global",
  addressTypes: BTC_TESTNET_ADDRESS_TYPES,
  coinName: "Bitcoin Testnet4",
  coinSymbol: "tBTC",
  network: networks.testnet,
  decimal: 8,
};

export const BTC_SIGNET: NetworkData = {
  slug: "btc_signet",
  name: "Bitcoin Signet",
  esploraUrl: "https://mempool.space/signet/api",
  explorerUrl: "https://mempool.space/signet",
  ordUrl: "https://ord-signet.utxo.global",
  addressTypes: BTC_TESTNET_ADDRESS_TYPES,
  coinName: "Bitcoin Signet",
  coinSymbol: "tBTC",
  network: networks.testnet,
  decimal: 8,
};
