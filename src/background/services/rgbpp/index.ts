import {
  addAddressToPubkeyMap,
  bitcoin,
  ErrorCodes,
  InitOutput,
  limitPromiseBatchSize,
  NetworkType,
  networkTypeToConfig,
  prepareUtxoInputs,
  SendUtxosProps,
  TxBuilder,
  TxBuildError,
  Utxo,
} from "@rgbpp-sdk/btc";
import {
  calculateCommitment,
  checkCkbTxInputsCapacitySufficient,
  genBtcTransferCkbVirtualTx,
  getXudtTypeScript,
  isBtcTimeLockCell,
  isRgbppLockCell,
  serializeScript,
  unpackRgbppLockArgs,
} from "@rgbpp-sdk/ckb";
import {
  RgbppTransferTxParams,
  RgbppTransferTxResult,
  SendRgbppUtxosProps,
} from "rgbpp";

async function createSendUtxosBuilder(props: SendUtxosProps): Promise<{
  builder: TxBuilder;
  fee: number;
  feeRate: number;
  changeIndex: number;
}> {
  const tx = new TxBuilder({
    source: props.source,
    feeRate: props.feeRate,
    minUtxoSatoshi: props.minUtxoSatoshi,
    onlyConfirmedUtxos: props.onlyConfirmedUtxos,
  });

  try {
    // Prepare the UTXO inputs:
    // 1. Fill pubkey for each P2TR UTXO, and throw if the corresponding pubkey is not found
    // 2. Throw if unconfirmed UTXOs are found (if onlyConfirmedUtxos == true && skipInputsValidation == false)
    const pubkeyMap = addAddressToPubkeyMap(
      props.pubkeyMap ?? {},
      props.from,
      props.fromPubkey
    );
    const inputs = await prepareUtxoInputs({
      utxos: props.inputs,
      source: props.source,
      requireConfirmed: props.onlyConfirmedUtxos && !props.skipInputsValidation,
      requirePubkey: true,
      pubkeyMap,
    });

    tx.addInputs(inputs);
    tx.addOutputs(props.outputs);

    const paid = await tx.payFee({
      address: props.from,
      publicKey: pubkeyMap[props.from],
      changeAddress: props.changeAddress,
      excludeUtxos: props.excludeUtxos,
    });

    return {
      builder: tx,
      fee: paid.fee,
      feeRate: paid.feeRate,
      changeIndex: paid.changeIndex,
    };
  } catch (e) {
    // When caught TxBuildError, add TxBuilder as the context
    if (e instanceof TxBuildError) {
      e.setContext({ tx });
    }

    throw e;
  }
}

async function getMergedBtcOutputs(
  btcOutputs: InitOutput[],
  props: SendRgbppUtxosProps
): Promise<InitOutput[]> {
  const merged: InitOutput[] = [];

  // Add commitment to the beginning of outputs
  merged.push({
    data: props.commitment,
    fixed: true,
    value: 0,
  });

  // Add outputs
  merged.push(...btcOutputs);

  // Check paymaster info
  const defaultPaymaster = await props.source.getPaymasterOutput();
  const isPaymasterUnmatched =
    defaultPaymaster?.address !== props.paymaster?.address ||
    defaultPaymaster?.value !== props.paymaster?.value;
  if (defaultPaymaster && props.paymaster && isPaymasterUnmatched) {
    throw TxBuildError.withComment(
      ErrorCodes.PAYMASTER_MISMATCH,
      `expected: ${defaultPaymaster}, actual: ${props.paymaster}`
    );
  }

  // Add paymaster output, only if paymaster address exists and needed
  const paymaster = defaultPaymaster ?? props.paymaster;
  const isNeedPaymasterOutput = await (async () => {
    if (props.needPaymaster !== undefined) {
      return props.needPaymaster;
    }
    const isInputsSufficient = await checkCkbTxInputsCapacitySufficient(
      props.ckbVirtualTx,
      props.ckbCollector
    );
    return !isInputsSufficient;
  })();
  if (paymaster && isNeedPaymasterOutput) {
    merged.push({
      ...paymaster,
      fixed: true,
    });
  }

  return merged;
}

async function createSendRgbppUtxosBuilder(
  props: SendRgbppUtxosProps
): Promise<{
  builder: TxBuilder;
  fee: number;
  feeRate: number;
  changeIndex: number;
}> {
  const btcInputs: Utxo[] = [];
  const btcOutputs: InitOutput[] = [];
  let lastCkbTypeOutputIndex = -1;

  const ckbVirtualTx = props.ckbVirtualTx;
  const config = networkTypeToConfig(props.source.networkType);
  const isCkbMainnet = props.source.networkType === NetworkType.MAINNET;

  const rgbppLockArgsList = (
    await props.ckbCollector.getLiveCells(
      ckbVirtualTx.inputs.map((input) => input.previousOutput!)
    )
  ).map((cell) =>
    isRgbppLockCell(cell.output, isCkbMainnet)
      ? unpackRgbppLockArgs(cell.output.lock.args)
      : undefined
  );

  // Batch querying UTXO from BtcAssetsApi
  const btcUtxos = await Promise.all(
    rgbppLockArgsList.map((rgbppLockArgs) => {
      if (rgbppLockArgs) {
        return limitPromiseBatchSize(() =>
          props.source.getUtxo(
            rgbppLockArgs.btcTxId,
            rgbppLockArgs.outIndex,
            props.onlyConfirmedUtxos
          )
        );
      }
      return undefined;
    })
  );

  // Handle and check inputs
  for (let i = 0; i < ckbVirtualTx.inputs.length; i++) {
    const rgbppLockArgs = rgbppLockArgsList[i];

    // Add to inputs if all the following conditions are met:
    // 1. input.lock.args can be unpacked to RgbppLockArgs
    // 2. utxo can be found via the DataSource.getUtxo() API
    // 3. utxo is not duplicated in the inputs
    if (rgbppLockArgs) {
      const utxo = btcUtxos[i];
      if (!utxo) {
        throw TxBuildError.withComment(
          ErrorCodes.CANNOT_FIND_UTXO,
          `hash: ${rgbppLockArgs.btcTxId}, index: ${rgbppLockArgs.outIndex}`
        );
      }

      const foundInInputs = btcInputs.some(
        (v) => v.txid === utxo.txid && v.vout === utxo.vout
      );
      if (!foundInInputs) {
        btcInputs.push(utxo);
      }
    }
  }

  // The inputs.length should be >= 1
  if (btcInputs.length < 1) {
    throw new TxBuildError(ErrorCodes.CKB_INVALID_INPUTS);
  }

  // Handle and check outputs
  for (let i = 0; i < ckbVirtualTx.outputs.length; i++) {
    const ckbOutput = ckbVirtualTx.outputs[i];
    const isRgbppLock = isRgbppLockCell(ckbOutput, isCkbMainnet);
    const isBtcTimeLock = isBtcTimeLockCell(ckbOutput, isCkbMainnet);

    // If output.type !== null, then the output.lock must be RgbppLock or RgbppTimeLock
    if (ckbOutput.type) {
      if (!isRgbppLock && !isBtcTimeLock) {
        throw new TxBuildError(ErrorCodes.CKB_INVALID_CELL_LOCK);
      }

      // If output.type !== null，update lastTypeInput
      lastCkbTypeOutputIndex = i;
    }

    // If output.lock == RgbppLock, generate a corresponding output in outputs
    if (isRgbppLock) {
      const toBtcAddress = props.tos?.[i];
      const minUtxoSatoshi =
        props.rgbppMinUtxoSatoshi ?? config.rgbppUtxoDustLimit;
      btcOutputs.push({
        fixed: true,
        address: toBtcAddress ?? props.from,
        value: minUtxoSatoshi,
        minUtxoSatoshi,
      });
    }
  }

  // By rules, the length of type outputs should be >= 1
  // The "lastTypeOutputIndex" is -1 by default so if (index < 0) it's invalid
  if (lastCkbTypeOutputIndex < 0) {
    throw new TxBuildError(ErrorCodes.CKB_INVALID_OUTPUTS);
  }

  // Verify the provided commitment
  const calculatedCommitment = calculateCommitment({
    inputs: ckbVirtualTx.inputs,
    outputs: ckbVirtualTx.outputs.slice(0, lastCkbTypeOutputIndex + 1),
    outputsData: ckbVirtualTx.outputsData.slice(0, lastCkbTypeOutputIndex + 1),
  });
  if (props.commitment !== calculatedCommitment) {
    throw new TxBuildError(ErrorCodes.CKB_UNMATCHED_COMMITMENT);
  }

  const mergedBtcOutputs = await getMergedBtcOutputs(btcOutputs, props);

  return await createSendUtxosBuilder({
    inputs: btcInputs,
    outputs: mergedBtcOutputs,
    from: props.from,
    source: props.source,
    feeRate: props.feeRate,
    fromPubkey: props.fromPubkey,
    changeAddress: props.changeAddress,
    minUtxoSatoshi: props.minUtxoSatoshi,
    onlyConfirmedUtxos: props.onlyConfirmedUtxos,
    excludeUtxos: props.excludeUtxos,
    pubkeyMap: props.pubkeyMap,
  });
}

async function sendRgbppUtxos(
  props: SendRgbppUtxosProps
): Promise<bitcoin.Psbt> {
  const { builder } = await createSendRgbppUtxosBuilder(props);
  return builder.toPsbt();
}

export const buildRgbppTransferTx = async ({
  ckb: {
    collector,
    xudtTypeArgs,
    rgbppLockArgsList,
    transferAmount,
    feeRate: ckbFeeRate,
  },
  btc,
  isMainnet,
}: RgbppTransferTxParams): Promise<RgbppTransferTxResult> => {
  const xudtType: CKBComponents.Script = {
    ...getXudtTypeScript(isMainnet),
    args: xudtTypeArgs,
  };

  const ckbVirtualTxResult = await genBtcTransferCkbVirtualTx({
    collector,
    rgbppLockArgsList,
    xudtTypeBytes: serializeScript(xudtType),
    transferAmount,
    isMainnet,
    ckbFeeRate,
    btcTestnetType: btc.testnetType,
  });

  const { commitment, ckbRawTx } = ckbVirtualTxResult;

  // Send BTC tx
  const psbt = await sendRgbppUtxos({
    ckbVirtualTx: ckbRawTx,
    commitment,
    tos: [btc.toAddress],
    ckbCollector: collector,
    from: btc.fromAddress!,
    fromPubkey: btc.fromPubkey,
    source: btc.dataSource,
    feeRate: btc.feeRate,
  });

  return {
    ckbVirtualTxResult,
    btcPsbtHex: psbt.toHex(),
  };
};
