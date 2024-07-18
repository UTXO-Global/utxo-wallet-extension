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
export { AddressType, HDPrivateKey, HDSeedKey, Keyring };
