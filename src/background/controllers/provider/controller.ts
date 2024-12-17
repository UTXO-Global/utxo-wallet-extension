import type { SendCoin } from "@/background/services/keyring/types";
import permission from "@/background/services/permission";
import type { ApiUTXO } from "@/shared/interfaces/api";
import { SignPsbtOptions } from "@/shared/interfaces/provider";
import {
  btcTestnetSlug,
  dogecoinTestnetSlug,
  getNetworkDataBySlug,
  isBitcoinNetwork,
  isCkbNetwork,
  isDogecoinNetwork,
  nervosTestnetSlug,
} from "@/shared/networks";
import {
  callCKBRPC,
  capacityOf,
  getCells,
} from "@/shared/networks/ckb/helpers";
import { fetchEsplora } from "@/shared/utils";
import { Psbt } from "bitcoinjs-lib";
import "reflect-metadata/lite";
import { keyringService, sessionService, storageService } from "../../services";
import { IGroupAccount, IWallet } from "@/shared/interfaces";
import walletController from "../walletController";
import { ChainSlug, NetworkData, NetworkSlug } from "@/shared/networks/types";
import { BTC_LIVENET, BTC_TESTNET4 } from "@/shared/networks/btc";
import {
  CKB_MAINNET,
  CKB_NEURON_HD_PATH,
  CKB_TESTNET,
} from "@/shared/networks/ckb";
import { helpers } from "@ckb-lumos/lumos";
import { NetworkConfig } from "@/shared/networks/ckb/offckb.config";
import { ccc } from "@ckb-ccc/core";
import { DOGECOIN_LIVENET, DOGECOIN_TESTNET } from "@/shared/networks/dogecoin";

class ProviderController {
  connect = async () => {
    if (storageService.currentWallet === undefined) return undefined;
    // TODO
    const _account = storageService.currentAccount.accounts;
    const account = _account ? _account : [];
    sessionService.broadcastEvent("accountsChanged", account);
    return account;
  };

  @Reflect.metadata("INTERNAL", true)
  _getCurrentChain = () => {
    const currentChain = storageService.currentNetwork.split("_", 1);
    return currentChain.length > 0 ? currentChain[0] : "";
  };

  @Reflect.metadata("INTERNAL", true)
  _switchNetwork = async (_network: NetworkSlug) => {
    const currentNetwork = storageService.currentNetwork;
    if (currentNetwork === _network) return currentNetwork;

    const currentAccount = storageService.currentAccount;
    if (!currentAccount) return currentNetwork;

    const currentWallet = storageService.currentWallet;

    const _wallets: IWallet[] = [];
    let selectedAccount = currentAccount.id;
    const wallets = storageService.walletState.wallets;

    for (const wallet of wallets) {
      if (wallet.id !== currentWallet.id) {
        _wallets.push(wallet);
        continue;
      }

      const networkGroupAccounts: IGroupAccount[] = wallet.accounts.filter(
        (account) => _network === account.network
      );

      if (!networkGroupAccounts || networkGroupAccounts.length === 0) {
        let _otherNetworkGroupAccounts: IGroupAccount[] = [];
        if (["nervos", "nervos_testnet"].includes(_network)) {
          _otherNetworkGroupAccounts = wallet.accounts.filter(
            (account) =>
              account.network ===
              (_network === "nervos" ? "nervos_testnet" : "nervos")
          );
        } else if (["dogecoin", "dogecoin_testnet"].includes(_network)) {
          _otherNetworkGroupAccounts = wallet.accounts.filter(
            (account) =>
              account.network ===
              (_network === "dogecoin" ? "dogecoin_testnet" : "dogecoin")
          );
        }

        const hdPathForNeuronWallet =
          _otherNetworkGroupAccounts.length === 0
            ? ""
            : _otherNetworkGroupAccounts[0].accounts[0].hdPath ===
              CKB_NEURON_HD_PATH
            ? CKB_NEURON_HD_PATH
            : "";

        const accounts = await walletController.createDefaultGroupAccount(
          _network,
          wallet.id,
          hdPathForNeuronWallet
        );
        if (wallet.id === currentWallet.id) {
          selectedAccount = wallet.accounts.length;
        }
        wallet.accounts = [...wallet.accounts, accounts].map((f, i) => ({
          ...f,
          id: i,
        }));
      } else if (wallet.id === currentWallet.id) {
        if (!networkGroupAccounts.map((c) => c.id).includes(selectedAccount)) {
          selectedAccount = networkGroupAccounts[0].id;
        }
      }

      _wallets.push({
        ...wallet,
      });
    }

    await storageService.updateWalletState({
      selectedNetwork: _network,
      selectedAccount,
      wallets: _wallets,
    });

    sessionService.broadcastEvent("networkChanged", _network);
    return _network;
  };

  @Reflect.metadata("INTERNAL", true)
  _switchChain = async (chainSlug: ChainSlug) => {
    const currentNetwork = storageService.currentNetwork;
    const isTestnet = [
      ...btcTestnetSlug,
      ...nervosTestnetSlug,
      ...dogecoinTestnetSlug,
    ].includes(currentNetwork);

    if (this._getCurrentChain() === chainSlug) {
      return chainSlug;
    }

    let network: NetworkData | undefined = undefined;
    switch (chainSlug) {
      case "btc":
        network = isTestnet ? BTC_TESTNET4 : BTC_LIVENET;
        break;
      case "nervos":
        network = isTestnet ? CKB_TESTNET : CKB_MAINNET;
        break;
      case "dogecoin":
        network = isTestnet ? DOGECOIN_TESTNET : DOGECOIN_LIVENET;
    }

    if (network) {
      await this._switchNetwork(network.slug);
    }

    return chainSlug;
  };

  @Reflect.metadata("SAFE", true)
  getAccounts = async () => {
    if (storageService.currentWallet === undefined) return undefined;
    return storageService.currentWallet.accounts[0].accounts.map(
      (account) => account.address
    );
  };

  @Reflect.metadata("APPROVAL", [
    "switchChain",
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_req: any) => {},
  ])
  switchChain = async ({
    data: {
      params: { chain },
    },
  }) => {
    return await this._switchChain(chain);
  };

  @Reflect.metadata("SAFE", true)
  getNetwork = () => {
    return storageService.currentNetwork;
  };

  @Reflect.metadata(
    "APPROVAL",
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ["switchNetwork", (_req: any) => {}]
  )
  switchNetwork = async ({
    data: {
      params: { network },
    },
  }) => {
    return await this._switchNetwork(network);
  };

  @Reflect.metadata("SAFE", true)
  getBalance = async () => {
    if (!(await permission.siteIsConnected())) return undefined;
    const currentAccount = storageService.currentAccount;
    if (!currentAccount) return null;
    const networkData = getNetworkDataBySlug(storageService.currentNetwork);

    if (
      isBitcoinNetwork(networkData.network) ||
      isDogecoinNetwork(networkData.network)
    ) {
      const balance = [];
      for (let i = 0; i < currentAccount.accounts.length; i++) {
        const data = await fetchEsplora<ApiUTXO[]>({
          path: `${networkData.esploraUrl}/address/${currentAccount.accounts[i].address}/utxo`,
        });

        balance.push(data.reduce((acc, utxo) => acc + utxo.value, 0));
      }
      return balance;
    } else if (isCkbNetwork(networkData.network)) {
      const balance = await capacityOf(
        networkData.network,
        currentAccount.accounts[0].address
      );
      return [balance.toNumber()];
    }
  };

  @Reflect.metadata("SAFE", true)
  getAccountName = async () => {
    if (!(await permission.siteIsConnected())) return undefined;
    const account = storageService.currentAccount;
    if (!account) return null;
    return account.name;
  };

  @Reflect.metadata("SAFE", true)
  isConnected = async () => {
    return permission.siteIsConnected();
  };

  @Reflect.metadata("SAFE", true)
  getAccount = async () => {
    if (!(await permission.siteIsConnected())) return undefined;
    const _account = storageService.currentAccount;
    if (!_account) return undefined;
    return _account.accounts.map((account) => account.address);
  };

  @Reflect.metadata("SAFE", true)
  calculateFee = async ({
    session,
    data: {
      params: { hex, feeRate },
    },
  }) => {
    if (!(await permission.siteIsConnected())) return undefined;
    const psbt = Psbt.fromHex(hex);
    (psbt as any).__CACHE.__UNSAFE_SIGN_NONSEGWIT = true;

    keyringService.signPsbt(psbt);
    let txSize = psbt.extractTransaction(true).toBuffer().length;
    psbt.data.inputs.forEach((v) => {
      if (v.finalScriptWitness) {
        txSize -= v.finalScriptWitness.length * 0.75;
      }
    });
    const fee = Math.ceil(txSize * feeRate);
    return fee;
  };

  @Reflect.metadata("SAFE", true)
  getPublicKey = async () => {
    if (!(await permission.siteIsConnected())) return undefined;
    const _account = storageService.currentAccount;
    if (!_account) return undefined;
    return _account.accounts.map((account) => ({
      address: account.address,
      publicKey: keyringService.exportPublicKey(account.hdPath),
    }));
  };

  @Reflect.metadata("APPROVAL", [
    "signMessage",
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_req: any) => {},
  ])
  signMessage = async ({
    data: {
      params: { text, address },
    },
  }) => {
    const currentAccount = storageService.currentAccount;
    if (!currentAccount) return;
    const account = currentAccount.accounts.find(
      (_account) => _account.address === address
    );
    if (!account) return;

    const message = keyringService.signMessage({
      hdPath: account.hdPath,
      data: text,
    });
    return message;
  };

  @Reflect.metadata("APPROVAL", [
    "signLNInvoice",
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_req: any) => {},
  ])
  signLNInvoice = async ({
    data: {
      params: { invoice, address },
    },
  }) => {
    const currentAccount = storageService.currentAccount;
    if (!currentAccount) return;
    const account = currentAccount.accounts.find(
      (_account) => _account.address === address
    );
    if (!account) return;

    return keyringService.signMessage({
      hdPath: account.hdPath,
      data: invoice,
    });
  };
}

class BTCProviderController extends ProviderController {
  @Reflect.metadata("APPROVAL", [
    "CreateTx",
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_req: any) => {},
  ])
  createTx = async (data: any) => {
    const account = storageService.currentAccount;
    if (!account) return;
    const networkData = getNetworkDataBySlug(this.getNetwork());
    if (
      isBitcoinNetwork(networkData.network) ||
      isDogecoinNetwork(networkData.network)
    ) {
      const allUtxos: ApiUTXO[] = [];
      for (const _account of account.accounts) {
        const utxos = await fetchEsplora<ApiUTXO[]>({
          path: `${networkData.esploraUrl}/address/${_account.address}/utxo`,
        });

        allUtxos.push(
          ...utxos.map((utxo) => ({
            ...utxo,
            address: _account.address,
          }))
        );
      }

      const transactionData = {
        ...data.data.params,
        utxos: allUtxos,
      } as SendCoin;
      transactionData.amount = transactionData.amount * 10 ** 8;
      const tx = await keyringService.sendCoin(transactionData);
      const psbt = Psbt.fromHex(tx);
      return psbt.extractTransaction(true).toHex();
    }
  };

  @Reflect.metadata("APPROVAL", [
    "signTransaction",
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_req: any) => {},
  ])
  signTransaction = async (data: {
    data: {
      params: {
        psbtBase64: string;
        options?: SignPsbtOptions;
      };
    };
  }) => {
    const psbt = Psbt.fromBase64(data.data.params.psbtBase64);
    await keyringService.signPsbtWithoutFinalizing(
      psbt,
      data.data.params.options?.toSignInputs
    );

    // eslint-disable-next-line no-unsafe-optional-chaining
    for (const index of data.data.params.options?.toSignInputs.keys()) {
      psbt.finalizeInput(index);
    }
    const tx = psbt.extractTransaction(true);
    return {
      psbtHex: tx.toHex(),
      txId: tx.getId(),
    };
  };
}

class CKBProviderController extends ProviderController {
  @Reflect.metadata("APPROVAL", [
    "CreateTx",
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_req: any) => {},
  ])
  createTx = async (data: any) => {
    const account = storageService.currentAccount;
    if (!account) return;
    const networkData = getNetworkDataBySlug(this.getNetwork());
    if (isCkbNetwork(networkData.network)) {
      const cells = await getCells(
        networkData.network,
        account.accounts[0].address
      );
      const transactionData = {
        ...data.data.params,
        cells,
      } as SendCoin;
      transactionData.amount = transactionData.amount * 10 ** 8;
      const tx = await keyringService.sendCoin(transactionData);
      return tx;
    }
  };

  @Reflect.metadata("APPROVAL", [
    "signTransaction",
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_req: any) => {},
  ])
  signTransaction = async (data: { data: { params: { tx: any } } }) => {
    const networkSlug = storageService.currentNetwork;
    const network = getNetworkDataBySlug(networkSlug);
    const networkConfig = network.network as NetworkConfig;

    if (!isCkbNetwork(network.network)) {
      throw new Error("Error when trying to get the current account");
    }

    const account = storageService.currentAccount;
    if (!account || !account.accounts[0].address) {
      throw new Error("Error when trying to get the current account");
    }

    const tx = data.data.params.tx;
    let txSkeleton = helpers.TransactionSkeleton();
    if (tx.cellDeps && tx.cellDeps.length > 0) {
      tx.cellDeps?.forEach((cellDep: any) => {
        txSkeleton = txSkeleton.update("cellDeps", (cellDeps) =>
          cellDeps.push({
            ...cellDep,
            outPoint: {
              txHash: cellDep.outPoint.txHash,
              index: ccc.numToHex(cellDep.outPoint.index),
            },
          })
        );
      });
    }

    if (!tx.inputs) {
      throw new Error("Error when trying to get inputs");
    }

    for (const input of tx.inputs) {
      if (!input.previousOutput) {
        throw new Error("Error when trying to get the previous output");
      }

      const txInput = await callCKBRPC(
        networkConfig.rpc_url,
        "get_transaction",
        [input.previousOutput.txHash]
      );

      const cellOutput =
        txInput?.transaction?.outputs[Number(input.previousOutput.index)];

      if (!cellOutput) {
        throw new Error(
          `Error when trying to get the cell output ${input.previousOutput.txHash}`
        );
      }

      txSkeleton = txSkeleton.update("inputs", (inputs) =>
        inputs.push({
          outPoint: {
            txHash: input.previousOutput.txHash,
            index: ccc.numToHex(input.previousOutput.index),
          },
          data: input.outputData ? input.outputData : "0x",
          cellOutput: {
            capacity: ccc.numToHex(cellOutput.capacity),
            lock: {
              codeHash: cellOutput.lock?.code_hash,
              hashType: cellOutput.lock?.hash_type,
              args: cellOutput.lock?.args,
            },
            type: cellOutput.type,
          },
        })
      );
    }

    const outputsData = tx.outputsData || [];
    tx.outputs?.forEach((output: any, index: number) => {
      txSkeleton = txSkeleton.update("outputs", (outputs) =>
        outputs.push({
          cellOutput: {
            capacity: ccc.numToHex(output.capacity),
            lock: output.lock,
            type: output.type || null,
          },
          data: outputsData[index] || "0x",
        })
      );
    });

    tx.headerDeps?.forEach((headerDep: any) => {
      txSkeleton = txSkeleton.update("headerDeps", (headerDeps) =>
        headerDeps.push(headerDep)
      );
    });

    tx.witnesses?.forEach((witness: any) => {
      txSkeleton = txSkeleton.update("witnesses", (witnesses) =>
        witnesses.push(witness)
      );
    });

    return await keyringService.signCkbTransaction({
      hdPath: account.accounts[0].hdPath,
      tx: txSkeleton,
    });
  };
}

class DogeCoinProviderController extends BTCProviderController {}

export const ckbProviderController = new CKBProviderController();
export const btcProviderController = new BTCProviderController();
export const dogecoinProviderController = new DogeCoinProviderController();
export default new ProviderController();
