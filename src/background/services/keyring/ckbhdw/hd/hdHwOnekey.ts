import { NetworkSlug } from "@/shared/networks/types";
import { Psbt } from "bitcoinjs-lib";
import { signMessage as _signMessage } from "./bip322";
import type {
  HDOneKeyOptions,
  Hex,
  Keyring,
  SerializedHDOneKey,
  ToSignInput,
} from "./types";

class HDOneKey implements Keyring<SerializedHDOneKey> {
  public connectId: string;
  public deviceId: string;

  constructor(opts: HDOneKeyOptions) {
    this.deviceId = opts.deviceId;
    this.connectId = opts.connectId;
  }

  signTypedData(
    hdPath: string,
    typedData: Record<string, unknown>,
    networkSlug: NetworkSlug
  ) {
    return this.signMessage(hdPath, JSON.stringify(typedData), networkSlug);
  }

  exportPublicKey(_path: string): string {
    // Using this to export device data
    const { connectId, deviceId } = this;
    return JSON.stringify({ connectId, deviceId });
  }

  verifyMessage(_hdPath: string, _text: string, _sig: string): boolean {
    throw new Error("Not supported!");
  }

  exportAccount(_hdPath: string, _networkSlug: NetworkSlug): string {
    throw new Error("Not supported!");
  }

  signPsbt(_psbt: Psbt, _inputs: ToSignInput[]) {
    throw new Error("Not supported!");
  }

  signAllInputsInPsbt(_psbt: Psbt, _hdPath: string): { signatures: string[] } {
    throw new Error("Not supported!");
  }

  signInputsWithoutFinalizing(
    _psbt: Psbt,
    _inputs: ToSignInput[]
  ): {
    inputIndex: number;
    partialSig: { pubkey: Buffer; signature: Buffer }[];
  }[] {
    throw new Error("Not supported!");
  }

  signRecoverable(_hdPath: string, _message: string): string {
    throw new Error("Not supported!");
  }

  signMessage(
    _hdPath: string,
    _text: string,
    _networkSlug: NetworkSlug
  ): string {
    throw new Error("Not supported!");
  }

  signPersonalMessage(
    _path: string,
    _messageHex: Hex,
    _networkSlug: NetworkSlug
  ): string {
    throw new Error("Not supported!");
  }

  serialize() {
    return {
      connectId: this.connectId,
      deviceId: this.deviceId,
    };
  }

  static deserialize(opts: SerializedHDOneKey) {
    if (!opts.connectId || !opts.deviceId) {
      throw new Error(
        "HDOneKey: Deserialize method cannot be called with an opts value"
      );
    }

    const hdOnekey = new HDOneKey({
      connectId: opts.connectId,
      deviceId: opts.deviceId,
    });

    return hdOnekey;
  }

  deserialize(state: SerializedHDOneKey) {
    return HDOneKey.deserialize(state);
  }

  isSimpleKey() {
    return false;
  }

  isNetworkBaseHdPath() {
    return true;
  }
}

export default HDOneKey;
