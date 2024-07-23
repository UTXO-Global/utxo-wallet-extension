import type { SendCoin } from "@/background/services/keyring/types";
import permission from "@/background/services/permission";
import type { ApiUTXO } from "@/shared/interfaces/api";
import { SignPsbtOptions } from "@/shared/interfaces/provider";
import {
  getNetworkDataBySlug,
  isBitcoinNetwork,
  isCkbNetwork,
} from "@/shared/networks";
import { capacityOf, getCells } from "@/shared/networks/ckb/helpers";
import { fetchEsplora } from "@/shared/utils";
import { Psbt } from "bitcoinjs-lib";
import "reflect-metadata/lite";
import { keyringService, sessionService, storageService } from "../../services";

class ProviderController {
  connect = async () => {
    if (storageService.currentWallet === undefined) return undefined;
    // TODO
    const _account = storageService.currentAccount.id;
    const account = _account ? _account : "";
    sessionService.broadcastEvent("accountsChanged", account);
    return account;
  };

  @Reflect.metadata("SAFE", true)
  getAccounts = async () => {
    if (storageService.currentWallet === undefined) return undefined;
    return storageService.currentWallet.accounts[0].accounts.map(
      (account) => account.address
    );
  };

  @Reflect.metadata("SAFE", true)
  getNetwork = () => {
    return storageService.currentNetwork;
  };

  @Reflect.metadata("APPROVAL", [
    "switchNetwork",
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_network: string) => {}
  ])
  switchNetwork = (network: string) => {
    // TODO Switch network
    return network;
  };

  @Reflect.metadata("SAFE", true)
  getBalance = async ({ session: { origin } }) => {
    if (!permission.siteIsConnected(origin)) return undefined;
    const currentAccount = storageService.currentAccount;
    if (!currentAccount) return null;
    const networkData = getNetworkDataBySlug(storageService.currentNetwork);

    if (isBitcoinNetwork(networkData.network)) {
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
  getAccountName = async ({ session: { origin } }) => {
    if (!permission.siteIsConnected(origin)) return undefined;
    const account = storageService.currentAccount;
    if (!account) return null;
    return account.name;
  };

  @Reflect.metadata("SAFE", true)
  isConnected = async ({ session: { origin } }) => {
    return permission.siteIsConnected(origin);
  };

  @Reflect.metadata("SAFE", true)
  getAccount = async ({ session: { origin } }) => {
    if (!permission.siteIsConnected(origin)) return undefined;
    const _account = storageService.currentAccount;
    if (!_account) return undefined;
    return _account.accounts.map((account) => account.address);
  };

  @Reflect.metadata("SAFE", true)
  calculateFee = async ({
    session: { origin },
    data: {
      params: { hex, feeRate },
    },
  }) => {
    if (!permission.siteIsConnected(origin)) return undefined;
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
  getPublicKey = async ({ session: { origin } }) => {
    if (!permission.siteIsConnected(origin)) return undefined;
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
    "CreateTx",
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_req: any) => {},
  ])
  createTx = async (data: any) => {
    const account = storageService.currentAccount;
    if (!account) return;
    const networkData = getNetworkDataBySlug(this.getNetwork());
    if (isBitcoinNetwork(networkData.network)) {
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
      return psbt.extractTransaction().toHex();
    } else if (isCkbNetwork(networkData.network)) {
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
    "signPsbt",
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_req: any) => {},
  ])
  signPsbt = async (data: {
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
    const tx = psbt.extractTransaction();
    return {
      psbtHex: tx.toHex(),
      txId: tx.getId(),
    };
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

export default new ProviderController();
