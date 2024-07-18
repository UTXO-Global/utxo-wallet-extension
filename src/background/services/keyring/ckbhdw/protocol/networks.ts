import { NetType } from "./types";
import { hexToBytes } from "@noble/hashes/utils";

const b = hexToBytes;

export const MAINNET: NetType = {
  type: "main",
  magic: 0xc0c0c0c0,
  checkpointMap: {
    1000: b("35668ee4f0fc1334849813c8a8e583814e9b22bfe5dc5a2bd2ded2b3aeec6643"),
  },
  deployments: {
    csv: {
      name: "csv",
      bit: 0,
      startTime: -1,
      timeout: 1493596800,
      threshold: -1,
      window: -1,
      required: false,
      force: true,
    },
    segwit: {
      name: "segwit",
      bit: 1,
      startTime: -1,
      timeout: 1510704000,
      threshold: -1,
      window: -1,
      required: true,
      force: false,
    },
    segsignal: {
      name: "segsignal",
      bit: 4,
      startTime: 1496275200,
      timeout: 1510704000,
      threshold: 269,
      window: 336,
      required: false,
      force: false,
    },
    testdummy: {
      name: "testdummy",
      bit: 28,
      startTime: -1,
      timeout: 1230767999,
      threshold: -1,
      window: -1,
      required: false,
      force: true,
    },
  },
  deploys: [],
  keyPrefix: {
    privkey: 0x7d,
    xpubkey: 0x0768acde,
    xprivkey: 0x0768feb1,
    xpubkey58: "xpub",
    xprivkey58: "xprv",
    coinType: 0,
  },
  addressPrefix: {
    pubkeyhash: 25,
    scripthash: 30,
    bech32: "",
  },
};

MAINNET.deploys = [
  MAINNET.deployments.csv,
  MAINNET.deployments.segwit,
  MAINNET.deployments.testdummy,
];
