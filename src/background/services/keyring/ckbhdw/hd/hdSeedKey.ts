import {
  getNetworkDataBySlug,
  isBitcoinNetwork,
  isDogecoinNetwork,
} from "@/shared/networks";
import { NetworkSlug } from "@/shared/networks/types";
import * as tinysecp from "@bitcoinerlab/secp256k1";
import { hd, helpers } from "@ckb-lumos/lumos";
import { sha256 } from "@noble/hashes/sha256";
import {
  hexToBytes as fromHex,
  bytesToHex as toHex,
} from "@noble/hashes/utils";
import ECPairFactory, { ECPairInterface } from "@/packages/pair";
import { mnemonicToSeed } from "bip39";
import { crypto, Psbt } from "bitcoinjs-lib";
import { secp256k1 } from "@noble/curves/secp256k1";
import { signMessage as _signMessage } from "./bip322";
import HDKey from "./hdkey";
import type {
  FromMnemonicOpts,
  FromSeedOpts,
  Hex,
  Keyring,
  PrivateKeyOptions,
  SerializedHDKey,
  ToSignInput,
} from "./types";
import { isTaprootInput, toXOnly } from "./utils";
import { messageHashCkbSecp256k1 } from ".";
import { ccc } from "@ckb-ccc/core";

const ECPair = ECPairFactory(tinysecp);

class HDSeedKey implements Keyring<SerializedHDKey> {
  childIndex: number = 0;

  private seed?: Uint8Array;
  private hdWallet?: HDKey;
  private walletName?: string;

  constructor(options?: PrivateKeyOptions) {
    if (options) this.fromOptions(options).catch((e) => console.error(e));
  }

  signTypedData(
    hdPath: string,
    typedData: Record<string, unknown>,
    networkSlug: NetworkSlug
  ) {
    return this.signMessage(hdPath, JSON.stringify(typedData), networkSlug);
  }

  exportPublicKey(hdPath: string) {
    const account = this.getAccountByPath(hdPath);
    return account.publicKey.toString("hex");
  }

  verifyMessage(hdPath: string, text: string, sig: string) {
    const account = this.getAccountByPath(hdPath);
    const hash = sha256(text);
    return account.verify(Buffer.from(hash), Buffer.from(sig, "base64"));
  }

  exportAccount(hdPath: string, networkSlug: NetworkSlug) {
    const network = getNetworkDataBySlug(networkSlug);
    const account = this.getAccountByPath(hdPath);
    if (
      isBitcoinNetwork(network.network) ||
      isDogecoinNetwork(network.network)
    ) {
      account.network = network.network;
      return account.toWIF();
    } else {
      return account.privateKey.toString("hex");
    }
  }

  signPsbt(psbt: Psbt, inputs: ToSignInput[]) {
    let account: ECPairInterface | undefined;

    inputs.map((i, index) => {
      account = this.getAccountByPath(i.hdPath);

      // add internal key as account pubkey for taproot input
      const psbtInput = psbt.data.inputs[index];
      if (isTaprootInput(psbtInput)) {
        psbt.data.inputs[i.index].tapInternalKey = toXOnly(account.publicKey);
        const tweakedSigner = account.tweak(
          crypto.taggedHash("TapTweak", toXOnly(account.publicKey))
        );
        psbt.signTaprootInput(i.index, tweakedSigner);
      } else {
        psbt.signInput(i.index, account!, i.sighashTypes);
      }
    });

    psbt.finalizeAllInputs();
  }

  signAllInputsInPsbt(psbt: Psbt, hdPath: string) {
    const account = this.getAccountByPath(hdPath);
    psbt.signAllInputs(account);
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
    let account: ECPairInterface | undefined;

    inputs.map((i, index) => {
      account = this.getAccountByPath(i.hdPath);

      // add internal key as account pubkey for taproot input
      const psbtInput = psbt.data.inputs[index];
      if (isTaprootInput(psbtInput)) {
        psbt.data.inputs[i.index].tapInternalKey = toXOnly(account.publicKey);
        const tweakedSigner = account.tweak(
          crypto.taggedHash("TapTweak", toXOnly(account.publicKey))
        );
        psbt.signTaprootInput(i.index, tweakedSigner);
      } else {
        psbt.signInput(i.index, account!, i.sighashTypes);
      }
    });

    return psbt.data.inputs.map((f, i) => ({
      inputIndex: i,
      partialSig: f.partialSig?.flatMap((p) => p) ?? [],
    }));
  }

  signRecoverable(hdPath: string, message: string) {
    const node = this.hdWallet.derive(hdPath);
    return hd.key.signRecoverable(
      message!,
      "0x" + node.privateKey.toString("hex")
    );
  }

  signMessage(hdPath: string, text: string, networkSlug: NetworkSlug) {
    const account = this.getAccountByPath(hdPath);
    if (["nervos", "nervos_testnet"].includes(networkSlug)) {
      const signature = secp256k1.sign(
        ccc.bytesFrom(messageHashCkbSecp256k1(text)),
        ccc.bytesFrom(ccc.hexFrom(new Uint8Array(account.privateKey)))
      );
      const { r, s, recovery } = signature;

      return ccc.hexFrom(
        ccc.bytesConcat(
          ccc.numBeToBytes(r, 32),
          ccc.numBeToBytes(s, 32),
          ccc.numBeToBytes(recovery, 1)
        )
      );
    }
    return _signMessage(text, account, networkSlug);
  }

  signPersonalMessage(hdPath: string, message: Hex, networkSlug: NetworkSlug) {
    return this.signMessage(hdPath, message, networkSlug);
  }

  async fromOptions(options: PrivateKeyOptions) {
    this.fromSeed({
      seed: new Uint8Array(Buffer.from(options.seed)),
    });
    return this;
  }

  static fromOptions(options: PrivateKeyOptions) {
    return new this().fromOptions(options);
  }

  fromSeed(opts: FromSeedOpts) {
    this.childIndex = 0;
    this.seed = opts.seed;
    this.hdWallet = HDKey.fromMasterSeed(Buffer.from(opts.seed));

    return this;
  }

  static fromSeed(opts: FromSeedOpts): HDSeedKey {
    return new this().fromSeed(opts);
  }

  async fromMnemonic(opts: FromMnemonicOpts): Promise<HDSeedKey> {
    const seed = await mnemonicToSeed(opts.mnemonic, opts.passphrase);

    this.fromSeed({
      seed: new Uint8Array(seed),
    });

    this.walletName = opts.walletName;

    return this;
  }

  static fromMnemonic(opts: FromMnemonicOpts): Promise<HDSeedKey> {
    return new this().fromMnemonic(opts);
  }

  fromPrivateKey(_key: Uint8Array) {
    throw new Error("Method not allowed for HDSeedKey.");
  }

  static fromPrivateKey(key: Uint8Array) {
    return new this().fromPrivateKey(key);
  }

  serialize(): SerializedHDKey {
    if (this.childIndex !== 0)
      throw new Error("You should use only root wallet to serializing");
    return {
      seed: toHex(this.seed!),
    };
  }

  static deserialize(opts: SerializedHDKey) {
    if (!opts.seed) {
      throw new Error(
        "HDSeedKey: Deserialize method cannot be called with an opts value for numberOfAccounts and no seed"
      );
    }

    const root = HDSeedKey.fromSeed({
      seed: fromHex(opts.seed),
    });

    return root;
  }

  getAccountByPath(hdPath: string) {
    const node = this.hdWallet.derive(hdPath);
    return ECPair.fromPrivateKey(node.privateKey);
  }

  deserialize(state: SerializedHDKey) {
    return HDSeedKey.deserialize(state);
  }

  isSimpleKey() {
    return false;
  }

  isNetworkBaseHdPath() {
    return this.walletName !== "Unisat";
  }
}

export default HDSeedKey;
