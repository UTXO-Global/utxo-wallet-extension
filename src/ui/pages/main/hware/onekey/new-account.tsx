import s from "../../wallet/styles.module.scss";
import { IcnSend } from "@/ui/components/icons";
import cn from "classnames";
import HdWebSdk from "@onekeyfe/hd-web-sdk";
import {
  useGetCurrentAccount,
  useGetCurrentNetwork,
  useGetCurrentWallet,
} from "@/ui/states/walletState";
import { useControllersState } from "@/ui/states/controllerState";
import { HDOneKeyOptions } from "@/background/services/keyring/ckbhdw/hd/types";
import {
  getNetworkChainSlug,
  isBitcoinNetwork,
  isCkbNetwork,
} from "@/shared/networks";
import {
  getNewGAccountIndex,
  getNewHdPathFromAddressType,
} from "@/background/controllers/walletController";
import { BTC_LIVENET_ADDRESS_TYPES } from "@/shared/networks/btc";
import { IAccount, IWallet } from "@/shared/interfaces";
import { getAddress } from "@/background/services/keyring/ckbhdw/hd/utils";

const { HardwareWebSdk: HardwareSDK } = HdWebSdk;

const NewOneKeyAccount = () => {
  const { keyringController } = useControllersState((v) => ({
    keyringController: v.keyringController,
  }));
  const currentNetwork = useGetCurrentNetwork();
  const currentAccount = useGetCurrentAccount();
  const currentWallet = useGetCurrentWallet();

  const importAccount = async () => {
    const { connectId, deviceId }: HDOneKeyOptions = JSON.parse(
      await keyringController.exportPublicKey("")
    );
    const newGAccountIndex = getNewGAccountIndex(
      currentWallet.accounts,
      currentNetwork.slug
    );
    const accName = `Account ${currentWallet.accounts.length}`;

    let createdAccount = null;

    if (isCkbNetwork(currentNetwork.network)) {
      const id = 0;
      const addressType = currentNetwork.addressTypes[id];
      const ckbPath = addressType.hdPath;
      const path = getNewHdPathFromAddressType(ckbPath, newGAccountIndex);

      const addressRes = await HardwareSDK.nervosGetAddress(
        connectId,
        deviceId,
        {
          path,
          network: "ckb",
        }
      );
      if (addressRes.success) {
        const account: IAccount = {
          addressType,
          network: currentNetwork.slug,
          address: addressRes.payload.address,
          hdPath: path,
        };
        createdAccount = {
          id: currentWallet.accounts[currentWallet.accounts.length - 1].id + 1,
          accounts: [account],
          network: currentNetwork.slug,
          name: accName,
        };
      }
    } else if (isBitcoinNetwork(currentNetwork.network)) {
      // Legacy
      // TODO: import all address types
      const addressType = currentNetwork.addressTypes[0];
      const legacyPath = currentNetwork.addressTypes[0].hdPath;
      const path = getNewHdPathFromAddressType(legacyPath, newGAccountIndex);

      const addressRes = await HardwareSDK.btcGetAddress(connectId, deviceId, {
        path,
      });

      if (addressRes.success) {
        const account: IAccount = {
          addressType,
          network: currentNetwork.slug,
          address: addressRes.payload.address,
          hdPath: path,
        };
        createdAccount = {
          id: currentWallet.accounts[currentWallet.accounts.length - 1].id + 1,
          accounts: [account],
          network: currentNetwork.slug,
          name: accName,
        };
      }
    }

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
  };

  return (
    <div className={`${s.accPanel} px-4`}>
      <div className={cn(`grid gap-2 !mt-6 pb-2`)}>
        <div
          className={cn(
            `py-3 px-4 flex gap-1 flex-col cursor-pointer justify-center items-center transition-all bg-grey-300 hover:bg-grey-200 rounded-[10px]`
          )}
          onClick={importAccount}
        >
          <IcnSend />
          <p className="text-base font-medium">Import OneKey account</p>
        </div>
      </div>
    </div>
  );
};

export default NewOneKeyAccount;
