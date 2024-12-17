import type {
  Hex,
  SendBtcCoin,
  SendCkbCoin,
} from "@/background/services/keyring/types";
import { ApiUTXO } from "@/shared/interfaces/api";
import {
  isBitcoinNetwork,
  isCkbNetwork,
  isDogecoinNetwork,
} from "@/shared/networks";
import {
  ckbMinTransfer,
  getScriptForAddress,
  tidoshisToAmount,
} from "@/shared/utils/transactions";
import { BI, Cell, commons, helpers } from "@ckb-lumos/lumos";
import { Network, Psbt } from "bitcoinjs-lib";
import { t } from "i18next";
import { useCallback } from "react";
import toast from "react-hot-toast";
import { useControllersState } from "../states/controllerState";
import {
  useGetCurrentAccount,
  useGetCurrentNetwork,
  useWalletState,
} from "../states/walletState";
import { CKBTokenInfo } from "@/shared/networks/ckb/types";
import { formatNumber } from "@/shared/utils";
import { createSendBtc } from "@/background/services/keyring/ord-utils";
import { HDOneKeyOptions } from "@/background/services/keyring/ckbhdw/hd/types";
import { useOneKey } from "../components/onekey/hook";
import { MIN_CAPACITY, prepareWitnesses } from "@/shared/networks/ckb/helpers";
import { NetworkConfig } from "@/shared/networks/ckb/offckb.config";
import {
  bytesToHex,
  serializeRawTransaction,
} from "@nervosnetwork/ckb-sdk-utils";
import { blockchain } from "@ckb-lumos/base";

export function useCreateOnekeyTxCallback() {
  const onekeySdk = useOneKey();
  const currentAccount = useGetCurrentAccount();
  const currentNetwork = useGetCurrentNetwork();
  const { selectedAccount, selectedWallet } = useWalletState((v) => ({
    selectedAccount: v.selectedAccount,
    selectedWallet: v.selectedWallet,
  }));
  const { apiController } = useControllersState((v) => ({
    apiController: v.apiController,
  }));
  const { network, slug } = useGetCurrentNetwork();
  const { keyringController } = useControllersState((v) => ({
    keyringController: v.keyringController,
  }));

  const _signPsbt = useCallback(async (psbt: Psbt): Promise<void> => {
    const { connectId, deviceId }: HDOneKeyOptions = JSON.parse(
      await keyringController.exportPublicKey("")
    );

    // TODO: fix - Failure_DataError,invalid psbt, taproot path is missing
    const signPsbtRes = await onekeySdk.btcSignPsbt(connectId, deviceId, {
      psbt: psbt.toHex(),
      coin: slug === "btc" ? "BTC" : "TEST",
    });

    if (signPsbtRes.success) {
      psbt = Psbt.fromHex(signPsbtRes.payload.psbt);
    } else {
      throw Error("sign psbt failed");
    }
  }, []);

  const _sendBtcCoin = useCallback(
    async (data: SendBtcCoin): Promise<string> => {
      const utxos = data.utxos.map((v) => {
        const _account = currentAccount.accounts.find(
          (acc) => acc.address === v.address
        );
        return {
          txId: v.txid,
          outputIndex: v.vout,
          satoshis: v.value,
          scriptPk: getScriptForAddress(
            new Uint8Array(Buffer.from(_account.publicKey, "hex")),
            _account.addressType.value,
            slug
          ).toString("hex"),
          addressType: _account.addressType.value,
          address: v.address,
          ords: [],
        };
      });

      const psbt = await createSendBtc({
        utxos,
        toAddress: data.to,
        toAmount: data.amount,
        signTransaction: _signPsbt,
        network: currentNetwork.network as Network,
        // default change address is first account in group account (usually legacy)
        changeAddress: currentAccount.accounts[0].address,
        receiverToPayFee: data.receiverToPayFee,
        pubkey: currentAccount.accounts[0].publicKey,
        feeRate: data.feeRate,
        enableRBF: false,
      });

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore We are really dont know what is it but we still copy working code
      psbt.__CACHE.__UNSAFE_SIGN_NONSEGWIT = false;
      return psbt.toHex();
    },
    [currentNetwork, currentAccount]
  );

  const _sendCkbCoin = useCallback(
    async (data: SendCkbCoin): Promise<string> => {
      const ckbAccount = currentAccount.accounts[0];
      // additional 0.001 ckb for tx fee
      // the tx fee could calculated by tx size
      // TODO: this is just a simple example
      const neededCapacity = BI.from(data.amount).add(100000);

      let txSkeleton = helpers.TransactionSkeleton({});
      const fromScript = helpers.parseAddress(ckbAccount.address, {
        config: (network as NetworkConfig).lumosConfig,
      });

      const toScript = helpers.parseAddress(data.to, {
        config: (network as NetworkConfig).lumosConfig,
      });

      const minCapacity = MIN_CAPACITY(toScript);
      let capacityChangeOutput = BI.from(0);

      // TODO: add smart selector
      const collected: Cell[] = [];
      let collectedSum = BI.from(0);
      for (const cell of (data as SendCkbCoin).cells) {
        if (!cell.cellOutput.type) {
          collectedSum = collectedSum.add(cell.cellOutput.capacity);
          collected.push(cell);
        }

        capacityChangeOutput = collectedSum.sub(neededCapacity);
        if (
          collectedSum.gte(neededCapacity) &&
          (capacityChangeOutput.eq(0) || capacityChangeOutput.gt(minCapacity))
        )
          break;
      }

      if (capacityChangeOutput.gt(0) && capacityChangeOutput.lt(minCapacity)) {
        throw new Error(
          `The remaining balance in your wallet must be greater than ${(
            minCapacity.toNumber() /
            10 ** 8
          ).toString()} CKB. Please adjust your transaction amount or add more CKB to proceed (${capacityChangeOutput})`
        );
      }

      const changeOutput: Cell = {
        cellOutput: {
          capacity: capacityChangeOutput.toHexString(),
          lock: fromScript,
        },
        data: "0x",
      };

      const transferOutput: Cell = {
        cellOutput: {
          capacity: BI.from(data.amount).toHexString(),
          lock: toScript,
        },
        data: "0x",
      };

      txSkeleton = txSkeleton.update("inputs", (inputs) =>
        inputs.push(...collected)
      );
      if (collectedSum.sub(neededCapacity).eq(BI.from(0))) {
        txSkeleton = txSkeleton.update("outputs", (outputs) =>
          outputs.push(transferOutput)
        );
      } else {
        txSkeleton = txSkeleton.update("outputs", (outputs) =>
          outputs.push(transferOutput, changeOutput)
        );
      }

      txSkeleton = txSkeleton.update("cellDeps", (cellDeps) =>
        cellDeps.push({
          outPoint: {
            txHash: ((network as NetworkConfig).lumosConfig.SCRIPTS as any)
              .SECP256K1_BLAKE160.TX_HASH,
            index: ((network as NetworkConfig).lumosConfig.SCRIPTS as any)
              .SECP256K1_BLAKE160.INDEX,
          },
          depType: ((network as NetworkConfig).lumosConfig.SCRIPTS as any)
            .SECP256K1_BLAKE160.DEP_TYPE,
        })
      );

      txSkeleton = prepareWitnesses(txSkeleton, fromScript);
      txSkeleton = commons.common.prepareSigningEntries(txSkeleton);

      const { connectId, deviceId }: HDOneKeyOptions = JSON.parse(
        await keyringController.exportPublicKey("")
      );
      const witnessHex = txSkeleton.witnesses.get(0);
      const dtx = helpers.createTransactionFromSkeleton(txSkeleton);
      const serialize = blockchain.RawTransaction.pack(dtx);
      const rawTx = bytesToHex(serialize);

      const signCkbRes = await onekeySdk.nervosSignTransaction(
        connectId,
        deviceId,
        {
          path: ckbAccount.hdPath,
          network: currentNetwork.slug === "nervos" ? "ckb" : "ckt",
          rawTx,
          witnessHex,
        }
      );

      if (signCkbRes.success) {
        const tx = helpers.sealTransaction(txSkeleton, [
          "0x" + signCkbRes.payload.signature,
        ]);
        return JSON.stringify(tx);
      } else {
        throw Error("sign ckb tx failed");
      }
    },
    [currentNetwork, currentAccount]
  );

  const ckbSendNativeCoin = async (
    toAddress: Hex,
    toAmount: number,
    feeRate: number,
    receiverToPayFee = false
  ) => {
    // Send CKB tx
    // CKB has only one address type - no need to use loop
    const fromAddress = currentAccount.accounts[0].address;
    const cells = await apiController.getCells(fromAddress);
    const safeBalance = (cells ?? []).reduce((pre, cur) => {
      return cur.cellOutput.type ? pre : pre.add(cur.cellOutput.capacity);
    }, BI.from(0));
    // additional 0.001 ckb for tx fee
    // the tx fee could calculated by tx size
    // TODO: this is just a simple example
    let ckbMinCapacity = ckbMinTransfer(toAddress, slug === "nervos_testnet");
    const fixedFee = 100000;
    let amount = toAmount;

    if (receiverToPayFee) {
      ckbMinCapacity += fixedFee / 10 ** 8;
      amount = toAmount - fixedFee;
    }

    const neededCapacity = BI.from(amount).add(fixedFee);

    if (safeBalance.lt(neededCapacity)) {
      throw new Error(
        `${t("hooks.transaction.insufficient_balance_0")} (${tidoshisToAmount(
          safeBalance.toNumber()
        )} ${t("hooks.transaction.insufficient_balance_1")} ${tidoshisToAmount(
          amount
        )} ${t("hooks.transaction.insufficient_balance_2")}`
      );
    } else if (BI.from(toAmount).lt(BI.from(ckbMinCapacity * 10 ** 8))) {
      // toast.error(`Must be at least ${_ckbMinTransfer} CKB`);
      // throw new Error(
      //   `every cell's capacity must be at least ${_ckbMinTransfer} CKB, see https://medium.com/nervosnetwork/understanding-the-nervos-dao-and-cell-model-d68f38272c24`
      // );
      throw new Error(
        `Must be at least ${formatNumber(ckbMinCapacity, 2, 8)} CKB`
      );
    }

    const tx = await _sendCkbCoin({
      to: toAddress,
      amount: amount,
      cells,
      receiverToPayFee,
      feeRate,
    });

    return {
      rawtx: tx,
      fee: fixedFee,
      fromAddresses: [fromAddress],
    };
  };

  const ckbSendToken = async (
    toAddress: Hex,
    toAmount: number,
    token: CKBTokenInfo,
    feeRate: number
  ) => {
    const fromAddress = currentAccount.accounts[0].address;
    const { tx, fee } = await keyringController.sendToken({
      to: toAddress,
      amount: toAmount,
      feeRate,
      token,
      receiverToPayFee: false,
    });
    return {
      rawtx: tx,
      fee: fee,
      fromAddresses: [fromAddress],
    };
  };

  return useCallback(
    async (
      toAddress: Hex,
      toAmount: number,
      feeRate: number,
      receiverToPayFee = false,
      token?: CKBTokenInfo
    ) => {
      if (selectedWallet === undefined || selectedAccount === undefined)
        throw new Error("Failed to get current wallet or account");

      if (isBitcoinNetwork(network) || isDogecoinNetwork(network)) {
        // Send BTC tx
        const totalUtxos: ApiUTXO[] = [];
        for (const account of currentAccount.accounts) {
          const utxos = await apiController.getUtxos(account.address);
          // Filter utxo contains runes or ordinals
          if (isBitcoinNetwork(network)) {
            const outpointOrds = (
              await apiController.getOrdUtxos(account.address)
            ).map((oo) => `${oo.outpoint}`);
            const nonOrdUtxo = utxos.filter(
              (utxo) => !outpointOrds.includes(`${utxo.txid}:${utxo.vout}`)
            );

            totalUtxos.push(...nonOrdUtxo);
          } else {
            totalUtxos.push(...utxos);
          }
        }
        const safeBalance = (totalUtxos ?? []).reduce(
          (pre, cur) => pre + cur.value,
          0
        );
        if (safeBalance < toAmount) {
          throw new Error(
            `${t(
              "hooks.transaction.insufficient_balance_0"
            )} (${tidoshisToAmount(safeBalance)} ${t(
              "hooks.transaction.insufficient_balance_1"
            )} ${tidoshisToAmount(toAmount)} ${t(
              "hooks.transaction.insufficient_balance_2"
            )}`
          );
        }
        const psbtHex = await _sendBtcCoin({
          to: toAddress,
          amount: toAmount,
          utxos: totalUtxos,
          receiverToPayFee,
          feeRate,
        });
        const psbt = Psbt.fromHex(psbtHex);
        const tx = psbt.extractTransaction(true);
        const rawtx = tx.toHex();
        return {
          rawtx,
          fee: psbt.getFee(),
          fromAddresses: psbt.txInputs.map((input) => {
            const selectedUtxo = totalUtxos.find(
              (utxo) =>
                utxo.txid === input.hash.reverse().toString("hex") &&
                utxo.vout === input.index
            );
            return selectedUtxo.address;
          }),
        };
      } else if (isCkbNetwork(network)) {
        return token
          ? await ckbSendToken(toAddress, toAmount, token, 3600)
          : await ckbSendNativeCoin(
              toAddress,
              toAmount,
              feeRate,
              receiverToPayFee
            );
      } else {
        toast.error("Invalid network");
      }
    },
    [apiController, currentAccount, selectedAccount, selectedWallet]
  );
}
