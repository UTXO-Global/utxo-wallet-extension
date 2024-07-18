import type { IWallet } from "@/shared/interfaces";
import { ChainAddressType, NetworkSlug } from "@/shared/networks/types";
import type { ConnectedSite } from "../permission";

interface StorageGroupAccountItem {
  id: number;
  name: string;
  accounts: StorageAccountItem[];
  network: NetworkSlug;
}

interface StorageAccountItem {
  addressType: ChainAddressType;
  hdPath: string;
  network: NetworkSlug;
}

interface StorageWalletItem extends Omit<IWallet, "accounts" | "id"> {
  accounts: StorageGroupAccountItem[];
}

export type DecryptedSecrets = { id: number; data: any; phrase?: string }[];

export interface StorageInterface {
  enc: Record<"data" | "iv" | "salt", string>;
  cache: {
    wallets: StorageWalletItem[];
    addressBook: string[];
    selectedWallet?: number;
    selectedAccount?: number;
    selectedNetwork?: NetworkSlug;
    pendingWallet?: string;
    connectedSites: ConnectedSite[];
    language?: string;
  };
}
