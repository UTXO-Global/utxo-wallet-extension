import type {
  IGroupAccount,
  INewWalletProps,
  IWallet,
} from "@/shared/interfaces";
import { NetworkSlug } from "@/shared/networks/types";
import { t } from "i18next";
import { useCallback } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useControllersState } from "../states/controllerState";
import {
  useGetCurrentAccount,
  useGetCurrentNetwork,
  useGetCurrentWallet,
  useWalletState,
} from "../states/walletState";
import { useTransactionManagerContext } from "../utils/tx-ctx";

export const useCreateNewWallet = () => {
  const { wallets, updateWalletState } = useWalletState((v) => ({
    wallets: v.wallets,
    updateWalletState: v.updateWalletState,
  }));
  const { walletController, keyringController } = useControllersState((v) => ({
    walletController: v.walletController,
    keyringController: v.keyringController,
  }));
  const { trottledUpdate, resetTransactions } = useTransactionManagerContext();

  return useCallback(
    async (props: INewWalletProps) => {
      const wallet = await walletController.createNewWallet(props);
      await updateWalletState({
        selectedAccount: 0,
        selectedWallet: wallet.id,
        wallets: [...wallets, wallet],
      });
      const keyring = await keyringController.serializeKeyringById(wallet.id);
      await walletController.saveWallets([
        { id: wallet.id, phrase: props.payload, data: keyring },
      ]);
      trottledUpdate(true);
      resetTransactions();
    },
    [
      wallets,
      updateWalletState,
      walletController,
      keyringController,
      trottledUpdate,
      resetTransactions,
    ]
  );
};

export const useUpdateCurrentWallet = () => {
  const { updateWalletState, selectedWallet, wallets } = useWalletState(
    (v) => ({
      updateWalletState: v.updateWalletState,
      selectedWallet: v.selectedWallet,
      wallets: v.wallets,
    })
  );

  return useCallback(
    async (wallet: Partial<IWallet>) => {
      wallets[selectedWallet] = { ...wallets[selectedWallet], ...wallet };
      await updateWalletState({
        wallets: [...wallets],
      });
    },
    [updateWalletState, selectedWallet, wallets]
  );
};

export const useCreateNewGroupAccount = () => {
  const { updateWalletState } = useWalletState((v) => ({
    updateWalletState: v.updateWalletState,
  }));
  const updateCurrentWallet = useUpdateCurrentWallet();
  const currentWallet = useGetCurrentWallet();
  const { walletController } = useControllersState((v) => ({
    walletController: v.walletController,
  }));
  const { trottledUpdate, resetTransactions } = useTransactionManagerContext();
  const currentNetwork = useGetCurrentNetwork();

  return useCallback(
    async (name?: string) => {
      if (!currentWallet) return;
      const createdAccount = await walletController.createNewGroupAccount(
        currentNetwork.slug,
        name,
        currentWallet.id
      );
      const updatedWallet: IWallet = {
        ...currentWallet,
        accounts: [...currentWallet.accounts, createdAccount].map((f, i) => ({
          ...f,
          id: i,
        })),
      };

      await updateCurrentWallet(updatedWallet);
      await walletController.saveWallets();
      await updateWalletState({
        selectedAccount:
          updatedWallet.accounts[updatedWallet.accounts.length - 1].id,
      });
      trottledUpdate(true);
      resetTransactions();
    },
    [
      currentWallet,
      updateCurrentWallet,
      walletController,
      updateWalletState,
      trottledUpdate,
      resetTransactions,
    ]
  );
};

export const useSwitchWallet = () => {
  const { wallets, updateWalletState } = useWalletState((v) => ({
    wallets: v.wallets,
    updateWalletState: v.updateWalletState,
  }));
  const { walletController, notificationController } = useControllersState(
    (v) => ({
      walletController: v.walletController,
      notificationController: v.notificationController,
    })
  );
  const { trottledUpdate, resetTransactions } = useTransactionManagerContext();
  const network = useGetCurrentNetwork();

  return useCallback(
    async (key: number, accKey?: number) => {
      const wallet = wallets.find((f) => f.id === key);
      if (!wallet) return;
      if (
        wallet.accounts &&
        wallet.accounts[0] &&
        !wallet.accounts[0].accounts[0].address
      ) {
        wallet.accounts = await walletController.loadAccountsData(
          wallet.id,
          wallet.accounts
        );
      }

      const networkGroupAccounts = wallet.accounts.filter(
        (account) => account.network === network.slug
      );
      if (networkGroupAccounts.length === 0) {
        // this wallet doesn't have any account match with this network
        // need initialize
        const networkGroupAccount =
          await walletController.createDefaultGroupAccount(
            network.slug,
            wallet.id
          );
        accKey = wallet.accounts.length;
        wallet.accounts = [...wallet.accounts, networkGroupAccount].map(
          (f, i) => ({
            ...f,
            id: i,
          })
        );
      }

      await updateWalletState({
        selectedWallet: wallet.id,
        wallets: wallets.with(key, wallet),
        selectedAccount: accKey ?? networkGroupAccounts[0].id,
      });
      await notificationController.changedAccount();
      resetTransactions();
      trottledUpdate(true);
    },
    [
      wallets,
      updateWalletState,
      walletController,
      notificationController,
      trottledUpdate,
      resetTransactions,
    ]
  );
};

export const useSwitchAccount = () => {
  const { updateWalletState } = useWalletState((v) => ({
    updateWalletState: v.updateWalletState,
  }));
  const navigate = useNavigate();
  const { notificationController } = useControllersState((v) => ({
    notificationController: v.notificationController,
  }));
  const { trottledUpdate, resetTransactions } = useTransactionManagerContext();
  const { setCurrentPage } = useTransactionManagerContext();

  return useCallback(
    async (id: number) => {
      await updateWalletState({
        selectedAccount: id,
      });

      navigate("/home");
      await notificationController.changedAccount();
      trottledUpdate(true);
      resetTransactions();
      setCurrentPage(1);
    },
    [
      updateWalletState,
      navigate,
      notificationController,
      trottledUpdate,
      resetTransactions,
      setCurrentPage,
    ]
  );
};

export const useUpdateCurrentAccountBalance = () => {
  const { apiController } = useControllersState((v) => ({
    apiController: v.apiController,
  }));
  const currentAccount = useGetCurrentAccount();
  const currentNetwork = useGetCurrentNetwork();

  const { updateWalletState, wallets, selectedAccount, selectedWallet } =
    useWalletState((v) => ({
      updateWalletState: v.updateWalletState,
      wallets: v.wallets,
      selectedAccount: v.selectedAccount,
      selectedWallet: v.selectedWallet,
    }));

  const updateCurrentAccount = useCallback(
    async (account: Partial<IGroupAccount>) => {
      if (!wallets[selectedWallet]) return;
      wallets[selectedWallet].accounts[selectedAccount] = {
        ...wallets[selectedWallet].accounts[selectedAccount],
        ...account,
      };

      await updateWalletState({
        wallets: [...wallets],
      });
    },
    [updateWalletState, selectedAccount, selectedWallet, wallets]
  );

  return useCallback(
    async (address?: string) => {
      let groupCardinalAccountBalance = 0;
      let groupOrdinalAccountBalance = 0;
      for (const account of currentAccount.accounts) {
        const balance = await apiController.getAccountBalance(
          address ? address : account?.address ?? ""
        );
        if (balance !== undefined) {
          groupCardinalAccountBalance += balance.cardinalBalance;
          groupOrdinalAccountBalance += balance.ordinalBalance;
        }
      }

      await updateCurrentAccount({
        balance: groupCardinalAccountBalance / 10 ** currentNetwork.decimal,
        ordinalBalance:
          groupOrdinalAccountBalance / 10 ** currentNetwork.decimal,
      });
    },
    [
      updateCurrentAccount,
      currentNetwork.decimal,
      currentAccount,
      apiController,
    ]
  );
};

export const useDeleteWallet = () => {
  const { walletController } = useControllersState((v) => ({
    walletController: v.walletController,
  }));
  const { updateWalletState } = useWalletState((v) => ({
    updateWalletState: v.updateWalletState,
  }));
  const currentWallet = useGetCurrentWallet();
  const currentAccount = useGetCurrentAccount();
  const { wallets } = useWalletState((v) => ({ wallets: v.wallets }));
  const switchWallet = useSwitchWallet();

  return useCallback(
    async (id: number) => {
      if (wallets.length === 1) {
        toast.error(t("hooks.wallet.last_wallet_error"));
        return;
      }
      if (currentWallet?.id === undefined) throw new Error("Unreachable");
      const newWalletId =
        currentWallet.id > id ? currentWallet.id - 1 : currentWallet.id;
      await switchWallet(
        id === currentWallet.id ? 0 : newWalletId,
        id === currentWallet.id ? 0 : currentAccount?.id ?? 0
      );
      await updateWalletState({
        wallets: await walletController.deleteWallet(id),
      });
    },
    [
      currentWallet,
      walletController,
      updateWalletState,
      wallets.length,
      switchWallet,
      currentAccount?.id,
    ]
  );
};

export const useSwitchNetwork = () => {
  const { updateWalletState, wallets } = useWalletState((v) => ({
    updateWalletState: v.updateWalletState,
    wallets: v.wallets,
  }));
  const { notificationController, walletController } = useControllersState(
    (v) => ({
      notificationController: v.notificationController,
      walletController: v.walletController,
    })
  );
  const { trottledUpdate, resetTransactions } = useTransactionManagerContext();
  const { setCurrentPage } = useTransactionManagerContext();
  const currentAccount = useGetCurrentAccount();
  const currentWallet = useGetCurrentWallet();

  return useCallback(
    async (slug: NetworkSlug) => {
      const _wallets: IWallet[] = [];
      let selectedAccount = currentAccount.id;

      for (const wallet of wallets) {
        if (wallet.id !== currentWallet.id) {
          _wallets.push(wallet);
          continue;
        }

        const networkGroupAccounts: IGroupAccount[] = wallet.accounts.filter(
          (account) => slug === account.network
        );

        if (networkGroupAccounts.length === 0) {
          // this wallet doesn't have any account match with this network
          // need initialize
          const networkGroupAccount =
            await walletController.createDefaultGroupAccount(slug, wallet.id);
          if (wallet.id === currentWallet.id) {
            selectedAccount = wallet.accounts.length;
          }
          wallet.accounts = [...wallet.accounts, networkGroupAccount].map(
            (f, i) => ({
              ...f,
              id: i,
            })
          );
        } else if (wallet.id === currentWallet.id) {
          if (
            !networkGroupAccounts.map((c) => c.id).includes(selectedAccount)
          ) {
            selectedAccount = networkGroupAccounts[0].id;
          }
        }

        _wallets.push({
          ...wallet,
        });
      }

      await updateWalletState({
        selectedNetwork: slug,
        selectedAccount,
        wallets: _wallets,
      });

      await notificationController.changedAccount();

      trottledUpdate(true);
      resetTransactions();
      setCurrentPage(1);
    },
    [
      updateWalletState,
      notificationController,
      trottledUpdate,
      resetTransactions,
      setCurrentPage,
    ]
  );
};
