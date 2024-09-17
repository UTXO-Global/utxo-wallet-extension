import { RPC, config } from "@ckb-lumos/lumos";
import { customizedFetch } from "./helpers";
import { CkbIndexer } from "./Indexer";
import { predefined } from "@ckb-lumos/config-manager";
export interface NetworkConfig {
  lumosConfig: config.Config;
  rpc_url: string;
  rpc: RPC;
  indexer: CkbIndexer;
  utxoAPIKey: string;
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
      utxoAPIKey: "cYztRDvbH9sDaH2HV2Ut4TpIioYVyG07pUz46Dz1",
    },
    testnet: {
      lumosConfig: testnetLumosConfig,
      rpc_url: "https://testnet.ckb.dev/rpc",
      rpc: new RPC("https://testnet.ckb.dev/rpc", { fetch: customizedFetch }),
      indexer: new CkbIndexer("https://testnet.ckb.dev/rpc"),
      utxoAPIKey: "cYztRDvbH9sDaH2HV2Ut4TpIioYVyG07pUz46Dz1",
    },
    mainnet: {
      lumosConfig: mainnetLumosConfig,
      rpc_url: "https://mainnet.ckb.dev/rpc",
      rpc: new RPC("https://mainnet.ckb.dev/rpc", { fetch: customizedFetch }),
      indexer: new CkbIndexer("https://mainnet.ckb.dev/rpc"),
      utxoAPIKey: "cYztRDvbH9sDaH2HV2Ut4TpIioYVyG07pUz46Dz1",
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
