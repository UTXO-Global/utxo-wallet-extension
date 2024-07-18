import TimeData from "./timedelta";
import { VERSION_TOP_MASK } from "./consensus";
import { search } from "../utils/binary";
import { NetType } from "./types";
import { MAINNET } from "./networks";

class Network {
  network: NetType;
  checkpoints: {
    hash: Uint8Array;
    height: number;
  }[];
  unknownBits: unknown;
  time: TimeData;

  constructor(network: NetType = MAINNET) {
    this.network = network;
    this.checkpoints = [];
    this.unknownBits = ~VERSION_TOP_MASK;
    this.time = new TimeData();

    this.init();
  }

  init() {
    let bits = 0;

    for (const deployment of this.network.deploys) bits |= 1 << deployment.bit;

    bits |= VERSION_TOP_MASK;

    this.unknownBits = ~bits >>> 0;

    for (const key of Object.keys(
      this.network.checkpointMap
    ) as any as number[]) {
      const hash = this.network.checkpointMap[key];
      const height = Number(key);

      this.checkpoints.push({ hash, height });
    }

    this.checkpoints.sort(cmpNode);
  }

  byBit(bit: number): unknown {
    const index = search(this.network.deploys, bit, cmpBit);

    if (index === -1) return null;

    return this.network.deploys[index];
  }

  now(): number {
    return this.time.now();
  }

  ms(): number {
    return this.time.ms();
  }

  static by(
    value: string | number,
    compare: (v1: any, v2: any) => boolean,
    network?: NetType,
    name?: string
  ) {
    if (network) {
      if (compare(network!, value)) return new Network(network);
      throw new Error(`Network mismatch for ${name}.`);
    }

    throw new Error(`Network not found for ${name}.`);
  }

  static fromMagic(value: number, network?: NetType): Network {
    return Network.by(value, cmpMagic, network, "magic number");
  }

  static fromWIF(prefix: number, network?: NetType): Network {
    return Network.by(prefix, cmpWIF, network, "WIF");
  }

  static fromPublic(prefix: number, network?: NetType): Network {
    return Network.by(prefix, cmpPub, network, "xpubkey");
  }

  static fromPrivate(prefix: number, network?: NetType): Network {
    return Network.by(prefix, cmpPriv, network, "xprivkey");
  }

  static fromPublic58(prefix: string, network?: NetType): Network {
    return Network.by(prefix, cmpPub58, network, "xpubkey");
  }

  static fromPrivate58(prefix: string, network?: NetType): Network {
    return Network.by(prefix, cmpPriv58, network, "xprivkey");
  }

  static fromBase58(prefix: number, network?: NetType): Network {
    return Network.by(prefix, cmpBase58, network, "base58 address");
  }

  static fromBech32(hrp: string, network?: NetType): Network {
    return Network.by(hrp, cmpBech32, network, "bech32 address");
  }

  static fromBech32m(hrp: string, network?: NetType): Network {
    return Network.by(hrp, cmpBech32, network, "bech32m address");
  }

  toString(): string {
    return this.network.type;
  }

  inspect(): string {
    return `<Network: ${this.network.type}>`;
  }

  static isNetwork(obj: unknown): boolean {
    return obj instanceof Network;
  }
}

function cmpBit(a: any, b: any) {
  return a.bit - b;
}

function cmpNode(a: { height: number }, b: { height: number }) {
  return a.height - b.height;
}

function cmpMagic(network: Network, magic: unknown) {
  return network.network.magic === magic;
}

function cmpWIF(network: Network, prefix: number) {
  return network.network.keyPrefix.privkey === prefix;
}

function cmpPub(network: Network, prefix: number) {
  return network.network.keyPrefix.xpubkey === prefix;
}

function cmpPriv(network: Network, prefix: number) {
  return network.network.keyPrefix.xprivkey === prefix;
}

function cmpPub58(network: Network, prefix: string) {
  return network.network.keyPrefix.xpubkey58 === prefix;
}

function cmpPriv58(network: Network, prefix: string) {
  return network.network.keyPrefix.xprivkey58 === prefix;
}

function cmpBase58(network: Network, prefix: number) {
  const prefixes = network.network.addressPrefix;

  switch (prefix) {
    case prefixes.pubkeyhash:
    case prefixes.scripthash:
      return true;
  }

  return false;
}

function cmpBech32(network: Network, hrp: string) {
  return network.network.addressPrefix.bech32 === hrp;
}

export default Network;
