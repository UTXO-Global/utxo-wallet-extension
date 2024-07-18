import { shortAddress } from "@/shared/utils/transactions";
import CheckPassword from "@/ui/components/check-password";
import { useControllersState } from "@/ui/states/controllerState";
import {
  useGetCurrentNetwork,
  useGetCurrentWallet,
} from "@/ui/states/walletState";
import { t } from "i18next";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  ChevronDownIcon,
  DocumentDuplicateIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import cn from "classnames";
import { NETWORK_ICON } from "@/shared/networks";

const ShowPk = () => {
  const [unlocked, setUnlocked] = useState(false);
  const { accId } = useParams();
  const currentWallet = useGetCurrentWallet();
  const { keyringController } = useControllersState((v) => ({
    keyringController: v.keyringController,
  }));
  const [secrets, setSecrets] = useState<string[]>([]);
  const currentNetwork = useGetCurrentNetwork();

  const groupAccount = currentWallet.accounts[Number(accId)];
  const [selectedAddress, setSelectedAddress] = useState(
    groupAccount.accounts[0].address
  );
  const [isShow, setIsShow] = useState<boolean>(false);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    (async () => {
      const _secrets = [];
      for (let i = 0; i < groupAccount.accounts.length; i++) {
        const secret = await keyringController.exportAccount(
          groupAccount.accounts[i].hdPath,
          currentNetwork.slug
        );
        _secrets.push(secret);
      }
      setSecrets(_secrets);
    })();
  }, [setSecrets, keyringController, accId, currentWallet]);

  return (
    <div className="w-full h-full p-4 flex flex-col">
      {unlocked ? (
        <div className="h-full flex flex-col">
          {currentWallet.type === "root" && (
            <div className="grid gap-2">
              {groupAccount.accounts.map((z, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-grey-300 overflow-hidden"
                >
                  <div
                    className="p-4 flex justify-between items-center cursor-pointer"
                    onClick={() => {
                      setSelectedAddress(z.address);
                      setIsShow(false);
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={NETWORK_ICON[z.network]}
                        alt=""
                        className="w-[40px] h-[40px] rounded-full"
                      />
                      <div>
                        <p className="text-base text-primary font-medium">
                          {z.addressType.name}
                        </p>
                        <p className="text-[14px] leading-[18px] text-[#787575]">
                          {shortAddress(z.address, 9)}
                        </p>
                      </div>
                    </div>
                    <ChevronDownIcon className="w-4 h-4 text-[#A69C8C]" />
                  </div>
                  {selectedAddress === z.address ? (
                    <div className="relative">
                      <div
                        className={cn(
                          `px-4 py-2 border-grey-300 border-t flex justify-between items-center gap-3`,
                          {
                            "blur-sm": selectedAddress === z.address && !isShow,
                          }
                        )}
                      >
                        <div className="grid gap-1 flex-1">
                          <p className="text-[14px] leading-[140%] font-medium text-primary">
                            {t("export_private_key.wif_private_key")}
                          </p>
                          <p className="text-[#787575] text-xs break-all">
                            {secrets[i]}
                          </p>
                        </div>
                        <div
                          className="w-[40px] h-[40px] rounded-full cursor-pointer bg-[#EBECEC] flex justify-center items-center"
                          onClick={async () => {
                            await navigator.clipboard.writeText(secrets[i]);
                            toast.success(t("transaction_info.copied"));
                          }}
                        >
                          <DocumentDuplicateIcon className="w-4 h-4 text-[#ABA8A1]" />
                        </div>
                      </div>
                      {selectedAddress === z.address && !isShow ? (
                        <div className="absolute w-full h-full top-0 left-0 flex justify-center items-center z-[1]">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="40"
                            height="40"
                            viewBox="0 0 40 40"
                            fill="none"
                            className="w-[30px] h-[30px] cursor-pointer"
                            onClick={() => setIsShow(true)}
                          >
                            <path
                              d="M3.33366 8.78317L5.46699 6.6665L33.3337 34.5332L31.217 36.6665L26.0837 31.5332C24.167 32.1665 22.1337 32.4998 20.0003 32.4998C11.667 32.4998 4.55033 27.3165 1.66699 19.9998C2.81699 17.0665 4.65033 14.4832 6.98366 12.4332L3.33366 8.78317ZM20.0003 14.9998C21.3264 14.9998 22.5982 15.5266 23.5359 16.4643C24.4735 17.402 25.0003 18.6738 25.0003 19.9998C25.0012 20.5674 24.9054 21.1311 24.717 21.6665L18.3337 15.2832C18.8691 15.0948 19.4327 14.999 20.0003 14.9998ZM20.0003 7.49984C28.3337 7.49984 35.4503 12.6832 38.3337 19.9998C36.9726 23.4547 34.6613 26.4537 31.667 28.6498L29.3003 26.2665C31.6052 24.6722 33.4641 22.515 34.7003 19.9998C33.3531 17.2496 31.2612 14.9326 28.6626 13.3121C26.064 11.6916 23.0628 10.8328 20.0003 10.8332C18.1837 10.8332 16.4003 11.1332 14.7337 11.6665L12.167 9.1165C14.567 8.08317 17.217 7.49984 20.0003 7.49984ZM5.30033 19.9998C6.64757 22.7501 8.73942 25.0671 11.3381 26.6876C13.9367 28.308 16.9378 29.1669 20.0003 29.1665C21.1503 29.1665 22.2837 29.0498 23.3337 28.8165L19.5337 24.9998C18.3739 24.8755 17.2917 24.358 16.467 23.5332C15.6422 22.7085 15.1246 21.6262 15.0003 20.4665L9.33366 14.7832C7.68366 16.1998 6.30033 17.9665 5.30033 19.9998Z"
                              fill="#0D0D0D"
                            />
                          </svg>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <CheckPassword
          handler={() => {
            setUnlocked(true);
          }}
        />
      )}
    </div>
  );
};

export default ShowPk;
