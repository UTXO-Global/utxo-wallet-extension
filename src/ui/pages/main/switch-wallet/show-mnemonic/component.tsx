import { isBitcoinNetwork } from "@/shared/networks";
import CheckPassword from "@/ui/components/check-password";
import { useControllersState } from "@/ui/states/controllerState";
import { useGetCurrentNetwork, useWalletState } from "@/ui/states/walletState";
import * as tinysecp from "@bitcoinerlab/secp256k1";
import ECPairFactory from "@/packages/pair";
import { t } from "i18next";
import { useCallback, useState } from "react";
import { useParams } from "react-router-dom";
import cn from "classnames";
import toast from "react-hot-toast";

const ShowMnemonic = () => {
  const [unlocked, setUnlocked] = useState(false);
  const { walletId } = useParams();
  const { stateController } = useControllersState((v) => ({
    stateController: v.stateController,
  }));
  const [phrase, setPhrase] = useState("");
  const { wallets } = useWalletState((v) => ({ wallets: v.wallets }));
  const [walletType, setWalletType] = useState<"simple" | "root">("root");
  const [isShow, setIsShow] = useState<boolean>(false);
  const currentNetwork = useGetCurrentNetwork();

  const onLogin = useCallback(
    async (password: string) => {
      let _phrase = await stateController.getWalletPhrase(
        Number(walletId),
        password
      );
      if (_phrase && wallets[Number(walletId)].type === "simple") {
        if (isBitcoinNetwork(currentNetwork.network)) {
          const ECPair = ECPairFactory(tinysecp);
          const pair = ECPair.fromPrivateKey(Buffer.from(_phrase, "hex"), {
            network: currentNetwork.network,
          });
          _phrase = pair.toWIF();
        }
      }

      setPhrase(_phrase);
      setWalletType(wallets[Number(walletId)].type);
      setUnlocked(true);
    },
    [stateController, wallets, walletId]
  );

  if (!unlocked) {
    return (
      <div className="w-full h-full p-4 flex flex-col">
        <CheckPassword handler={onLogin} />
      </div>
    );
  }

  return (
    <div className="w-full h-full p-4 flex flex-col">
      <div className="h-full flex flex-col">
        {walletType === "root" ? (
          <div className="">
            <p className="text-[24px] leading-[140%] font-medium text-primary">
              {t("about_wallet.your_recovery_phrase")}
            </p>
            <p className="text-[14px] leading-[140%] text-[#787575]">
              {t("about_wallet.sub_title_recovery_phrase")}
            </p>
            <div className="relative rounded-lg overflow-hidden">
              <div
                className={cn(`grid grid-cols-3 text-sm gap-x-2 gap-y-6 mt-4`, {
                  "blur-sm": !isShow,
                })}
              >
                {phrase.split(" ").map((word, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center gap-2"
                  >
                    <span className="w-4 text-end text-[#A69C8C] text-[14px]">
                      {index + 1}
                    </span>{" "}
                    <p className="bg-[#F5F5F5] rounded flex justify-center w-full p-2 text-primary text-base leading-[140%]">
                      {word}
                    </p>
                  </div>
                ))}
              </div>
              {isShow ? null : (
                <div className="absolute w-full h-full top-0 left-0 flex flex-col justify-center items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="41"
                    height="40"
                    viewBox="0 0 41 40"
                    fill="none"
                    className="w-[40px] h-[40px] cursor-pointer"
                    onClick={() => setIsShow(true)}
                  >
                    <path
                      d="M3.83366 8.78341L5.96699 6.66675L33.8337 34.5334L31.717 36.6667L26.5837 31.5334C24.667 32.1667 22.6337 32.5001 20.5003 32.5001C12.167 32.5001 5.05033 27.3167 2.16699 20.0001C3.31699 17.0667 5.15033 14.4834 7.48366 12.4334L3.83366 8.78341ZM20.5003 15.0001C21.8264 15.0001 23.0982 15.5269 24.0359 16.4645C24.9735 17.4022 25.5003 18.674 25.5003 20.0001C25.5012 20.5677 25.4054 21.1313 25.217 21.6667L18.8337 15.2834C19.3691 15.0951 19.9327 14.9992 20.5003 15.0001ZM20.5003 7.50008C28.8337 7.50008 35.9503 12.6834 38.8337 20.0001C37.4726 23.455 35.1613 26.4539 32.167 28.6501L29.8003 26.2667C32.1052 24.6725 33.9641 22.5153 35.2003 20.0001C33.8531 17.2499 31.7612 14.9328 29.1626 13.3123C26.564 11.6919 23.5628 10.833 20.5003 10.8334C18.6837 10.8334 16.9003 11.1334 15.2337 11.6667L12.667 9.11675C15.067 8.08341 17.717 7.50008 20.5003 7.50008ZM5.80033 20.0001C7.14757 22.7503 9.23942 25.0674 11.8381 26.6878C14.4367 28.3083 17.4378 29.1671 20.5003 29.1667C21.6503 29.1667 22.7837 29.0501 23.8337 28.8167L20.0337 25.0001C18.8739 24.8758 17.7917 24.3582 16.967 23.5335C16.1422 22.7087 15.6246 21.6265 15.5003 20.4667L9.83366 14.7834C8.18366 16.2001 6.80033 17.9667 5.80033 20.0001Z"
                      fill="#0D0D0D"
                    />
                  </svg>
                  <p className="text-center mt-4 text-base text-primary">
                    {t("about_wallet.view_recovery_phrase")}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="w-full">
            <div className="break-all h-1/2 overflow-y-scroll bg-[#F5F5F5] text-primary rounded-lg p-2">
              {phrase}
            </div>
          </div>
        )}
        {isShow ? (
          <div className="flex w-full justify-center mt-10 gap-2">
            <div
              className="py-1 w-[80px] flex justify-center rounded-full bg-[#F5F5F5] transition-colors hover:bg-[#EBECEC] text-[14px] leading-[24px] text-[#787575] cursor-pointer"
              onClick={async () => {
                await navigator.clipboard.writeText(phrase);
                toast.success(t("transaction_info.copied"));
              }}
            >
              Copy
            </div>
            <div
              className="w-[80px] flex justify-center items-center py-1 rounded-full bg-[#F5F5F5] transition-colors hover:bg-[#EBECEC] text-[14px] leading-[24px] text-[#787575] cursor-pointer"
              onClick={async () => {
                setIsShow(false);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="17"
                height="16"
                viewBox="0 0 17 16"
                fill="none"
              >
                <path
                  d="M1.83268 3.51341L2.68602 2.66675L13.8327 13.8134L12.986 14.6667L10.9327 12.6134C10.166 12.8667 9.35268 13.0001 8.49935 13.0001C5.16602 13.0001 2.31935 10.9267 1.16602 8.00008C1.62602 6.82675 2.35935 5.79341 3.29268 4.97341L1.83268 3.51341ZM8.49935 6.00008C9.02978 6.00008 9.53849 6.21079 9.91356 6.58587C10.2886 6.96094 10.4993 7.46965 10.4993 8.00008C10.4997 8.22713 10.4614 8.45257 10.386 8.66675L7.83268 6.11341C8.04686 6.03807 8.2723 5.99974 8.49935 6.00008ZM8.49935 3.00008C11.8327 3.00008 14.6793 5.07341 15.8327 8.00008C15.2883 9.38204 14.3637 10.5816 13.166 11.4601L12.2193 10.5067C13.1413 9.86905 13.8849 9.00615 14.3793 8.00008C13.8405 6.89999 13.0037 5.97317 11.9643 5.32498C10.9248 4.6768 9.72434 4.33326 8.49935 4.33341C7.77268 4.33341 7.05935 4.45341 6.39268 4.66675L5.36602 3.64675C6.32602 3.23341 7.38602 3.00008 8.49935 3.00008ZM2.61935 8.00008C3.15825 9.10017 3.99499 10.027 5.03444 10.6752C6.07389 11.3234 7.27436 11.6669 8.49935 11.6667C8.95935 11.6667 9.41268 11.6201 9.83268 11.5267L8.31268 10.0001C7.84879 9.95036 7.4159 9.74333 7.086 9.41343C6.7561 9.08353 6.54907 8.65064 6.49935 8.18675L4.23268 5.91341C3.57268 6.48008 3.01935 7.18675 2.61935 8.00008Z"
                  fill="#A69C8C"
                />
              </svg>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ShowMnemonic;
