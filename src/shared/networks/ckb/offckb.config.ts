import { RPC, config } from "@ckb-lumos/lumos";
import { customizedFetch } from "./helpers";
import { CkbIndexer } from "./Indexer";
import { AGGRON4, LINA } from "..";
export interface NetworkConfig {
  lumosConfig: config.Config;
  rpc_url: string;
  rpc: RPC;
  indexer: CkbIndexer;
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
  ...AGGRON4,
} as config.Config;
// ---end of devnet lumos config---
// ---testnet lumos config---
const testnetLumosConfig: config.Config = {
  ...AGGRON4,
} as config.Config;
// ---end of testnet lumos config---
// ---mainnet lumos config---
const mainnetLumosConfig: config.Config = {
  ...LINA,
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
    },
    testnet: {
      lumosConfig: testnetLumosConfig,
      rpc_url: "https://testnet.ckb.dev/rpc",
      rpc: new RPC("https://testnet.ckb.dev/rpc", { fetch: customizedFetch }),
      indexer: new CkbIndexer("https://testnet.ckb.dev/rpc"),
    },
    mainnet: {
      lumosConfig: mainnetLumosConfig,
      rpc_url: "https://mainnet.ckb.dev/rpc",
      rpc: new RPC("https://mainnet.ckb.dev/rpc", { fetch: customizedFetch }),
      indexer: new CkbIndexer("https://mainnet.ckb.dev/rpc"),
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
