import { Network as BitcoinNetwork } from "bitcoinjs-lib";
import { BTC_LIVENET, BTC_SIGNET, BTC_TESTNET, BTC_TESTNET4 } from "./btc";
import { CKB_MAINNET, CKB_NEURON_HD_PATH, CKB_TESTNET } from "./ckb";
import { NetworkConfig as CkbNetwork } from "./ckb/offckb.config";
import { ChainData, ChainSlug, NetworkData, NetworkSlug } from "./types";
import { predefined } from "@ckb-lumos/config-manager";
import { Config } from "@ckb-lumos/lumos/config";

export const defaultNetwork = CKB_TESTNET;

export const btcTestnetSlug = ["btc_testnet", "btc_testnet_4", "btc_signet"];
export const nervosTestnetSlug = ["nervos_testnet"];

export const supportedNetworks: ChainData[] = [
  {
    name: "Nervos",
    slug: "nervos",
    networks: [CKB_MAINNET, CKB_TESTNET].map((chain) => ({
      ...chain,
      parentSlug: "nervos",
      walletToImport: [
        {
          name: "UTXO Global",
          hdPath: "",
          passphrase: "",
        },
        {
          name: "Neuron",
          hdPath: CKB_NEURON_HD_PATH,
          passphrase: "",
        },
        {
          name: "Others",
          hdPath: "",
          passphrase: "",
        },
      ],
    })),
  },
  {
    name: "Bitcoin",
    slug: "btc",
    networks: [BTC_LIVENET, BTC_TESTNET, BTC_TESTNET4, BTC_SIGNET].map(
      (chain) => ({
        ...chain,
        parentSlug: "btc",
        walletToImport: [
          {
            name: "BitSnap",
            passphrase: "",
          },
          {
            name: "Unisat",
            passphrase: "",
          },
          {
            name: "Others",
            passphrase: "",
          },
        ],
      })
    ),
  },
];

export function getNetworkDataBySlug(slug: NetworkSlug): NetworkData {
  const _supportedNetworks = supportedNetworks.reduce(
    (accumulator, currentValue) => [...accumulator, ...currentValue.networks],
    []
  );
  for (const networkData of _supportedNetworks) {
    if (networkData.slug === slug) {
      return networkData;
    }
  }
  return supportedNetworks[0].networks[0];
}

export function getNetworkChainSlug(slug: NetworkSlug): ChainSlug {
  for (const supportedNetwork of supportedNetworks) {
    for (const network of supportedNetwork.networks) {
      if (slug === network.slug) {
        return supportedNetwork.slug;
      }
    }
  }
  throw Error("Unknown slug");
}

export function isCkbNetwork(
  network: BitcoinNetwork | CkbNetwork
): network is CkbNetwork {
  return (<CkbNetwork>network).lumosConfig !== undefined;
}

export function isBitcoinNetwork(
  network: BitcoinNetwork | CkbNetwork
): network is BitcoinNetwork {
  return (<BitcoinNetwork>network).wif !== undefined;
}

export const NETWORK_ICON = {
  btc: "/btc.png",
  btc_testnet: "/btc.png",
  btc_testnet_4: "/btc.png",
  btc_signet: "/btc.png",
  nervos: "/ckb.png",
  nervos_testnet: "/ckb.png",
};

export const AGGRON4: Config = {
  ...predefined.AGGRON4,
  SCRIPTS: {
    ...predefined.AGGRON4.SCRIPTS,
    SECP256K1_BLAKE160_MULTISIG: {
      CODE_HASH:
        "0x765b3ed6ae264b335d07e73ac332bf2c0f38f8d3340ed521cb447b4c42dd5f09",
      HASH_TYPE: "type",
      TX_HASH:
        "0xe6774580c98c8b15799c628f539ed5722f3bc2b17206c2280e15f99be3c1ad71",
      INDEX: "0x0",
      DEP_TYPE: "depGroup",
      SHORT_ID: 1,
    },
  },
};
