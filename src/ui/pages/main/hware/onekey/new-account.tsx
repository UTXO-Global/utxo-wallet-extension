import s from "../../wallet/styles.module.scss";
import { IcnSend } from "@/ui/components/icons";
import cn from "classnames";
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
import { useCallback, useEffect, useState } from "react";
import { getAddress } from "@/background/services/keyring/ckbhdw/hd/utils";
import Loading from "react-loading";
import toast from "react-hot-toast";
import Modal from "@/ui/components/modal";
import { browserTabsCreate } from "@/shared/utils/browser";
import { CKB_NEURON_HD_PATH } from "@/shared/networks/ckb";

const { HardwareWebSdk: HardwareSDK } = HdWebSdk;

const NewOneKeyAccount = () => {
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

  // useEffect(() => {
  //   HardwareSDK.on(UI_EVENT, (message: CoreMessage) => {
  //     // Handle the PIN code input event
  //     if (message.type === UI_REQUEST.REQUEST_PIN) {
  //       // Enter the PIN code on the device
  //       HardwareSDK.uiResponse({
  //         type: UI_RESPONSE.RECEIVE_PIN,
  //         payload: "@@ONEKEY_INPUT_PIN_IN_DEVICE",
  //       });
  //     }

  //     // Handle the passphrase event
  //     if (message.type === UI_REQUEST.REQUEST_PASSPHRASE) {
  //       // Enter the passphrase on the device
  //       HardwareSDK.uiResponse({
  //         type: UI_RESPONSE.RECEIVE_PASSPHRASE,
  //         payload: {
  //           value: "",
  //           passphraseOnDevice: true,
  //           save: false,
  //         },
  //       });
  //     }

  //     if (message.type === UI_REQUEST.REQUEST_BUTTON) {
  //       // Confirmation is required on the device, a UI prompt can be displayed
  //     }
  //   });
  // });

  const importAccount = useCallback(async () => {
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
      const accName = `Account ${currentWallet.accounts.length}`;

      const createdGAccount: IGroupAccount = {
        id: currentWallet.accounts[0]
          ? currentWallet.accounts[currentWallet.accounts.length].id + 1
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

        const addressRes = await HardwareSDK.nervosGetAddress(
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

        const publicKeyRes = await HardwareSDK.btcGetPublicKey(
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
              };
            }
          );
        } else {
          errorHandler(publicKeyRes);
        }
      }

      const updatedWallet: IWallet = {
        ...currentWallet,
        accounts: [...currentWallet.accounts, createdGAccount].map((f, i) => ({
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
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  }, [currentNetwork, currentWallet]);

  return (
    <div className={`${s.accPanel} px-4`}>
      <div className={cn(`grid gap-2 !mt-6 pb-2`)}>
        <div
          className={cn(
            `py-3 px-4 flex gap-1 flex-col cursor-pointer justify-center items-center transition-all bg-grey-300 hover:bg-grey-200 rounded-[10px]`
          )}
          onClick={importAccount}
        >
          {loading ? (
            <>
              <Loading color="#ODODOD" />
              <p>Loading account information from OneKey device</p>
            </>
          ) : (
            <>
              <IcnSend />
              <p className="text-base font-medium">Import OneKey account</p>
            </>
          )}
        </div>
      </div>

      <Modal
        onClose={() => {}}
        open={openUpgradeModal}
        title={"Upgrade Firmware Required"}
      >
        <div className="text-base text-primary px-4 flex flex-col items-center">
          <div className="text-sm">
            Device firmware version is too low. Please upgrade the latest
            firmware
          </div>
        </div>
        <div className="flex justify-center gap-4 mt-3">
          <button
            className="btn w-full secondary"
            onClick={() =>
              browserTabsCreate({
                url: "https://firmware.onekey.so/",
              })
            }
          >
            Upgrade Now
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default NewOneKeyAccount;
