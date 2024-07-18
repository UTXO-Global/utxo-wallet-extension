import { NetworkSlug } from "@/shared/networks/types";
import { Psbt } from "bitcoinjs-lib";

export type Base58String = string;

export interface PrivateKeyOptions {
  seed: string;
}

export interface FromSeedOpts {
  seed: Uint8Array;
}

export interface FromMnemonicOpts {
  mnemonic: string;
  passphrase?: string;
  walletName?: string;
}

export interface PublicKeyOptions
  extends Omit<PrivateKeyOptions, "privateKey"> {
  xkey: Base58String;
  publicKey: Uint8Array;
}

export interface SerializedHDKey {
  seed: string;
}

export interface SerializedHDPrivateKey {
  privateKey: string;
  isHex?: boolean;
}

export type Hex = string;

export interface ToSignInput {
  index: number;
  hdPath: string;
  sighashTypes?: number[];
}

export enum AddressType {
  P2PKH,
  P2WPKH,
  P2TR,
  P2SH_P2WPKH,
  M44_P2WPKH,
  M44_P2TR,
  CKB_ADDRESS,
}

export type Keyring<State> = {
  generate?: (seed: Uint8Array, entropy: Uint8Array) => Keyring<State>;

  serialize(): State;
  deserialize(state: State): Keyring<State>;
  exportAccount(
    hdPath: string,
    networkSlug: NetworkSlug,
    options?: Record<string, unknown>
  ): string;
  exportPublicKey(hdPath: string): string;
  verifyMessage(hdPath: string, text: string, sig: string): boolean;
  signPsbt(psbt: Psbt, inputs: ToSignInput[]): void;
  signRecoverable(hdPath: string, message: string): string;
  signMessage(hdPath: string, message: Hex, networkSlug: NetworkSlug): string;
  signPersonalMessage(
    hdPath: string,
    message: Hex,
    networkSlug: NetworkSlug
  ): string;
  signTypedData(
    hdPath: string,
    typedData: Record<string, unknown>,
    networkSlug: NetworkSlug
  ): string;
  signAllInputsInPsbt(
    psbt: Psbt,
    hdPath: string
  ): { signatures: (string | undefined)[] };
  signInputsWithoutFinalizing(
    psbt: Psbt,
    inputs: ToSignInput[]
  ): {
    inputIndex: number;
    partialSig: { pubkey: Buffer; signature: Buffer }[];
  }[];
  isSimpleKey(): boolean;
  isNetworkBaseHdPath(): boolean;
};

export const DISALLOWED_CHILD_METHODS: (keyof Keyring<any>)[] = [
  "deserialize",
  "serialize",
  "generate",
];
