import { NetworkSlug } from "../networks/types";
import { IGroupAccount } from "./accounts";

export interface IWallet {
  id: number;
  accounts: IGroupAccount[];
  name: string;
  type: "simple" | "root";
  restoreFromWallet?: "utxoGlobal" | "neuron" | "unisat" | "others";
}

export interface IPrivateWallet extends IWallet {
  data: any;
  phrase?: string;
}

export interface IWalletStateBase {
  wallets: IWallet[];
  vaultIsEmpty: boolean;
  selectedWallet?: number;
  selectedAccount?: number;
  selectedNetwork?: NetworkSlug;
}

export interface IWalletState extends IWalletStateBase {
  updateWalletState: (
    state: Partial<IWalletState>,
    updateBack?: boolean
  ) => Promise<void>;
}

export interface INewWalletProps {
  payload: string;
  walletType: "simple" | "root";
  name?: string;
  walletName?: string;
  restoreFrom?: "wif" | "hex";
  hdPath?: string;
  passphrase?: string;
  restoreFromWallet?: "utxoGlobal" | "neuron" | "unisat" | "others";
}
