import type { IWalletState } from "@/shared/interfaces";
import { getNetworkDataBySlug } from "@/shared/networks";
import { useMemo } from "react";
import { create } from "zustand";
import { useSwitchWallet } from "../hooks/wallet";
import { setupStateProxy } from "../utils/setup";

const proxy = setupStateProxy();

export const useWalletState = create<IWalletState>()((set) => ({
  wallets: [],
  vaultIsEmpty: true,
  selectedAccount: undefined,
  selectedWallet: undefined,
  selectedNetwork: undefined,

  updateWalletState: async (
    state: Partial<IWalletState>,
    updateBack = true
  ) => {
    if (updateBack) {
      await proxy.updateWalletState(state);
    }
    set(state);
  },
}));

export const useGetCurrentAccount = () => {
  const { selectedAccount, selectedWallet, wallets } = useWalletState((v) => ({
    selectedWallet: v.selectedWallet,
    selectedAccount: v.selectedAccount,
    wallets: v.wallets,
  }));
  return useMemo(() => {
    if (selectedWallet === undefined || selectedAccount === undefined)
      return undefined;
    return wallets[selectedWallet]?.accounts[selectedAccount];
  }, [selectedAccount, selectedWallet, wallets]);
};

export const useGetCurrentWallet = () => {
  const { selectedWallet, wallets } = useWalletState((v) => ({
    selectedWallet: v.selectedWallet,
    wallets: v.wallets,
  }));

  const currentWallet = useMemo(() => {
    if (selectedWallet === undefined) return undefined;
    return wallets[selectedWallet];
  }, [selectedWallet, wallets]);

  if (
    currentWallet &&
    currentWallet.accounts &&
    !currentWallet.accounts[0].accounts[0].address
  ) {
    const switchWallet = useSwitchWallet();
    switchWallet(currentWallet.id);
  }

  return currentWallet;
};

export const useGetCurrentNetwork = () => {
  const { selectedNetwork } = useWalletState((v) => ({
    selectedNetwork: v.selectedNetwork,
  }));

  return useMemo(() => {
    const networkData = getNetworkDataBySlug(selectedNetwork);
    return networkData;
  }, [selectedNetwork]);
};
