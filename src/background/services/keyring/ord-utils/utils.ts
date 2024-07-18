import { Psbt } from "bitcoinjs-lib";
import BN from "bn.js";

export function satoshisToAmount(val: number) {
  const num = new BN(val);
  return num.div(new BN(100000000)).toString(10);
}

export function amountToSaothis(val: any) {
  const num = new BN(val);
  return num.mul(new BN(100000000)).toNumber();
}

export const calculateFee = async (
  psbt: Psbt,
  feeRate: number,
  address: string,
  signPsbtHex: (psbtHex: string) => Promise<string>
): Promise<number> => {
  psbt.addOutput({ address, value: 0 });
  psbt = Psbt.fromHex(await signPsbtHex(psbt.toHex()));
  psbt.finalizeAllInputs();
  const txSize = psbt.extractTransaction(true).toBuffer().length;
  const fee = Math.ceil(txSize * feeRate);
  return fee;
};
