interface Deployment {
  name: string;
  bit: number;
  startTime: number;
  timeout: number;
  threshold: number;
  window: number;
  required: boolean;
  force: boolean;
}

interface KeyPrefix {
  privkey: number;
  xpubkey: number;
  xprivkey: number;
  xpubkey58: string;
  xprivkey58: string;
  coinType: number;
}

interface AddressPrefix {
  pubkeyhash: number;
  scripthash: number;
  bech32: string;
}

export type NetworkType = "main" | "testnet";

export interface NetType {
  type: NetworkType;
  magic: number;
  checkpointMap: Record<number, Uint8Array>;
  deployments: Record<string, Deployment>;
  deploys: Deployment[];
  keyPrefix: KeyPrefix;
  addressPrefix: AddressPrefix;
}
