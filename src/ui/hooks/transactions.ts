import type { Hex, TransferNFT } from "@/background/services/keyring/types";
import { ApiUTXO } from "@/shared/interfaces/api";
import { Inscription } from "@/shared/interfaces/inscriptions";
import { ITransfer } from "@/shared/interfaces/token";
import { isBitcoinNetwork, isCkbNetwork } from "@/shared/networks";
import { tidoshisToAmount } from "@/shared/utils/transactions";
import { BI } from "@ckb-lumos/lumos";
import { Psbt } from "bitcoinjs-lib";
import { t } from "i18next";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useControllersState } from "../states/controllerState";
import {
  useGetCurrentAccount,
  useGetCurrentNetwork,
  useWalletState,
} from "../states/walletState";
import { CKBTokenInfo } from "@/shared/networks/ckb/types";
import { ckbExplorerApi } from "../utils/helpers";

export function useCreateTxCallback() {
  const currentAccount = useGetCurrentAccount();
  const { selectedAccount, selectedWallet } = useWalletState((v) => ({
    selectedAccount: v.selectedAccount,
    selectedWallet: v.selectedWallet,
  }));
  const { apiController, keyringController } = useControllersState((v) => ({
    apiController: v.apiController,
    keyringController: v.keyringController,
  }));
  const { network } = useGetCurrentNetwork();

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
    const fixedFee = 100000;
    const _toAmount = receiverToPayFee ? toAmount - fixedFee : toAmount;
    const neededCapacity = BI.from(_toAmount).add(fixedFee);

    if (safeBalance.lt(neededCapacity)) {
      throw new Error(
        `${t("hooks.transaction.insufficient_balance_0")} (${tidoshisToAmount(
          safeBalance.toNumber()
        )} ${t("hooks.transaction.insufficient_balance_1")} ${tidoshisToAmount(
          _toAmount
        )} ${t("hooks.transaction.insufficient_balance_2")}`
      );
    } else if (BI.from(_toAmount).lt(BI.from("6100000000"))) {
      toast.error("Must be at least 61 CKB");
      throw new Error(
        `every cell's capacity must be at least 61 CKB, see https://medium.com/nervosnetwork/understanding-the-nervos-dao-and-cell-model-d68f38272c24`
      );
    }

    const tx = await keyringController.sendCoin({
      to: toAddress,
      amount: _toAmount,
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

      if (isBitcoinNetwork(network)) {
        // Send BTC tx
        const totalUtxos: ApiUTXO[] = [];
        for (const account of currentAccount.accounts) {
          const utxos = await apiController.getUtxos(account.address);
          // Filter utxo contains runes or ordinals
          const outpointOrds = (
            await apiController.getOrdUtxos(account.address)
          ).map((oo) => `${oo.outpoint}`);
          const nonOrdUtxo = utxos.filter(
            (utxo) => !outpointOrds.includes(`${utxo.txid}:${utxo.vout}`)
          );

          totalUtxos.push(...nonOrdUtxo);
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
        const psbtHex = await keyringController.sendCoin({
          to: toAddress,
          amount: toAmount,
          utxos: totalUtxos,
          receiverToPayFee,
          feeRate,
        });
        const psbt = Psbt.fromHex(psbtHex);
        const tx = psbt.extractTransaction();
        const rawtx = tx.toHex();
        return {
          rawtx,
          fee: psbt.getFee(),
          fromAddresses: psbt.txInputs.map((input) => {
            const selectedUtxo = totalUtxos.find(
              (utxo) =>
                utxo.txid ===
                Buffer.from(input.hash).reverse().toString("hex") &&
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
    [
      apiController,
      currentAccount,
      selectedAccount,
      selectedWallet,
      keyringController,
    ]
  );
}

export function useCreateOrdTx() {
  const currentAccount = useGetCurrentAccount();
  const { selectedAccount, selectedWallet } = useWalletState((v) => ({
    selectedAccount: v.selectedAccount,
    selectedWallet: v.selectedWallet,
  }));
  const { apiController, keyringController } = useControllersState((v) => ({
    apiController: v.apiController,
    keyringController: v.keyringController,
  }));

  return useCallback(
    async (toAddress: Hex, feeRate: number, inscription: Inscription) => {
      if (selectedWallet === undefined || selectedAccount === undefined)
        throw new Error("Failed to get current wallet or account");
      const totalUtxo: ApiUTXO[] = [];
      for (const account of currentAccount.accounts) {
        const utxos = await apiController.getUtxos(account.address);
        totalUtxo.push(...utxos);
      }

      const psbtHex = await keyringController.sendOrd({
        to: toAddress,
        utxos: [...totalUtxo, { ...inscription, isOrd: true }],
        receiverToPayFee: false,
        feeRate,
      });
      const psbt = Psbt.fromHex(psbtHex);
      const tx = psbt.extractTransaction();
      const rawtx = tx.toHex();
      return {
        rawtx,
        fee: psbt.getFee(),
        fromAddresses: [],
      };
    },
    [
      apiController,
      currentAccount,
      selectedAccount,
      selectedWallet,
      keyringController,
    ]
  );
}

export const useSendTransferTokens = () => {
  const currentAccount = useGetCurrentAccount();
  const { apiController, keyringController } = useControllersState((v) => ({
    apiController: v.apiController,
    keyringController: v.keyringController,
  }));

  return useCallback(
    async (toAddress: string, txIds: ITransfer[], feeRate: number) => {
      const totalUtxo: ApiUTXO[] = [];
      const totalInscriptions: Inscription[] = [];

      for (const account of currentAccount.accounts) {
        const utxos = await apiController.getUtxos(account.address);
        for (const utxo of utxos) {
          utxo.rawHex = await apiController.getTransactionHex(utxo.txid);
        }
        const inscriptions: Inscription[] = [];
        for (const transferToken of txIds) {
          const foundInscriptons = await apiController.getInscription({
            inscriptionId: transferToken.inscription_id,
            address: account.address,
          });
          const txid = foundInscriptons[0].rawHex;
          inscriptions.push({
            ...foundInscriptons[0],
            rawHex: await apiController.getTransactionHex(txid),
          });
        }

        totalUtxo.push(...utxos);
        totalInscriptions.push(...inscriptions);
      }

      const tx = await keyringController.createSendMultiOrd(
        toAddress,
        feeRate,
        totalInscriptions,
        totalUtxo as any
      );
      const result = await apiController.pushTx(tx);
      if (result?.txid !== undefined)
        toast.success(t("inscriptions.success_send_transfer"));
      else toast.error(t("inscriptions.failed_send_transfer"));
    },
    [apiController, currentAccount, keyringController]
  );
};

export function usePushBitcoinTxCallback() {
  const [isSent, setIsSent] = useState(false);
  const [txId, setTxId] = useState<string | undefined>(undefined);
  const { apiController } = useControllersState((v) => ({
    apiController: v.apiController,
  }));

  const pushBtcTx = useCallback(
    async (rawtx: string) => {
      try {
        const txid = await apiController.pushTx(rawtx);
        setTxId(txid.txid);
        return txid;
      } catch (e) {
        console.error(e);
      }
    },
    [apiController]
  );

  useEffect(() => {
    let t: NodeJS.Timeout;
    if (!!txId) {
      t = setTimeout(() => {
        setIsSent(true);
      }, 10000);
    }

    return () => clearTimeout(t);
  }, [txId]);

  return { pushBtcTx, isSent };
}

export function usePushCkbTxCallback() {
  const [isSent, setIsSent] = useState(false);
  const [txId, setTxId] = useState<string | undefined>(undefined);
  const currentNetwork = useGetCurrentNetwork();
  const { apiController } = useControllersState((v) => ({
    apiController: v.apiController,
  }));

  const pushCkbTx = useCallback(
    async (rawtx: string) => {
      try {
        const txid = await apiController.pushCkbTx(rawtx);
        setTxId(txid.txid);
        return txid;
      } catch (e) {
        console.error(e);
      }
    },
    [apiController]
  );

  useEffect(() => {
    let interval: NodeJS.Timeout;
    try {
      if (!!txId) {
        interval = setInterval(async () => {
          const res = await fetch(
            `${ckbExplorerApi(currentNetwork.slug)}/v1/transactions/${txId}`
          );

          const { data } = await res.json();
          setIsSent(data.attributes?.tx_status === "committed");
        }, 2000);
      }
    } catch (e) {
      console.error(e);
    }

    return () => clearInterval(interval);
  }, [txId]);

  return { pushCkbTx, isSent };
}

export function useCreateNFTTxCallback() {
  const currentAccount = useGetCurrentAccount();
  const { selectedAccount, selectedWallet } = useWalletState((v) => ({
    selectedAccount: v.selectedAccount,
    selectedWallet: v.selectedWallet,
  }));
  const { apiController, keyringController } = useControllersState((v) => ({
    apiController: v.apiController,
    keyringController: v.keyringController,
  }));
  const { network } = useGetCurrentNetwork();

  return useCallback(
    async (data: TransferNFT) => {
      if (selectedWallet === undefined || selectedAccount === undefined)
        throw new Error("Failed to get current wallet or account");

      if (!isCkbNetwork(network)) {
        toast.error("Invalid network");
        return {
          rawtx: "",
          fee: "",
          fromAddresses: [],
        };
      }

      const fromAddress = currentAccount.accounts[0].address;
      const { tx, fee } = await keyringController.transferNFT({
        ...data,
      });
      return {
        rawtx: tx,
        fee: fee,
        fromAddresses: [fromAddress],
      };
    },
    [
      apiController,
      currentAccount,
      selectedAccount,
      selectedWallet,
      keyringController,
    ]
  );
}
