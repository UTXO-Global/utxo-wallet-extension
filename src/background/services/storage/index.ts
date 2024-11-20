import { EVENTS } from "@/shared/constant";
import eventBus from "@/shared/eventBus";
import type {
  IAppStateBase,
  IGroupAccount,
  IPrivateWallet,
  IWallet,
  IWalletStateBase,
} from "@/shared/interfaces";
import { defaultNetwork } from "@/shared/networks";
import { NetworkSlug } from "@/shared/networks/types";
import { excludeKeysFromObj, pickKeysFromObj } from "@/shared/utils";
import {
  browserStorageClear,
  browserStorageLocalGet,
  browserStorageLocalSet,
} from "@/shared/utils/browser";
import * as encryptorUtils from "@/packages/browser-passworder";
import { keyringService, permissionService, storageService } from "..";
import type { DecryptedSecrets, StorageInterface } from "./types";
import { emptyAppState, emptyWalletState } from "./utils";

interface SaveWallets {
  password: string;
  wallets: IWallet[];
  payload?: DecryptedSecrets;
  newPassword?: string;
}

class StorageService {
  private _walletState: IWalletStateBase;
  private _appState: IAppStateBase;

  constructor() {
    this._walletState = emptyWalletState();
    this._appState = emptyAppState();
  }

  get walletState() {
    return this._walletState;
  }

  get appState() {
    return this._appState;
  }

  get currentWallet(): IWallet | undefined {
    const idx = this._walletState.selectedWallet;
    if (idx === undefined) return undefined;
    return this._walletState.wallets[idx];
  }

  get currentNetwork(): NetworkSlug {
    return this._walletState.selectedNetwork ?? defaultNetwork.slug;
  }

  get currentAccount(): IGroupAccount | undefined {
    if (
      this._walletState.selectedWallet === undefined ||
      this._walletState.selectedAccount === undefined
    )
      return undefined;
    return this._walletState.wallets[this._walletState.selectedWallet].accounts[
      this._walletState.selectedAccount
    ];
  }

  async init() {
    const data = await this.getLocalValues();

    this._walletState = {
      ...this._walletState,
      ...pickKeysFromObj(data.cache, [
        "selectedAccount",
        "selectedWallet",
        "selectedNetwork",
      ]),
    };
    this._appState = {
      ...this._appState,
      ...pickKeysFromObj(data.cache, [
        "addressBook",
        "pendingWallet",
        "swapSetting",
      ]),
    };

    if (data?.cache?.language) {
      this._appState = {
        ...this._appState,
        language: data.cache.language,
      };
    }
  }

  async updateWalletState(state: Partial<IWalletStateBase>) {
    this._walletState = { ...this._walletState, ...state };

    if (
      state.selectedAccount !== undefined ||
      state.selectedWallet !== undefined ||
      state.selectedNetwork !== undefined ||
      state.wallets !== undefined
    ) {
      const localState = await this.getLocalValues();
      const cache: StorageInterface["cache"] = {
        ...localState.cache,
      };
      if (state.selectedAccount !== undefined)
        cache.selectedAccount = state.selectedAccount;
      if (state.selectedWallet !== undefined)
        cache.selectedWallet = state.selectedWallet;
      if (state.selectedNetwork !== undefined)
        cache.selectedNetwork = state.selectedNetwork;
      if (state.wallets !== undefined)
        cache.wallets = state.wallets.map((f) => ({
          name: f.name,
          type: f.type,
          accounts: f.accounts.map((j, idx) => ({
            id: idx,
            name: j.name,
            network: j.network,
            accounts: j.accounts,
          })),
        }));

      const payload: StorageInterface = {
        cache,
        enc: localState.enc,
      };

      eventBus.emit(EVENTS.broadcastToUI, { method: "updateFromStore" });
      await browserStorageLocalSet(payload);
    }
  }

  async updateAppState(state: Partial<IAppStateBase>) {
    this._appState = { ...this._appState, ...state };
    if (
      state.addressBook !== undefined ||
      state.pendingWallet !== undefined ||
      state.language !== undefined
    ) {
      const localState = await this.getLocalValues();
      const cache: StorageInterface["cache"] = {
        ...localState.cache,
      };

      if (state.addressBook !== undefined)
        cache.addressBook = state.addressBook;
      if (state.pendingWallet !== undefined)
        cache.pendingWallet = state.pendingWallet;
      if (state.language !== undefined) cache.language = state.language;

      const payload: StorageInterface = {
        cache: cache,
        enc: localState.enc,
      };

      eventBus.emit(EVENTS.broadcastToUI, { method: "updateFromStore" });
      await browserStorageLocalSet(payload);
    }
  }

  async clearPendingWallet() {
    this._appState = excludeKeysFromObj(this._appState, ["pendingWallet"]);
    const localState = await this.getLocalValues();
    const newCache: StorageInterface = {
      cache: excludeKeysFromObj(localState.cache, ["pendingWallet"]),
      enc: localState.enc,
    };
    await browserStorageLocalSet(newCache);
  }

  async getPengingWallet() {
    const localState = await this.getLocalValues();
    return localState.cache.pendingWallet;
  }

  async saveWallets({ password, wallets, newPassword, payload }: SaveWallets) {
    if (!password) throw new Error("Password is required");
    const local = await this.getLocalValues();
    const current = await this.getSecrets(local, password);

    if (payload) {
      payload = [...(current ?? []), ...payload];
    } else {
      payload = current;
    }

    const walletsToSave = wallets.map((wallet) => {
      return {
        name: wallet.name,
        type: wallet.type,
        accounts: wallet.accounts.map((account, idx) => ({
          id: idx,
          name: account.name ?? "",
          network: account.network,
          accounts: account.accounts,
        })),
      };
    });

    const keyringsToSave = wallets.map((i, idx) => ({
      id: idx,
      data: keyringService.serializeById(i.id),
      phrase: payload?.find((d) => d.id === i.id)?.phrase,
    }));
    const encrypted = await encryptorUtils.encrypt(
      newPassword ?? password,
      JSON.stringify(keyringsToSave)
    );

    const data: StorageInterface = {
      enc: JSON.parse(encrypted),
      cache: {
        ...local.cache,
        wallets: walletsToSave,
        addressBook: this.appState.addressBook,
        connectedSites: permissionService.allSites,
        language: storageService.appState.language ?? "en",
      },
    };

    await browserStorageLocalSet(data);
  }

  private async getSecrets(encrypted: StorageInterface, password: string) {
    if (!encrypted.enc) return undefined;
    const loaded = (await encryptorUtils.decrypt(
      password,
      JSON.stringify(encrypted.enc)
    )) as string | undefined;
    return JSON.parse(loaded) as DecryptedSecrets | undefined;
  }

  async getWalletPhrase(index: number, password: string) {
    const encrypted = await this.getLocalValues();
    const current = await this.getSecrets(encrypted, password);
    if (current?.length === undefined || current.length < index) {
      throw new Error(`Failed to found wallet with id ${index}`);
    }
    return current[index].phrase;
  }

  async getLocalValues() {
    const data = await browserStorageLocalGet<StorageInterface>(undefined);
    if (data.cache === undefined) {
      return {
        cache: {
          addressBook: [],
          selectedWallet: 0,
          selectedAccount: 0,
          selectedNetwork: defaultNetwork.slug,
          wallets: [],
          connectedSites: [],
          swapSetting: { slippage: 0.5, isSlippageAuto: true },
        },
        enc: undefined,
      };
    }
    return data;
  }

  async importWallets(password: string): Promise<IPrivateWallet[]> {
    const encrypted = await this.getLocalValues();
    if (!encrypted) return [];

    this._appState = {
      ...this._appState,
      addressBook: encrypted.cache.addressBook,
    };

    permissionService.setConnectedSites(encrypted.cache.connectedSites);

    this._walletState = {
      ...this._walletState,
      selectedAccount: encrypted.cache.selectedAccount,
      selectedWallet: encrypted.cache.selectedWallet,
      selectedNetwork: encrypted.cache.selectedNetwork,
    };

    const secrets = await this.getSecrets(encrypted, password);

    return encrypted.cache.wallets.map((i, index: number) => {
      const current = secrets?.find((i) => i.id === index);
      return {
        ...i,
        id: index,
        phrase: current?.phrase,
        data: current?.data,
      };
    });
  }

  getUniqueName(kind: "Wallet" | "Account"): string {
    if (kind === "Wallet") {
      const wallets = this.walletState.wallets;
      if (wallets.length <= 0) return "Wallet 1";
      return `Wallet ${this.getUniqueId(
        wallets.map((f) => f.name ?? ""),
        "Wallet"
      )}`;
    } else {
      const accounts = this.currentWallet?.accounts;
      if (!accounts) return "Account 1";
      return `Account ${this.getUniqueId(
        accounts.map((f) => f.name ?? ""),
        "Account"
      )}`;
    }
  }

  private getUniqueId(names: string[], type: "Account" | "Wallet") {
    const ids: number[] = names.map((f) => {
      const name = f.trim();
      if (name.includes(type) && name.split(" ").length === 2) {
        const accountid = name.split(" ")[1];
        if (!Number.isNaN(Number(accountid))) {
          return Number.parseInt(accountid);
        }
        return 0;
      }
      return 0;
    });
    return Math.max(...ids) + 1;
  }

  getWalletAt(idx: number): IWallet | undefined {
    if (this._walletState.wallets.length < idx) {
      return undefined;
    }
    return this._walletState.wallets[idx];
  }

  async clearAllData() {
    await browserStorageClear();
    this._walletState = { ...emptyWalletState() };
    this._appState = { ...emptyAppState() };
  }
}

export default new StorageService();
