import * as ecc from "@bitcoinerlab/secp256k1";
import * as bitcoinjs from "bitcoinjs-lib";
import { networks, Psbt } from "bitcoinjs-lib";
import {
  OrdTransaction,
  UnspentOutput,
  UnspentOutputBase,
} from "./OrdTransaction.js";
import { UTXO_DUST } from "./OrdUnspendOutput.js";
import type {
  CreateMultiSendOrd,
  CreateSendCoin,
  CreateSendOrd,
} from "./types.js";
import { calculateFee, satoshisToAmount } from "./utils.js";

export async function createSendBtc({
  utxos,
  toAddress,
  toAmount,
  signTransaction,
  network,
  changeAddress,
  receiverToPayFee,
  feeRate,
  pubkey,
  calculateFee,
  enableRBF = true,
}: CreateSendCoin) {
  bitcoinjs.initEccLib(ecc);
  const tx = new OrdTransaction({
    signTransaction,
    network,
    pubkey,
    feeRate,
    calculateFee,
  });
  tx.setEnableRBF(enableRBF);
  tx.setChangeAddress(changeAddress);

  const nonOrdUtxos: UnspentOutput[] = [];
  const ordUtxos: UnspentOutput[] = [];
  utxos.forEach((v) => {
    if (v.ords.length > 0) {
      ordUtxos.push(v);
    } else {
      nonOrdUtxos.push(v);
    }
  });

  tx.addOutput(toAddress, toAmount);

  const outputAmount = tx.getTotalOutput();

  let tmpSum = tx.getTotalInput();
  // TODO: use bitcoinselect
  for (let i = 0; i < nonOrdUtxos.length; i++) {
    const nonOrdUtxo = nonOrdUtxos[i];
    if (tmpSum < outputAmount) {
      tx.addInput(nonOrdUtxo);
      tmpSum += nonOrdUtxo.satoshis;
      continue;
    }

    const fee = await tx.calNetworkFee();
    if (tmpSum < outputAmount + fee) {
      tx.addInput(nonOrdUtxo);
      tmpSum += nonOrdUtxo.satoshis;
    } else {
      break;
    }
  }

  if (nonOrdUtxos.length === 0) {
    throw new Error("Balance not enough");
  }

  if (receiverToPayFee) {
    const unspent = tx.getUnspent();
    if (unspent >= UTXO_DUST) {
      tx.addChangeOutput(unspent);
    }

    const networkFee = await tx.calNetworkFee();
    const output = tx.outputs.find((v) => v.address === toAddress);
    if (output.value < networkFee) {
      throw new Error(
        `Balance not enough. Need ${satoshisToAmount(
          networkFee
        )} BTC as network fee`
      );
    }
    output.value -= networkFee;
  } else {
    const unspent = tx.getUnspent();
    if (unspent <= 0) {
      throw new Error("Balance not enough to pay network fee.");
    }

    // add dummy output
    tx.addChangeOutput(1);

    const networkFee = await tx.calNetworkFee();
    if (unspent < networkFee) {
      throw new Error(
        `Balance not enough. Need ${satoshisToAmount(
          networkFee
        )} as network fee, but only ${satoshisToAmount(unspent)}.`
      );
    }

    const leftAmount = unspent - networkFee;
    if (leftAmount >= UTXO_DUST) {
      // change dummy output to true output
      tx.getChangeOutput().value = leftAmount;
    } else {
      // remove dummy output
      tx.removeChangeOutput();
    }
  }

  const psbt = await tx.createSignedPsbt();

  return psbt;
}

export async function createSendOrd({
  utxos,
  toAddress,
  network,
  changeAddress,
  pubkey,
  feeRate,
  outputValue,
  signTransaction,
  calculateFee,
  enableRBF = true,
}: CreateSendOrd) {
  const tx = new OrdTransaction({
    network,
    pubkey,
    signTransaction,
    calculateFee,
    feeRate,
  });
  tx.setEnableRBF(enableRBF);
  tx.setChangeAddress(changeAddress);

  const nonOrdUtxos: UnspentOutput[] = [];
  const ordUtxos: UnspentOutput[] = [];
  utxos.forEach((v) => {
    if (v.ords.length > 0) {
      ordUtxos.push(v);
    } else {
      nonOrdUtxos.push(v);
    }
  });

  // find NFT
  let found = false;

  for (let i = 0; i < ordUtxos.length; i++) {
    const ordUtxo = ordUtxos[i];
    if (ordUtxo.ords.length > 1) {
      throw new Error("Multiple inscriptions! Please split them first.");
    }
    tx.addInput(ordUtxo);
    tx.addOutput(toAddress, ordUtxo.satoshis);
    found = true;
  }

  if (!found) {
    throw new Error("inscription not found.");
  }

  // format NFT
  tx.outputs[0].value = outputValue;

  // select non ord utxo
  const outputAmount = tx.getTotalOutput();
  let tmpSum = tx.getTotalInput();
  for (let i = 0; i < nonOrdUtxos.length; i++) {
    const nonOrdUtxo = nonOrdUtxos[i];
    if (tmpSum < outputAmount) {
      tx.addInput(nonOrdUtxo);
      tmpSum += nonOrdUtxo.satoshis;
      continue;
    }

    const fee = await tx.calNetworkFee();
    if (tmpSum < outputAmount + fee) {
      tx.addInput(nonOrdUtxo);
      tmpSum += nonOrdUtxo.satoshis;
    } else {
      break;
    }
  }

  const unspent = tx.getUnspent();
  if (unspent <= 0) {
    throw new Error("Balance not enough to pay network fee.");
  }

  // add dummy output
  tx.addChangeOutput(1);

  const networkFee = await tx.calNetworkFee();
  if (unspent < networkFee) {
    throw new Error(
      `Balance not enough. Need ${satoshisToAmount(
        networkFee
      )} as network fee, but only ${satoshisToAmount(unspent)}`
    );
  }

  const leftAmount = unspent - networkFee;
  if (leftAmount >= UTXO_DUST) {
    // change dummy output to true output
    tx.getChangeOutput().value = leftAmount;
  } else {
    // remove dummy output
    tx.removeChangeOutput();
  }

  const psbt = await tx.createSignedPsbt();
  return psbt;
}

export async function createMultisendOrd({
  utxos,
  toAddress,
  signPsbtHex,
  network = networks.bitcoin,
  changeAddress,
  feeRate,
}: CreateMultiSendOrd) {
  let tx = new Psbt({ network });
  tx.setVersion(1);

  const nonOrdUtxos: UnspentOutputBase[] = [];
  const ordUtxos: UnspentOutputBase[] = [];
  utxos.forEach((v) => {
    if (v.ords.length > 0) {
      ordUtxos.push(v);
    } else {
      nonOrdUtxos.push(v);
    }
  });

  for (let i = 0; i < ordUtxos.length; i++) {
    const ordUtxo = ordUtxos[i];
    if (ordUtxo.ords.length > 1) {
      throw new Error("Multiple inscriptions! Please split them first.");
    }
    tx.addInput({
      hash: ordUtxo.txId,
      index: ordUtxo.outputIndex,
      nonWitnessUtxo: Buffer.from(ordUtxo.rawHex!, "hex"),
    });
    tx.addOutput({ address: toAddress, value: ordUtxo.satoshis });
  }

  let amount = 0;
  for (let i = 0; i < nonOrdUtxos.length; i++) {
    const nonOrdUtxo = nonOrdUtxos[i];
    amount += nonOrdUtxo.satoshis;
    tx.addInput({
      hash: nonOrdUtxo.txId,
      index: nonOrdUtxo.outputIndex,
      nonWitnessUtxo: Buffer.from(nonOrdUtxo.rawHex!, "hex"),
    });
  }

  const fee = await calculateFee(
    tx.clone(),
    feeRate,
    changeAddress,
    signPsbtHex
  );
  const change = amount - fee;
  if (change < 0) {
    throw new Error("Balance not enough to pay network fee.");
  }
  tx.addOutput({ address: changeAddress, value: change });
  tx = Psbt.fromHex(await signPsbtHex(tx.toHex()));
  tx.finalizeAllInputs();
  return tx.extractTransaction(true).toHex();
}
