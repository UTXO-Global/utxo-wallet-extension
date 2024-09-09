import { Network as BitcoinNetwork } from "bitcoinjs-lib";
import { BTC_LIVENET, BTC_SIGNET, BTC_TESTNET, BTC_TESTNET4 } from "./btc";
import { CKB_MAINNET, CKB_NEURON_HD_PATH, CKB_TESTNET } from "./ckb";
import { NetworkConfig as CkbNetwork } from "./ckb/offckb.config";
import { ChainData, ChainSlug, NetworkData, NetworkSlug } from "./types";
import { predefined } from "@ckb-lumos/config-manager";
import { Config, createConfig } from "@ckb-lumos/lumos/config";
import { SporeConfig, predefinedSporeConfigs } from "@spore-sdk/core";

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

export const AGGRON4: Config = createConfig({
  ...predefined.AGGRON4,
  SCRIPTS: {
    ...predefined.AGGRON4.SCRIPTS,
    OMNILOCK: {
      ...predefined.AGGRON4.SCRIPTS.OMNILOCK!,
      CODE_HASH:
        "0xa7a8a4f8eadb4d9736d32cdbe54259d1ee8e23785e7c28d15a971a0dbdc14ca6",
      HASH_TYPE: "type",
      TX_HASH:
        "0x65de639c5f4822cef9be430c4884c2b7689147a6b0098f3aa4028d0f7f9689d1",
      INDEX: "0x0",
      DEP_TYPE: "code",
    },
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
    XUDT: {
      CODE_HASH:
        "0x25c29dc317811a6f6f3985a7a9ebc4838bd388d19d0feeecf0bcd60f6c0975bb",
      HASH_TYPE: "type",
      TX_HASH:
        "0xbf6fb538763efec2a70a6a3dcb7242787087e1030c4e7d86585bc63a9d337f5f",
      INDEX: "0x0",
      DEP_TYPE: "code",
    },
  },
});

export const LINA: Config = createConfig({
  ...predefined.LINA,
});

export const DOBS_TESTNET_CONFIG: SporeConfig = {
  lumos: AGGRON4,
  ckbNodeUrl: "https://testnet.ckb.dev/rpc",
  ckbIndexerUrl: "https://testnet.ckb.dev/indexer",
  maxTransactionSize: 500 * 1024, // 500 KB
  defaultTags: ["preview"],
  scripts: {
    ...predefinedSporeConfigs.Testnet.scripts,
    Spore: {
      versions: [
        // eslint-disable-next-line no-unsafe-optional-chaining
        ...predefinedSporeConfigs.Testnet.scripts?.Spore.versions,
        {
          tags: ["v2", "preview"],
          script: {
            codeHash:
              "0x5e063b4c0e7abeaa6a428df3b693521a3050934cf3b0ae97a800d1bc31449398",
            hashType: "data1",
          },
          cellDep: {
            outPoint: {
              txHash:
                "0x06995b9fc19461a2bf9933e57b69af47a20bf0a5bc6c0ffcb85567a2c733f0a1",
              index: "0x0",
            },
            depType: "code",
          },
          behaviors: {
            lockProxy: true,
            cobuild: true,
          },
        },
      ],
    },
  },
};

export const DOBS_MAINNET_CONFIG: SporeConfig = {
  lumos: LINA,
  ckbNodeUrl: "https://mainnet.ckb.dev/rpc",
  ckbIndexerUrl: "https://mainnet.ckb.dev/indexer",
  maxTransactionSize: 500 * 1024, // 500 KB
  defaultTags: ["latest"],
  scripts: {
    ...predefinedSporeConfigs.Mainnet.scripts,
  },
};
