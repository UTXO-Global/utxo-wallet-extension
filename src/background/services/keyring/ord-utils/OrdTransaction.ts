import type { Network } from "bitcoinjs-lib";
import { networks, payments, Psbt } from "bitcoinjs-lib";
import { UTXO_DUST } from "./OrdUnspendOutput.js";
import type { CreateSendCoin } from "./types.js";

interface TxInput {
  data: {
    hash: string;
    index: number;
    witnessUtxo: { value: number; script: Buffer };
    redeemScript?: Buffer;
  };
  utxo: UnspentOutput;
}

interface TxOutput {
  address: string;
  value: number;
}

export interface UnspentOutputBase {
  txId: string;
  outputIndex: number;
  satoshis: number;
  ords: {
    id: string;
    offset: number;
  }[];
  rawHex?: string;
}

export interface UnspentOutput extends UnspentOutputBase {
  scriptPk: string;
  addressType: AddressType;
  address: string;
}
export enum AddressType {
  P2PKH = 0,
  P2WPKH = 1,
  P2TR = 2,
  P2SH_P2WPKH = 3,
  M44_P2WPKH = 4,
  M44_P2TR = 5,
  CKB_ADDRESS = 6,
}

export const toXOnly = (pubKey: Buffer) =>
  pubKey.length === 32 ? pubKey : pubKey.slice(1, 33);

export function utxoToInput(utxo: UnspentOutput, publicKey: Buffer): TxInput {
  if (utxo.addressType === AddressType.P2SH_P2WPKH) {
    const redeemData = payments.p2wpkh({ pubkey: publicKey });
    const data: TxInput["data"] = {
      hash: utxo.txId,
      index: utxo.outputIndex,
      witnessUtxo: {
        value: utxo.satoshis,
        script: Buffer.from(utxo.scriptPk, "hex"),
      },
      redeemScript: redeemData.output,
    };
    return {
      data,
      utxo,
    };
  } else {
    const data: TxInput["data"] = {
      hash: utxo.txId,
      index: utxo.outputIndex,
      witnessUtxo: {
        value: utxo.satoshis,
        script: Buffer.from(utxo.scriptPk, "hex"),
      },
    };
    return {
      data,
      utxo,
    };
  }
}

export class OrdTransaction {
  private inputs: TxInput[] = [];
  public outputs: TxOutput[] = [];
  private changeOutputIndex = -1;
  private signTransaction: CreateSendCoin["signTransaction"];
  private calculateFee?: CreateSendCoin["calculateFee"];
  public changedAddress: string;
  private network: Network = networks.bitcoin;
  private feeRate: number;
  private pubkey: string;
  private enableRBF = true;
  constructor({
    network,
    pubkey,
    signTransaction,
    calculateFee,
    feeRate,
  }: Pick<
    CreateSendCoin,
    "signTransaction" | "network" | "pubkey" | "feeRate" | "calculateFee"
  >) {
    this.signTransaction = signTransaction;
    this.calculateFee = calculateFee;
    this.network = network;
    this.pubkey = pubkey;
    this.feeRate = feeRate || 5;
  }

  setEnableRBF(enable: boolean) {
    this.enableRBF = enable;
  }

  setChangeAddress(address: string) {
    this.changedAddress = address;
  }

  addInput(utxo: UnspentOutput) {
    this.inputs.push(utxoToInput(utxo, Buffer.from(this.pubkey, "hex")));
  }

  getTotalInput() {
    return this.inputs.reduce(
      (pre, cur) => pre + cur.data.witnessUtxo.value,
      0
    );
  }

  getTotalOutput() {
    return this.outputs.reduce((pre, cur) => pre + cur.value, 0);
  }

  getUnspent() {
    return this.getTotalInput() - this.getTotalOutput();
  }

  async isEnoughFee() {
    const psbt1 = await this.createSignedPsbt();
    if (psbt1.getFeeRate() >= this.feeRate) {
      return true;
    } else {
      return false;
    }
  }

  async calNetworkFee() {
    if (this.calculateFee) {
      const psbt = await this.createSignedPsbt(true);
      (psbt as any).__CACHE.__UNSAFE_SIGN_NONSEGWIT = false;
      return await this.calculateFee(psbt.toHex(), this.feeRate);
    }
    const psbt = await this.createSignedPsbt();
    let txSize = psbt.extractTransaction(true).toBuffer().length;
    psbt.data.inputs.forEach((v) => {
      if (v.finalScriptWitness) {
        txSize -= v.finalScriptWitness.length * 0.75;
      }
    });
    const fee = Math.ceil(txSize * this.feeRate);
    return fee;
  }

  addOutput(address: string, value: number) {
    this.outputs.push({
      address,
      value,
    });
  }

  getOutput(index: number) {
    return this.outputs[index];
  }

  addChangeOutput(value: number) {
    this.outputs.push({
      address: this.changedAddress,
      value,
    });
    this.changeOutputIndex = this.outputs.length - 1;
  }

  getChangeOutput() {
    return this.outputs[this.changeOutputIndex];
  }

  getChangeAmount() {
    const output = this.getChangeOutput();
    return output ? output.value : 0;
  }

  removeChangeOutput() {
    this.outputs.splice(this.changeOutputIndex, 1);
    this.changeOutputIndex = -1;
  }

  removeRecentOutputs(count: number) {
    this.outputs.splice(-count);
  }

  async createSignedPsbt(skipSign = false) {
    const psbt = new Psbt({ network: this.network });

    psbt.setVersion(1);
    this.inputs.forEach((v, index) => {
      if (v.utxo.addressType === AddressType.P2PKH) {
        // @ts-expect-error - unsafe with p2pkh
        psbt.__CACHE.__UNSAFE_SIGN_NONSEGWIT = true;
      }
      psbt.addInput(v.data);
      if (this.enableRBF) {
        psbt.setInputSequence(index, 0xfffffffd); // support RBF
      }
    });

    this.outputs.forEach((v) => {
      psbt.addOutput(v);
    });

    if (!skipSign)
      await this.signTransaction(
        psbt,
        this.inputs.map((z, i) => ({
          address: z.utxo.address,
          index: i,
          sighashTypes: undefined,
        }))
      );

    return psbt;
  }

  async generate(autoAdjust: boolean) {
    // Try to estimate fee
    const unspent = this.getUnspent();
    this.addChangeOutput(Math.max(unspent, 0));
    const psbt1 = await this.createSignedPsbt();
    // this.dumpTx(psbt1);
    this.removeChangeOutput();

    // todo: support changing the feeRate
    const txSize = psbt1.extractTransaction(true).toBuffer().length;
    const fee = txSize * this.feeRate;

    if (unspent > fee) {
      const left = unspent - fee;
      if (left > UTXO_DUST) {
        this.addChangeOutput(left);
      }
    } else {
      if (autoAdjust) {
        this.outputs[0].value -= fee - unspent;
      }
    }
    const psbt2 = await this.createSignedPsbt();
    const tx = psbt2.extractTransaction(true);

    const rawtx = tx.toHex();
    const toAmount = this.outputs[0].value;
    return {
      fee: psbt2.getFee(),
      rawtx,
      toSatoshis: toAmount,
      estimateFee: fee,
    };
  }
}
