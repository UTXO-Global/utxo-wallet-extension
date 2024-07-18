import { getNetworkDataBySlug, isBitcoinNetwork } from "@/shared/networks";
import { NetworkSlug } from "@/shared/networks/types";
import * as tinysecp from "@bitcoinerlab/secp256k1";
import { hd } from "@ckb-lumos/lumos";
import { blake2b, PERSONAL } from "@nervosnetwork/ckb-sdk-utils";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";
import ECPairFactory, { ECPairInterface } from "@/packages/pair";
import { crypto, Psbt } from "bitcoinjs-lib";
import secp256k1 from "secp256k1";
import { signMessage as _signMessage } from "./bip322";
import { ZERO_KEY, ZERO_PRIVKEY } from "./common";
import { Keyring, SerializedHDPrivateKey, ToSignInput } from "./types";
import { isTaprootInput, toXOnly } from "./utils";

const ECPair = ECPairFactory(tinysecp);

class HDPrivateKey implements Keyring<SerializedHDPrivateKey> {
  privateKey: Uint8Array = ZERO_PRIVKEY;
  publicKey = ZERO_KEY;

  private pair?: ECPairInterface;

  constructor(privateKey: Uint8Array) {
    this.privateKey = privateKey;
  }

  private initPair() {
    if (!this.privateKey)
      throw new Error("Simple Keyring: Invalid privateKey provided");
    if (!this.pair) {
      this.pair = ECPair.fromPrivateKey(Buffer.from(this.privateKey));
      this.publicKey = this.pair.publicKey;
    }
  }

  signTypedData(
    _: string,
    typedData: Record<string, unknown>,
    networkSlug: NetworkSlug
  ) {
    this.initPair();

    return this.signMessage(_, JSON.stringify(typedData), networkSlug);
  }

  verifyMessage(_: string, text: string, sig: string) {
    this.initPair();

    return this.pair!.verify(
      Buffer.from(hexToBytes(text)),
      Buffer.from(hexToBytes(sig))
    )!;
  }

  serialize() {
    this.initPair();

    const wif = this.pair?.toWIF();
    if (!wif) throw new Error("Failed to export wif for simple wallet");

    return {
      privateKey: wif,
    };
  }

  deserialize(state: SerializedHDPrivateKey) {
    const wallet = HDPrivateKey.deserialize(state);
    this.privateKey = wallet.privateKey;
    this.pair = wallet.pair;
    return this;
  }

  static deserialize(state: SerializedHDPrivateKey) {
    let pair: ECPairInterface | undefined;

    if (state.isHex) {
      pair = ECPair.fromPrivateKey(Buffer.from(state.privateKey, "hex"));
    } else {
      pair = ECPair.fromWIF(state.privateKey);
    }

    const wallet = new this(pair.privateKey!);
    wallet.initPair();
    return wallet;
  }

  exportAccount(
    _: string,
    networkSlug: NetworkSlug,
    _options?: Record<string, unknown> | undefined
  ) {
    this.initPair();

    const network = getNetworkDataBySlug(networkSlug);
    if (isBitcoinNetwork(network.network)) {
      this.pair.network = network.network;
      return this.pair.toWIF();
    } else {
      return this.pair.privateKey.toString("hex");
    }
  }

  exportPublicKey(_: string) {
    this.initPair();

    return bytesToHex(this.publicKey);
  }

  signPsbt(psbt: Psbt, inputs: ToSignInput[]) {
    this.initPair();

    for (const i of inputs) {
      // add internal key as account pubkey for taproot input
      const psbtInput = psbt.data.inputs[i.index];
      if (isTaprootInput(psbtInput)) {
        psbt.data.inputs[i.index].tapInternalKey = toXOnly(this.pair.publicKey);
        const tweakedSigner = this.pair.tweak(
          crypto.taggedHash("TapTweak", toXOnly(this.pair.publicKey))
        );
        psbt.signTaprootInput(i.index, tweakedSigner);
      } else {
        psbt.signInput(i.index, this.pair!, i.sighashTypes);
      }
    }
    psbt.finalizeAllInputs();
  }

  signRecoverable(_: string, message: string) {
    this.initPair();
    return hd.key.signRecoverable(
      message!,
      "0x" + this.pair.privateKey.toString("hex")
    );
  }

  signAllInputsInPsbt(psbt: Psbt, _: string) {
    this.initPair();
    if (this.pair === undefined)
      throw new Error("Cannot sign all inputs since pair is undefined");
    psbt.signAllInputs(this.pair!);
    return {
      signatures: psbt.data.inputs.map((i) => {
        if (
          i.partialSig &&
          i.partialSig[0] &&
          i.partialSig[0].signature.length
        ) {
          return i.partialSig[0].signature.toString("hex");
        }
      }),
    };
  }

  signInputsWithoutFinalizing(
    psbt: Psbt,
    inputs: ToSignInput[]
  ): {
    inputIndex: number;
    partialSig: { pubkey: Buffer; signature: Buffer }[];
  }[] {
    this.initPair();
    if (this.pair === undefined)
      throw new Error("Cannot sign inputs since pair is undefined");
    for (const i of inputs) {
      // add internal key as account pubkey for taproot input
      const psbtInput = psbt.data.inputs[i.index];
      if (isTaprootInput(psbtInput)) {
        psbt.data.inputs[i.index].tapInternalKey = toXOnly(this.pair.publicKey);
        const tweakedSigner = this.pair.tweak(
          crypto.taggedHash("TapTweak", toXOnly(this.pair.publicKey))
        );
        psbt.signTaprootInput(i.index, tweakedSigner);
      } else {
        psbt.signInput(i.index, this.pair!, i.sighashTypes);
      }
    }
    return psbt.data.inputs.map((f, i) => ({
      inputIndex: i,
      partialSig: f.partialSig?.flatMap((p) => p) ?? [],
    }));
  }

  signMessage(_: string, text: string, networkSlug: NetworkSlug) {
    this.initPair();
    if (["nervos", "nervos_testnet"].includes(networkSlug)) {
      // Create a new TextEncoder instance
      const encoder = new TextEncoder();
      // Encode the message into a Uint8Array
      const _message = encoder.encode(text);
      // Hash the message using blake2b
      const messageHash = blake2b(16, null, null, PERSONAL)
        .update(_message)
        .digest("hex");

      // Encode the string into a Uint8Array
      const _messageHash = encoder.encode(messageHash as string);
      const { signature } = secp256k1.ecdsaSign(
        _messageHash,
        this.pair.privateKey
      );

      // Convert the signature to a hex string
      const signatureHex = Buffer.from(signature).toString("hex");
      return signatureHex;
    }
    return _signMessage(text, this.pair, networkSlug);
  }

  signPersonalMessage(_: string, message: string, networkSlug: NetworkSlug) {
    return this.signMessage(_, message, networkSlug);
  }

  isSimpleKey() {
    return true;
  }

  isNetworkBaseHdPath() {
    return true;
  }
}

export default HDPrivateKey;
