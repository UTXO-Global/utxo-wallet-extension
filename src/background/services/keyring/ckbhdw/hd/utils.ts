import {
  getNetworkDataBySlug,
  isBitcoinNetwork,
  isCkbNetwork,
  isDogecoinNetwork,
} from "@/shared/networks";
import { publicKeyToBlake160 } from "@/shared/networks/ckb/helpers";
import { NetworkSlug } from "@/shared/networks/types";
import * as ecc from "@bitcoinerlab/secp256k1";
import { encodeToAddress } from "@ckb-lumos/lumos/helpers";
import { sha256 } from "@noble/hashes/sha256";
import * as bitcoinjs from "bitcoinjs-lib";
import { payments } from "bitcoinjs-lib";
import varuint from "varuint-bitcoin";
import { AddressType } from "./types";

export function magicHashMessage(
  messagePrefix: string,
  text: string
): Uint8Array {
  const messagePrefixBytes = Buffer.from(messagePrefix, "utf8");
  const messageBytes = Buffer.from(text, "utf8");
  const messageVISize = varuint.encodingLength(messageBytes.length);
  const buffer = Buffer.allocUnsafe(
    messagePrefixBytes.length + messageVISize + messageBytes.length
  );
  messagePrefixBytes.copy(buffer, 0);
  varuint.encode(messageBytes.length, buffer, messagePrefixBytes.length);
  messageBytes.copy(buffer, messagePrefixBytes.length + messageVISize);
  return sha256(sha256(buffer));
}

export function encodeSignature(
  signature: Buffer,
  recovery: number,
  compressed: boolean
) {
  if (compressed) recovery += 4;
  return Buffer.concat([Buffer.alloc(1, recovery + 27), signature]);
}

export const toXOnly = (pubKey: Buffer) =>
  pubKey.length === 32 ? pubKey : pubKey.slice(1, 33);

function isPaymentFactory(payment: any): (script: Buffer) => boolean {
  return (script: Buffer): boolean => {
    try {
      payment({ output: script });
      return true;
    } catch (err) {
      return false;
    }
  };
}

export const isP2MS = isPaymentFactory(payments.p2ms);
export const isP2PK = isPaymentFactory(payments.p2pk);
export const isP2PKH = isPaymentFactory(payments.p2pkh);
export const isP2WPKH = isPaymentFactory(payments.p2wpkh);
export const isP2WSHScript = isPaymentFactory(payments.p2wsh);
export const isP2SHScript = isPaymentFactory(payments.p2sh);
export const isP2TR = isPaymentFactory(payments.p2tr);

export function isTaprootInput(input: any): boolean {
  return (
    input &&
    !!(
      input.tapInternalKey ||
      input.tapMerkleRoot ||
      (input.tapLeafScript && input.tapLeafScript.length) ||
      (input.tapBip32Derivation && input.tapBip32Derivation.length) ||
      (input.witnessUtxo && isP2TR(input.witnessUtxo.script))
    )
  );
}

export function getAddress(
  addressType: AddressType,
  publicKey: Uint8Array,
  networkSlug: NetworkSlug
) {
  if (addressType === undefined)
    throw new Error("addressType of keyring is not specified");

  const network = getNetworkDataBySlug(networkSlug).network;
  if (isBitcoinNetwork(network) || isDogecoinNetwork(network)) {
    switch (addressType) {
      case AddressType.P2WPKH:
        return payments.p2wpkh({
          pubkey: Buffer.from(publicKey),
          network: network,
        }).address;
      case AddressType.P2SH_P2WPKH:
        return payments.p2sh({
          redeem: payments.p2wpkh({
            pubkey: Buffer.from(publicKey),
            network: network,
          }),
        }).address;
      case AddressType.P2PKH as any:
        return payments.p2pkh({
          pubkey: Buffer.from(publicKey),
          network: network,
        }).address;
      case AddressType.P2TR as any:
        bitcoinjs.initEccLib(ecc);
        return payments.p2tr({
          internalPubkey: toXOnly(Buffer.from(publicKey)),
          network: network,
        }).address;
      default:
        throw new Error("Invalid AddressType");
    }
  } else if (isCkbNetwork(network)) {
    const args = publicKeyToBlake160(
      "0x" + Buffer.from(publicKey).toString("hex")
    );
    const template = network.lumosConfig.SCRIPTS.SECP256K1_BLAKE160!;
    const lockScript = {
      codeHash: template.CODE_HASH,
      hashType: template.HASH_TYPE,
      args: args,
    };

    const address = encodeToAddress(lockScript, {
      config: network.lumosConfig,
    });

    return address;
  } else {
    throw new Error("Invalid network");
  }
}
