import { storageService } from "@/background/services";
import keyringService from "@/background/services/keyring";
import type {
  IAccount,
  IGroupAccount,
  INewWalletProps,
  IWallet,
  IWalletController,
} from "@/shared/interfaces";
import {
  getNetworkChainSlug,
  getNetworkDataBySlug,
  isBitcoinNetwork,
  supportedNetworks,
} from "@/shared/networks";
import { BTC_LIVENET_ADDRESS_TYPES } from "@/shared/networks/btc";
import { NetworkSlug } from "@/shared/networks/types";
import { excludeKeysFromObj } from "@/shared/utils";
import * as bip39 from "bip39";
import { Keyring } from "../services/keyring/ckbhdw";
import { getAddress } from "../services/keyring/ckbhdw/hd/utils";
import { Json } from "../services/keyring/types";
import type { DecryptedSecrets } from "../services/storage/types";
import { CKB_NEURON_HD_PATH } from "@/shared/networks/ckb";

function getAddressesByWalletIndex({
  walletIndex,
  network,
}: {
  walletIndex?: number;
  network?: NetworkSlug;
}): string[][] {
  const walletIdx =
    walletIndex ??
    (storageService.currentWallet ? storageService.currentWallet.id : 0);
  const networkSlug = network ?? storageService.currentNetwork;
  const keyring = keyringService.getKeyringByIndex(walletIdx);
  const wallet = storageService.getWalletAt(walletIdx);

  if (!wallet) {
    return [];
  }

  const addresses: string[][] = [];

  for (const groupAccount of wallet.accounts) {
    const groupAddress: string[] = [];
    for (const { hdPath, addressType, network } of groupAccount.accounts) {
      if (network === networkSlug) {
        const publicKey = keyring.exportPublicKey(hdPath);
        const address = getAddress(
          addressType.value,
          Buffer.from(publicKey, "hex"),
          networkSlug
        );
        groupAddress.push(address);
      }
    }
    addresses.push(groupAddress);
  }

  return addresses;
}

function getNewHdPathFromAddressType(hdPath: string, newIndex: number): string {
  const hdPathPrefix = hdPath.split("/").slice(0, -1).join("/");
  return hdPathPrefix + "/" + newIndex.toString();
}

function getIndexFromHdPath(hdPath: string): number {
  const _hdPath = hdPath.split("/");
  return Number(_hdPath[_hdPath.length - 1]);
}

function getNewGAccountIndex(
  accounts: IGroupAccount[],
  network: NetworkSlug
): number {
  const _accounts = accounts.filter((z) => z.network === network);
  const _lastIndex = getIndexFromHdPath(
    _accounts[_accounts.length - 1].accounts[0].hdPath
  );
  return _lastIndex + 1;
}

async function _createDefaultGroupAccount({
  networkSlug,
  key,
  walletId,
  hdPath,
}: {
  networkSlug: NetworkSlug;
  key?: Keyring<Json>;
  walletId?: number;
  hdPath?: string;
}): Promise<IGroupAccount> {
  const keyring =
    key ??
    keyringService.getKeyringByIndex(
      walletId ?? storageService.currentWallet.id
    );
  const network = getNetworkDataBySlug(networkSlug);

  if (!keyring.isSimpleKey()) {
    // Unisat bitcoin network testnet, mainnet, signet has same hdpath (as mainnet)
    let addressTypes = network.addressTypes;
    if (
      !keyring.isNetworkBaseHdPath() &&
      getNetworkChainSlug(network.slug) === "btc"
    ) {
      addressTypes = BTC_LIVENET_ADDRESS_TYPES;
    }

    const accounts: IAccount[] = addressTypes.map((addressType, id) => {
      const publicKey = keyring.exportPublicKey(hdPath || addressType.hdPath);
      const address = getAddress(
        addressType.value,
        Buffer.from(publicKey, "hex"),
        networkSlug
      );
      return {
        id,
        name: `Account ${id}`,
        addressType,
        network: networkSlug,
        address,
        hdPath: hdPath || addressType.hdPath,
      };
    });

    return {
      id: 0,
      name: `Account 0`,
      accounts,
      network: networkSlug,
    };
  } else {
    // Remove ordinals account because there no hdpath
    // TODO: tweak P2TR to create new ordinals account
    const addressTypes = isBitcoinNetwork(network.network)
      ? network.addressTypes.slice(0, -1)
      : network.addressTypes;
    const accounts: IAccount[] = addressTypes.map((addressType, id) => {
      const publicKey = keyring.exportPublicKey(hdPath || addressType.hdPath);
      const address = getAddress(
        addressType.value,
        Buffer.from(publicKey, "hex"),
        networkSlug
      );
      return {
        id,
        name: `Account ${id}`,
        addressType,
        network: networkSlug,
        address,
        hdPath: "",
      };
    });

    return {
      id: 0,
      name: `Account 0`,
      accounts,
      network: networkSlug,
    };
  }
}

class WalletController implements IWalletController {
  async isVaultEmpty() {
    const values = await storageService.getLocalValues();
    return values.enc === undefined;
  }

  async createNewWallet(props: INewWalletProps): Promise<IWallet> {
    const exportedWallets = storageService.walletState.wallets;

    const walletId =
      exportedWallets.length > 0
        ? exportedWallets[exportedWallets.length - 1].id + 1
        : 0;

    const keyring = await keyringService.newKeyring(props);

    const hdPath =
      props.restoreFromWallet === "neuron" ? CKB_NEURON_HD_PATH : "";

    const groupAccount = await _createDefaultGroupAccount({
      networkSlug: storageService.currentNetwork,
      key: keyring,
      hdPath,
    });

    return {
      name: !props.name ? storageService.getUniqueName("Wallet") : props.name,
      id: walletId,
      type: props.walletType,
      accounts: [groupAccount],
      restoreFromWallet: props.restoreFromWallet
    };
  }

  async saveWallets(data?: DecryptedSecrets, newPassword?: string) {
    await storageService.saveWallets({
      password: storageService.appState.password,
      wallets: storageService.walletState.wallets,
      payload: data,
      newPassword,
    });
  }

  async importWallets(password: string) {
    const wallets = await keyringService.init(password);
    const data = await storageService.getLocalValues();

    return wallets.map((i, index) => {
      i.accounts = data.cache.wallets[index].accounts.map((account) => {
        return {
          ...account,
        };
      });
      return excludeKeysFromObj(i, ["data"]);
    });
  }

  async loadAccountsData(
    walletIndex: number,
    accounts: IGroupAccount[]
  ): Promise<IGroupAccount[]> {
    const addresses = getAddressesByWalletIndex({ walletIndex });

    return accounts.map((i, idx) => ({
      ...i,
      id: idx,
      address: addresses[i.id],
    }));
  }

  async createNewGroupAccount(
    networkSlug: NetworkSlug,
    name?: string,
    walletId?: number
  ): Promise<IGroupAccount> {
    const wallet = storageService.currentWallet;
    if (!wallet) {
      throw new Error("No one selected wallet");
    }
    const accName = !name?.length
      ? storageService.getUniqueName("Account")
      : name;

    const keyring = keyringService.getKeyringByIndex(
      walletId ?? storageService.currentWallet.id
    );
    if (keyring.isSimpleKey()) {
      throw new Error("No supported on simple key");
    }
    const network = getNetworkDataBySlug(networkSlug);
    const newGAccountIndex = getNewGAccountIndex(wallet.accounts, networkSlug);

    // Unisat bitcoin network testnet, mainnet, signet has same hdpath (as mainnet)
    let addressTypes = network.addressTypes;
    if (
      !keyring.isNetworkBaseHdPath() &&
      getNetworkChainSlug(network.slug) === "btc"
    ) {
      addressTypes = BTC_LIVENET_ADDRESS_TYPES;
    }

    const accounts: IAccount[] = addressTypes.map((addressType, id) => {
      const hdPath = getNewHdPathFromAddressType(
        wallet.restoreFromWallet === "neuron"
          ? CKB_NEURON_HD_PATH
          : addressType.hdPath,
        newGAccountIndex
      );
      const publicKey = keyring.exportPublicKey(hdPath);
      const address = getAddress(
        addressType.value,
        Buffer.from(publicKey, "hex"),
        networkSlug
      );
      return {
        id,
        name: `Account ${id}`,
        addressType,
        network: networkSlug,
        address,
        hdPath: hdPath,
      };
    });

    return {
      id: wallet.accounts[wallet.accounts.length - 1].id + 1,
      accounts,
      network: networkSlug,
      name: accName,
    };
  }

  async createDefaultGroupAccount(
    networkSlug: NetworkSlug,
    walletId?: number,
    hdPath?: string
  ): Promise<IGroupAccount> {
    return _createDefaultGroupAccount({ networkSlug, walletId, hdPath });
  }

  async generateMnemonicPhrase(): Promise<string> {
    return bip39.generateMnemonic(128);
  }

  async deleteWallet(id: number): Promise<IWallet[]> {
    return keyringService.deleteWallet(id);
  }

  getAddresses(network: NetworkSlug): Promise<string[][]> {
    return Promise.resolve(getAddressesByWalletIndex({ network }));
  }

  getCurrentNetwork(): Promise<NetworkSlug> {
    return Promise.resolve(storageService.currentNetwork);
  }

  getNetworks(): string[] {
    return supportedNetworks.map((network) => network.slug);
  }

  private;
}

export default new WalletController();
