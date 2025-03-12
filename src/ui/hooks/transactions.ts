import type { Hex, TransferNFT } from "@/background/services/keyring/types";
import { ApiUTXO } from "@/shared/interfaces/api";
import { Inscription } from "@/shared/interfaces/inscriptions";
import { ITransfer } from "@/shared/interfaces/token";
import {
  isBitcoinNetwork,
  isCkbNetwork,
  isDogecoinNetwork,
} from "@/shared/networks";
import { ckbMinTransfer, tidoshisToAmount } from "@/shared/utils/transactions";
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
import { fetchExplorerAPI } from "../utils/helpers";
import { formatNumber } from "@/shared/utils";
import { RGBPP_ASSET_API_URL, RgbppAsset } from "@/shared/interfaces/rgbpp";
import {
  BTCTestnetType,
  Collector,
  genBtcJumpCkbVirtualTx,
  getXudtTypeScript,
  serializeScript,
} from "@rgbpp-sdk/ckb";
import { AddressType } from "@/shared/networks/types";
import { buildRgbppTransferTx } from "@/background/services/rgbpp";
import { NetworkType, DataSource, sendRgbppUtxos } from "@rgbpp-sdk/btc";
import { BtcAssetsApi } from "../utils/rgbpp";
import { ccc } from "@ckb-ccc/core";

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
  const { network, slug } = useGetCurrentNetwork();

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

    const tx = await keyringController.sendCoin({
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
          if (isBitcoinNetwork(network)) {
            // Filter utxo contains ordinals
            const outpointOrds = (
              await apiController.getOrdUtxos(account.address)
            ).map((oo) => `${oo.outpoint}`);
            // Filter utxo contains rgbpp
            const outpointRgbpps = await apiController.getRgbppAssetOutpoints(
              account.address
            );

            const nonOrdUtxo = utxos.filter(
              (utxo) =>
                !(
                  outpointOrds.includes(`${utxo.txid}:${utxo.vout}`) ||
                  outpointRgbpps.includes(`${utxo.txid}:${utxo.vout}`)
                )
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
        const psbtHex = await keyringController.sendCoin({
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
      const tx = psbt.extractTransaction(true);
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
  const { apiController } = useControllersState((v) => ({
    apiController: v.apiController,
  }));

  return useCallback(
    async (rawtx: string) => {
      try {
        const txid = await apiController.pushTx(rawtx);
        return txid;
      } catch (e) {
        console.error(e);
      }
    },
    [apiController]
  );
}

export function usePushCkbTxCallback() {
  const [isSent, setIsSent] = useState(false);
  const [txId, setTxId] = useState<string | undefined>(undefined);
  const currentNetwork = useGetCurrentNetwork();
  const { apiController, keyringController } = useControllersState((v) => ({
    apiController: v.apiController,
    keyringController: v.keyringController,
  }));

  const pushCkbTx = useCallback(
    async (rawtx: string) => {
      try {
        const tx = await apiController.pushCkbTx(rawtx);
        setTxId(tx.txid);
        return tx;
      } catch (e) {
        console.error(e);
      }
    },
    [apiController]
  );

  const pushCkbTxWithSigner = useCallback(
    async (rawTx: string) => {
      try {
        const tx = await apiController.pushCkbTxWithSigner(rawTx);
        setTxId(tx.txid);
        return tx;
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
          const res = await fetchExplorerAPI(
            currentNetwork.slug,
            `/v1/transactions/${txId}`
          );

          const { data } = await res.json();
          setIsSent(data.attributes?.tx_status === "committed");
        }, 1500); //1.5s
      }
    } catch (e) {
      console.error(e);
    }

    return () => clearInterval(interval);
  }, [txId]);

  return { pushCkbTx, pushCkbTxWithSigner, isSent };
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
      if (selectedWallet === undefined || selectedAccount === undefined) {
        throw new Error("Failed to get current wallet or account");
      }

      if (!isCkbNetwork(network)) {
        toast.error("Invalid network");
        return {
          tx: "",
          fee: "",
          fromAddresses: [],
        };
      }

      const fromAddress = currentAccount.accounts[0].address;
      const nftRes = await keyringController.createTransferNFT({
        ...data,
      });

      return {
        tx: nftRes.tx,
        fee: nftRes.fee,
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

export function useCreateRgbppTxCallback() {
  const { selectedAccount, selectedWallet } = useWalletState((v) => ({
    selectedAccount: v.selectedAccount,
    selectedWallet: v.selectedWallet,
  }));
  const { keyringController } = useControllersState((v) => ({
    keyringController: v.keyringController,
  }));
  const account = useGetCurrentAccount();
  const { slug: networkSlug } = useGetCurrentNetwork();

  return useCallback(
    async (
      toAddress: Hex,
      transferAmount: number,
      xudtTypeArgs: string,
      rgbppAssets: RgbppAsset[]
    ) => {
      if (selectedWallet === undefined || selectedAccount === undefined)
        throw new Error("Failed to get current wallet or account");

      if (!account || !account.accounts[0].address)
        throw new Error("Error when trying to get the current account");

      const isMainnet = networkSlug === "btc";

      let btcTestnetNetworkType: BTCTestnetType | undefined;
      let btcNetworkType = NetworkType.TESTNET;

      let ckbIndexerUrl = "https://testnet.ckb.dev/indexer";
      let ckbNodeUrl = "https://testnet.ckb.dev/rpc";
      switch (networkSlug) {
        case "btc_signet":
          btcTestnetNetworkType = "Signet" as BTCTestnetType;
          btcNetworkType = NetworkType.TESTNET;
          break;
        case "btc_testnet":
        case "btc_testnet_4":
          btcTestnetNetworkType = "Testnet3" as BTCTestnetType;
          btcNetworkType = NetworkType.TESTNET;
          break;
        case "btc":
          btcNetworkType = NetworkType.MAINNET;
          ckbIndexerUrl = "https://mainnet.ckb.dev/indexer";
          ckbNodeUrl = "https://mainnet.ckb.dev/rpc";
          break;
      }
      const collector = new Collector({
        ckbNodeUrl,
        ckbIndexerUrl,
      });

      const btcService = new BtcAssetsApi(RGBPP_ASSET_API_URL, networkSlug);
      const btcDataSource = new DataSource(btcService, btcNetworkType);

      const rgbppLockArgsList = rgbppAssets.map(
        (asset) => asset.cellOutput.lock.args
      );

      // TODO: check assets all address type
      const _account = account.accounts.find(
        (acc) => acc.addressType.value === AddressType.P2TR
      );
      const fromPubkey = await keyringController.exportPublicKey(
        _account.hdPath
      );

      const { ckbVirtualTxResult, btcPsbtHex } = await buildRgbppTransferTx({
        ckb: {
          collector,
          xudtTypeArgs,
          rgbppLockArgsList,
          transferAmount: BigInt(transferAmount),
        },
        btc: {
          fromAddress: _account.address,
          toAddress,
          fromPubkey,
          dataSource: btcDataSource,
          testnetType: btcTestnetNetworkType,
        },
        isMainnet,
      });

      // TODO: Save ckbVirtualTxResult
      const isomorphicTx = JSON.stringify(ckbVirtualTxResult);
      // btcService.sendRgbppCkbTransaction({ btc_txid: btcTxId, ckb_virtual_result: ckbVirtualTxResult })

      const unsignedPsbt = Psbt.fromHex(btcPsbtHex);
      const toSignInputs = unsignedPsbt.data.inputs.map((v, index) => ({
        index,
        address: _account.address,
      }));

      const psbtHex = await keyringController.sendRgbpp(
        btcPsbtHex,
        toSignInputs
      );
      const psbt = Psbt.fromHex(psbtHex);
      const tx = psbt.extractTransaction();
      const rawtx = tx.toHex();
      return {
        rawtx,
        fee: psbt.getFee(),
        isomorphicTx,
        fromAddresses: [_account.address], // TODO: return address of specific selected input
      };
    },
    [selectedAccount, selectedWallet, keyringController]
  );
}

export function useCreateBtcLeapRgbppTxCallback() {
  const { selectedAccount, selectedWallet } = useWalletState((v) => ({
    selectedAccount: v.selectedAccount,
    selectedWallet: v.selectedWallet,
  }));
  const { keyringController } = useControllersState((v) => ({
    keyringController: v.keyringController,
  }));
  const account = useGetCurrentAccount();
  const { slug: networkSlug } = useGetCurrentNetwork();

  return useCallback(
    async (
      toCkbAddress: string,
      transferAmount: number,
      xudtTypeArgs: string,
      rgbppAssets: RgbppAsset[]
    ) => {
      if (selectedWallet === undefined || selectedAccount === undefined)
        throw new Error("Failed to get current wallet or account");

      if (!account || !account.accounts[0].address)
        throw new Error("Error when trying to get the current account");

      const isMainnet = networkSlug === "btc";

      let btcTestnetNetworkType: BTCTestnetType | undefined;
      let btcNetworkType = NetworkType.TESTNET;

      let ckbIndexerUrl = "https://testnet.ckb.dev/indexer";
      let ckbNodeUrl = "https://testnet.ckb.dev/rpc";
      switch (networkSlug) {
        case "btc_signet":
          btcTestnetNetworkType = "Signet" as BTCTestnetType;
          btcNetworkType = NetworkType.TESTNET;
          break;
        case "btc_testnet":
        case "btc_testnet_4":
          btcTestnetNetworkType = "Testnet3" as BTCTestnetType;
          btcNetworkType = NetworkType.TESTNET;
          break;
        case "btc":
          btcNetworkType = NetworkType.MAINNET;
          ckbIndexerUrl = "https://mainnet.ckb.dev/indexer";
          ckbNodeUrl = "https://mainnet.ckb.dev/rpc";
          break;
      }
      const collector = new Collector({
        ckbNodeUrl,
        ckbIndexerUrl,
      });

      const btcService = new BtcAssetsApi(RGBPP_ASSET_API_URL, networkSlug);
      const btcDataSource = new DataSource(btcService, btcNetworkType);

      const rgbppLockArgsList = rgbppAssets.map(
        (asset) => asset.cellOutput.lock.args
      );

      // TODO: check assets all address type
      const _account = account.accounts.find(
        (acc) => acc.addressType.value === AddressType.P2TR
      );
      const fromPubkey = await keyringController.exportPublicKey(
        _account.hdPath
      );

      const xudtType: CKBComponents.Script = {
        ...getXudtTypeScript(isMainnet),
        args: xudtTypeArgs,
      };
      const ckbVirtualTxResult = await genBtcJumpCkbVirtualTx({
        collector,
        rgbppLockArgsList,
        xudtTypeBytes: serializeScript(xudtType),
        transferAmount: BigInt(transferAmount),
        toCkbAddress,
        isMainnet,
        btcTestnetType: btcTestnetNetworkType,
        // btcConfirmationBlocks: 20,   // default value is 6
      });

      // TODO: Save ckbVirtualTxResult
      const isomorphicTx = JSON.stringify(ckbVirtualTxResult);
      // btcService.sendRgbppCkbTransaction({ btc_txid: btcTxId, ckb_virtual_result: ckbVirtualTxResult })

      const { commitment, ckbRawTx } = ckbVirtualTxResult;

      const unsignedPsbt = await sendRgbppUtxos({
        ckbVirtualTx: ckbRawTx,
        commitment,
        tos: [_account.address],
        ckbCollector: collector,
        from: _account.address,
        fromPubkey,
        source: btcDataSource,
      });

      const toSignInputs = unsignedPsbt.data.inputs.map((v, index) => ({
        index,
        address: _account.address,
      }));

      const psbtHex = await keyringController.sendRgbpp(
        unsignedPsbt.toHex(),
        toSignInputs
      );
      const psbt = Psbt.fromHex(psbtHex);
      const tx = psbt.extractTransaction();
      const rawtx = tx.toHex();
      return {
        rawtx,
        fee: psbt.getFee(),
        isomorphicTx,
        fromAddresses: [_account.address], // TODO: return address of specific selected input
      };
    },
    [selectedAccount, selectedWallet, keyringController]
  );
}
