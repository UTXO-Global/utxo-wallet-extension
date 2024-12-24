import { Network as BitcoinNetwork } from "bitcoinjs-lib";
import { BTC_LIVENET, BTC_SIGNET, BTC_TESTNET, BTC_TESTNET4 } from "./btc";
import { CKB_MAINNET, CKB_NEURON_HD_PATH, CKB_TESTNET } from "./ckb";
import { NetworkConfig as CkbNetwork } from "./ckb/offckb.config";
import { ChainData, ChainSlug, NetworkData, NetworkSlug } from "./types";
import { predefined } from "@ckb-lumos/config-manager";
import { Config, createConfig } from "@ckb-lumos/lumos/config";
import { SporeConfig, predefinedSporeConfigs } from "@spore-sdk/core";
import { DOGECOIN_LIVENET, DOGECOIN_TESTNET } from "./dogecoin";

export const defaultNetwork = CKB_MAINNET;

export const btcTestnetSlug = ["btc_testnet", "btc_testnet_4", "btc_signet"];
export const nervosTestnetSlug = ["nervos_testnet"];
export const dogecoinTestnetSlug = ["dogecoin_testnet"];

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
          value: "utxoGlobal",
          hdPath: "",
          passphrase: "",
        },
        {
          name: "Neuron",
          value: "neuron",
          hdPath: CKB_NEURON_HD_PATH,
          passphrase: "",
        },
        {
          name: "Others",
          value: "others",
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
            name: "Unisat",
            value: "unisat",
            passphrase: "",
          },
          {
            name: "Others",
            value: "others",
            passphrase: "",
          },
        ],
      })
    ),
  },
  {
    name: "Dogecoin",
    slug: "dogecoin",
    networks: [DOGECOIN_LIVENET, DOGECOIN_TESTNET].map((chain) => ({
      ...chain,
      parentSlug: "dogecoin",
      walletToImport: [],
    })),
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
  // bitcoin: 0x80
  // testnet: 0xef
  return (
    (<BitcoinNetwork>network).wif === 0x80 ||
    (<BitcoinNetwork>network).wif === 0xef
  );
}

export function isDogecoinNetwork(
  network: BitcoinNetwork | CkbNetwork
): network is BitcoinNetwork {
  // dogecoin: 0x9e
  // testnet: 0xf1
  return (
    (<BitcoinNetwork>network).wif === 0x9e ||
    (<BitcoinNetwork>network).wif === 0xf1
  );
}

export const NETWORK_ICON = {
  btc: "/btc.png",
  btc_testnet: "/btc.png",
  btc_testnet_4: "/btc.png",
  btc_signet: "/btc.png",
  nervos: "/ckb.png",
  nervos_testnet: "/ckb.png",
  dogecoin: "/dogecoin.png",
  dogecoin_testnet: "/dogecoin.png",
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
    // {
    //   "name": "multisig",
    //   "tx_hash": "0xe6774580c98c8b15799c628f539ed5722f3bc2b17206c2280e15f99be3c1ad71",
    //   "index": 0,
    //   "occupied_capacity": 5255000000000,
    //   "data_hash": "0x50c8623ef5112510ccdf2d8e480d02d0de7288eb9968f8b019817340c3991145",
    //   "type_id": "0x765b3ed6ae264b335d07e73ac332bf2c0f38f8d3340ed521cb447b4c42dd5f09"
    // }
    // testnet已部署
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
  SCRIPTS: {
    ...predefined.LINA.SCRIPTS,
    // mainnet已部署：
    // {
    //   "cell_recipes": [
    //     {
    //       "name": "multisig",
    //       "tx_hash": "0x0a13d8d9c83c3374196ee43d4f0116dac497b0fec3e71c04f7cb7780abc455d8",
    //       "index": 0,
    //       "occupied_capacity": 5255000000000,
    //       "data_hash": "0x50c8623ef5112510ccdf2d8e480d02d0de7288eb9968f8b019817340c3991145",
    //       "type_id": "0xd1a9f877aed3f5e07cb9c52b61ab96d06f250ae6883cc7f0a2423db0976fc821"
    //     }
    //   ],
    //   "dep_group_recipes": []
    // }
    SECP256K1_BLAKE160_MULTISIG: {
      CODE_HASH:
        "0xd1a9f877aed3f5e07cb9c52b61ab96d06f250ae6883cc7f0a2423db0976fc821",
      HASH_TYPE: "type",
      TX_HASH:
        "0x0a13d8d9c83c3374196ee43d4f0116dac497b0fec3e71c04f7cb7780abc455d8",
      INDEX: "0x0",
      DEP_TYPE: "code",
      SHORT_ID: 1,
    },
    XUDT: {
      CODE_HASH:
        "0x50bd8d6680b8b9cf98b73f3c08faf8b2a21914311954118ad6609be6e78a1b95",
      HASH_TYPE: "data1",
      TX_HASH:
        "0xc07844ce21b38e4b071dd0e1ee3b0e27afd8d7532491327f39b786343f558ab7",
      INDEX: "0x0",
      DEP_TYPE: "code",
    },
  },
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
    Cluster: {
      versions: [
        // eslint-disable-next-line no-unsafe-optional-chaining
        ...predefinedSporeConfigs.Testnet.scripts?.Cluster.versions,
        {
          tags: ["v2", "preview"],
          script: {
            codeHash:
              "0x7366a61534fa7c7e6225ecc0d828ea3b5366adec2b58206f2ee84995fe030075",
            hashType: "data1",
          },
          cellDep: {
            outPoint: {
              txHash:
                "0xfbceb70b2e683ef3a97865bb88e082e3e5366ee195a9c826e3c07d1026792fcd",
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
    ClusterProxy: {
      versions: [
        // eslint-disable-next-line no-unsafe-optional-chaining
        ...predefinedSporeConfigs.Testnet.scripts?.ClusterProxy.versions,
        {
          tags: ["v2", "preview"],
          script: {
            codeHash:
              "0xbe8b9ce3d05a32c4bb26fe71cd5fc1407ce91e3a8b9e8719be2ab072cef1454b",
            hashType: "data1",
          },
          cellDep: {
            outPoint: {
              txHash:
                "0x0231ea581bbc38965e10a2659da326ae840c038a9d0d6849f458b51d94870104",
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

export const DOB_PROTOCOL_VERSIONS = ["dob/0", "dob/1"];
