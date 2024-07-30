import { ccc } from "@ckb-ccc/core";
import HDPrivateKey from "./hdPrivateKey";
import HDSeedKey from "./hdSeedKey";
import { AddressType, Keyring } from "./types";

export async function fromMnemonic(mnemonic: string): Promise<HDSeedKey> {
  return await HDSeedKey.fromMnemonic({ mnemonic });
}

export function fromPrivateKey(privateKey: Uint8Array): HDPrivateKey {
  return new HDPrivateKey(privateKey);
}

export * as types from "./types";
export { default as englishWords } from "./words/english";

export function messageHashCkbSecp256k1(
  message: string | ccc.BytesLike
): ccc.Hex {
  const msg = typeof message === "string" ? message : ccc.hexFrom(message);
  const buffer = ccc.bytesFrom(`Nervos Message:${msg}`, "utf8");
  return ccc.hashCkb(buffer);
}

export { AddressType, HDPrivateKey, HDSeedKey, Keyring };
