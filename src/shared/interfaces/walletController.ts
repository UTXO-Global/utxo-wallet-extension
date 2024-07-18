import type { DecryptedSecrets } from "@/background/services/storage/types";
import { NetworkSlug } from "../networks/types";
import type { IGroupAccount } from "./accounts";
import type { INewWalletProps, IPrivateWallet, IWallet } from "./wallets";

export interface IWalletController {
  // wallet
  createNewWallet(props: INewWalletProps): Promise<IWallet>;
  saveWallets(phrases?: DecryptedSecrets, newPassword?: string): Promise<void>;
  isVaultEmpty(): Promise<boolean>;
  importWallets(password: string): Promise<Omit<IPrivateWallet, "data">[]>;
  generateMnemonicPhrase(): Promise<string>;
  deleteWallet(id: number): Promise<IWallet[]>;
  loadAccountsData(
    walletId: number,
    accounts: IGroupAccount[]
  ): Promise<IGroupAccount[]>;
  createNewGroupAccount(
    networkSlug: NetworkSlug,
    name?: string,
    walletId?: number
  ): Promise<IGroupAccount>;
  createDefaultGroupAccount(
    network: NetworkSlug,
    walletId?: number
  ): Promise<IGroupAccount>;
  getAddresses(network: NetworkSlug): Promise<string[][]>;
  getCurrentNetwork(): Promise<NetworkSlug>;
  getNetworks(): string[];
}
