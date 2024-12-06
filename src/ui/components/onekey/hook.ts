import HdWebSdk from "@onekeyfe/hd-web-sdk";
import {
  useGetCurrentNetwork,
  useGetCurrentWallet,
  useWalletState,
} from "@/ui/states/walletState";
import { BTCPublicKey } from "@onekeyfe/hd-core";

import { useControllersState } from "@/ui/states/controllerState";
import { HDOneKeyOptions } from "@/background/services/keyring/ckbhdw/hd/types";
import { isBitcoinNetwork, isCkbNetwork } from "@/shared/networks";
import {
  getNewGAccountIndex,
  getNewHdPathFromAddressType,
} from "@/background/controllers/walletController";
import { IAccount, IGroupAccount, IWallet } from "@/shared/interfaces";
import { useUpdateCurrentWallet } from "@/ui/hooks/wallet";
import { useTransactionManagerContext } from "@/ui/utils/tx-ctx";
import { useCallback, useState } from "react";
import { getAddress } from "@/background/services/keyring/ckbhdw/hd/utils";
import { CKB_NEURON_HD_PATH } from "@/shared/networks/ckb";
import toast from "react-hot-toast";

export function useOnekeyNewAccount() {
  const onekeySdk = useOneKey();
  const { keyringController, walletController } = useControllersState((v) => ({
    keyringController: v.keyringController,
    walletController: v.walletController,
  }));
  const currentNetwork = useGetCurrentNetwork();
  const currentWallet = useGetCurrentWallet();
  const updateCurrentWallet = useUpdateCurrentWallet();
  const { trottledUpdate, resetTransactions } = useTransactionManagerContext();
  const { updateWalletState } = useWalletState((v) => ({
    updateWalletState: v.updateWalletState,
  }));
  const [loading, setLoading] = useState(false);
  const [openUpgradeModal, setOpenUpgradeModal] = useState(false);

  const errorHandler = useCallback((res: any) => {
    if (res?.payload?.error) {
      if (
        res.payload.error.startsWith("Device firmware version is too low") ||
        res.payload.error.includes("nervosGetAddress is not set")
      ) {
        setOpenUpgradeModal(true);
      } else {
        toast.error(res?.payload?.error);
      }
      throw new Error(res?.payload?.error);
    }
    throw new Error(JSON.stringify(res));
  }, []);

  const importAccount = useCallback(
    async (name?: string, onSuccess?: () => void) => {
      if (loading) {
        return;
      }
      try {
        setLoading(true);
        const { connectId, deviceId }: HDOneKeyOptions = JSON.parse(
          await keyringController.exportPublicKey("")
        );
        const newGAccountIndex = getNewGAccountIndex(
          currentWallet.accounts,
          currentNetwork.slug
        );
        const accName = name ?? `Account ${currentWallet.accounts.length}`;

        const createdGAccount: IGroupAccount = {
          id: currentWallet.accounts[0]
            ? currentWallet.accounts[currentWallet.accounts.length - 1].id + 1
            : 0,
          accounts: [],
          network: currentNetwork.slug,
          name: accName,
        };

        if (isCkbNetwork(currentNetwork.network)) {
          const id = 0;
          const addressType = currentNetwork.addressTypes[id];
          // Workaround: Incorrect hdpath from the network config Should be m/44'/309'/0'/0/0 instead of m/13'/0'/0'/0
          // const path = getNewHdPathFromAddressType(ckbPath, newGAccountIndex);
          const path = getNewHdPathFromAddressType(
            CKB_NEURON_HD_PATH,
            newGAccountIndex
          );

          const addressRes = await onekeySdk.nervosGetAddress(
            connectId,
            deviceId,
            {
              path,
              showOnOneKey: false,
              network: currentNetwork.slug === "nervos" ? "ckb" : "ckt",
            }
          );

          if (addressRes.success) {
            const account: IAccount = {
              addressType,
              network: currentNetwork.slug,
              address: addressRes.payload.address,
              hdPath: path,
            };
            createdGAccount.accounts.push(account);
          } else {
            errorHandler(addressRes);
          }
        } else if (isBitcoinNetwork(currentNetwork.network)) {
          // Legacy
          // Import all address types
          const publicKeyReqBatch = currentNetwork.addressTypes.map(
            (addressType) => {
              const path = getNewHdPathFromAddressType(
                addressType.hdPath,
                newGAccountIndex
              );
              return {
                path,
                showOnOneKey: false,
              };
            }
          );

          const publicKeyRes = await onekeySdk.btcGetPublicKey(
            connectId,
            deviceId,
            {
              bundle: publicKeyReqBatch,
            }
          );

          if (publicKeyRes.success) {
            createdGAccount.accounts = publicKeyRes.payload.map(
              (res: BTCPublicKey, index: number) => {
                const addressType = currentNetwork.addressTypes[index];
                const address = getAddress(
                  addressType.value,
                  new Uint8Array(Buffer.from(res.node.public_key, "hex")),
                  currentNetwork.slug
                );
                return {
                  addressType,
                  network: currentNetwork.slug,
                  address,
                  hdPath: res.path,
                  publicKey: res.node.public_key,
                } as IAccount;
              }
            );
          } else {
            errorHandler(publicKeyRes);
          }
        }

        const updatedWallet: IWallet = {
          ...currentWallet,
          accounts: [...currentWallet.accounts, createdGAccount].map(
            (f, i) => ({
              ...f,
              id: i,
            })
          ),
        };

        await updateCurrentWallet(updatedWallet);
        await walletController.saveWallets();
        await updateWalletState({
          selectedAccount:
            updatedWallet.accounts[updatedWallet.accounts.length - 1].id,
        });
        trottledUpdate(true);
        resetTransactions();
        onSuccess();
      } catch (error) {
        console.error(error);
      }
      setLoading(false);
    },
    [currentNetwork, currentWallet]
  );

  return { importAccount, loading, openUpgradeModal };
}

export function useOneKey() {
  const { HardwareWebSdk: HardwareSDK } = HdWebSdk;

  return HardwareSDK;
}
