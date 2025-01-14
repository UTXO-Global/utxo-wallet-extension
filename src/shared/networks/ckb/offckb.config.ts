import { CellDep, RPC, Script, config } from "@ckb-lumos/lumos";
import { customizedFetch } from "./helpers";
import { CkbIndexer } from "./Indexer";
import { predefined } from "@ckb-lumos/config-manager";
export interface NetworkConfig {
  lumosConfig: config.Config;
  rpc_url: string;
  rpc: RPC;
  indexer: CkbIndexer;
  utxoAPIKey: string;
  RUSD: {
    script: Script;
    cellDep: CellDep;
  };
  USDI: {
    script: Script;
    cellDep: CellDep;
  };
}

export interface OffCKBConfig {
  version: string;
  lumosVersion: string;
  contractBinFolder: string;
  network: {
    devnet: NetworkConfig;
    testnet: NetworkConfig;
    mainnet: NetworkConfig;
  };
  initializeLumosConfig: () => void;
  readonly rpc: RPC;
  readonly indexer: CkbIndexer;
  readonly lumosConfig: config.Config;
}

function readEnvNetwork(): "devnet" | "testnet" | "mainnet" {
  // you may need to update the env method
  // according to your frontend framework
  const network = process.env.NETWORK;
  const defaultNetwork = "testnet";
  if (!network) return defaultNetwork;

  if (!["devnet", "testnet", "mainnet"].includes(network)) {
    return defaultNetwork;
  }

  return network as "devnet" | "testnet" | "mainnet";
}

// please do not alter the following structure
// we use it as a check point in offCKB
// ---devnet lumos config---
const lumosConfig: config.Config = {
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
} as config.Config;
// ---end of devnet lumos config---
// ---testnet lumos config---
const testnetLumosConfig: config.Config = {
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
} as config.Config;
// ---end of testnet lumos config---
// ---mainnet lumos config---
const mainnetLumosConfig: config.Config = {
  ...predefined.LINA,
} as config.Config;
// ---end of mainnet lumos config---

const offCKBConfig: OffCKBConfig = {
  version: "0.2.2",
  lumosVersion: "0.21.1",
  contractBinFolder: "../../build/release",
  network: {
    devnet: {
      lumosConfig,
      rpc_url: "http://127.0.0.1:8114",
      rpc: new RPC("http://127.0.0.1:8114", { fetch: customizedFetch }),
      indexer: new CkbIndexer("http://127.0.0.1:8114"),
      utxoAPIKey: "scmJuHZTih2UZYkdWPhz82DKxiTgblR612MhYQZ1",
      RUSD: {
        script: {
          codeHash:
            "0x1142755a044bf2ee358cba9f2da187ce928c91cd4dc8692ded0337efa677d21a",
          hashType: "type",
          args: "0x878fcc6f1f08d48e87bb1c3b3d5083f23f8a39c5d5c764f253b55b998526439b",
        },
        cellDep: {
          outPoint: {
            txHash:
              "0xed7d65b9ad3d99657e37c4285d585fea8a5fcaf58165d54dacf90243f911548b",
            index: "0x0",
          },
          depType: "code",
        },
      },
      USDI: {
        script: {
          codeHash:
            "0xcc9dc33ef234e14bc788c43a4848556a5fb16401a04662fc55db9bb201987037",
          hashType: "type",
          args: "0x71fd1985b2971a9903e4d8ed0d59e6710166985217ca0681437883837b86162f",
        },
        cellDep: {
          outPoint: {
            txHash:
              "0xaec423c2af7fe844b476333190096b10fc5726e6d9ac58a9b71f71ffac204fee",
            index: "0x0",
          },
          depType: "code",
        },
      },
    },
    testnet: {
      lumosConfig: testnetLumosConfig,
      rpc_url: "https://testnet.ckb.dev/rpc",
      rpc: new RPC("https://testnet.ckb.dev/rpc", { fetch: customizedFetch }),
      indexer: new CkbIndexer("https://testnet.ckb.dev/rpc"),
      utxoAPIKey: "scmJuHZTih2UZYkdWPhz82DKxiTgblR612MhYQZ1",
      RUSD: {
        script: {
          codeHash:
            "0x1142755a044bf2ee358cba9f2da187ce928c91cd4dc8692ded0337efa677d21a",
          hashType: "type",
          args: "0x878fcc6f1f08d48e87bb1c3b3d5083f23f8a39c5d5c764f253b55b998526439b",
        },
        cellDep: {
          outPoint: {
            txHash:
              "0xed7d65b9ad3d99657e37c4285d585fea8a5fcaf58165d54dacf90243f911548b",
            index: "0x0",
          },
          depType: "code",
        },
      },
      USDI: {
        script: {
          codeHash:
            "0xcc9dc33ef234e14bc788c43a4848556a5fb16401a04662fc55db9bb201987037",
          hashType: "type",
          args: "0x71fd1985b2971a9903e4d8ed0d59e6710166985217ca0681437883837b86162f",
        },
        cellDep: {
          outPoint: {
            txHash:
              "0xaec423c2af7fe844b476333190096b10fc5726e6d9ac58a9b71f71ffac204fee",
            index: "0x0",
          },
          depType: "code",
        },
      },
    },
    mainnet: {
      lumosConfig: mainnetLumosConfig,
      rpc_url: "https://mainnet.ckb.dev/rpc",
      rpc: new RPC("https://mainnet.ckb.dev/rpc", { fetch: customizedFetch }),
      indexer: new CkbIndexer("https://mainnet.ckb.dev/rpc"),
      utxoAPIKey: "scmJuHZTih2UZYkdWPhz82DKxiTgblR612MhYQZ1",
      RUSD: {
        script: {
          codeHash:
            "0x26a33e0815888a4a0614a0b7d09fa951e0993ff21e55905510104a0b1312032b",
          hashType: "type",
          args: "0x360c9d87b2824c357958c23e8878f686001e88e9527a08ea229e7d9ba7fe39a7",
        },
        cellDep: {
          outPoint: {
            txHash:
              "0x8ec1081bd03e5417bb4467e96f4cec841acdd35924538a35e7547fe320118977",
            index: "0x0",
          },
          depType: "code",
        },
      },
      USDI: {
        script: {
          codeHash:
            "0xbfa35a9c38a676682b65ade8f02be164d48632281477e36f8dc2f41f79e56bfc",
          hashType: "type",
          args: "0xd591ebdc69626647e056e13345fd830c8b876bb06aa07ba610479eb77153ea9f",
        },
        cellDep: {
          outPoint: {
            txHash:
              "0xf6a5eef65101899db9709c8de1cc28f23c1bee90d857ebe176f6647ef109e20d",
            index: "0x0",
          },
          depType: "code",
        },
      },
    },
  },
  initializeLumosConfig: () => {
    const network = readEnvNetwork();
    const lumosConfig = offCKBConfig.network[network].lumosConfig;
    return config.initializeConfig(lumosConfig);
  },
  get rpc() {
    const network = readEnvNetwork();
    return offCKBConfig.network[network].rpc;
  },

  get indexer() {
    const network = readEnvNetwork();
    return offCKBConfig.network[network].indexer;
  },

  get lumosConfig() {
    const network = readEnvNetwork();
    return offCKBConfig.network[network].lumosConfig;
  },
};

export default offCKBConfig;
