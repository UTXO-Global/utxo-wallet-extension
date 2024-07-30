import { BytesLike, bytesFrom } from "@/shared/utils/bytes";
import HDPrivateKey from "./hdPrivateKey";
import HDSeedKey from "./hdSeedKey";
import { AddressType, Keyring } from "./types";
import { Hex, hexFrom } from "@/shared/utils/hex";
import { hashCkb } from "@/shared/utils/hasher";

export async function fromMnemonic(mnemonic: string): Promise<HDSeedKey> {
  return await HDSeedKey.fromMnemonic({ mnemonic });
}

export function fromPrivateKey(privateKey: Uint8Array): HDPrivateKey {
  return new HDPrivateKey(privateKey);
}

export * as types from "./types";
export { default as englishWords } from "./words/english";

export function messageHashCkbSecp256k1(message: string | BytesLike): Hex {
  const msg = typeof message === "string" ? message : hexFrom(message);
  const buffer = bytesFrom(`Nervos Message:${msg}`, "utf8");
  return hashCkb(buffer);
}

export { AddressType, HDPrivateKey, HDSeedKey, Keyring };
