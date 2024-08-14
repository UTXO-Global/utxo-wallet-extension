import { useCreateNewWallet } from "@/ui/hooks/wallet";
import { useAppState } from "@/ui/states/appState";
import { useControllersState } from "@/ui/states/controllerState";
import { useWalletState } from "@/ui/states/walletState";
import cn from "classnames";
import { t } from "i18next";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import s from "./styles.module.scss";
import ReactLoading from "react-loading";

const ConfirmMnemonic = () => {
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const { updateWalletState } = useWalletState((v) => ({
    updateWalletState: v.updateWalletState,
  }));
  const { updateAppState } = useAppState((v) => ({
    updateAppState: v.updateAppState,
  }));
  const { walletController, stateController } = useControllersState((v) => ({
    walletController: v.walletController,
    stateController: v.stateController,
  }));
  const [mnemonicPhrase, setMnemonicPhrase] = useState<string[]>([]);
  const [mnemonicPhaseConfirm, setMNemonicPhaseConfirm] = useState<string[]>(
    []
  );

  const createNewWallet = useCreateNewWallet();

  const init = useCallback(async () => {
    const mnemonic = await stateController.getPendingWallet();
    setMnemonicPhrase(mnemonic.split(" ").sort(() => Math.random() - 0.5));
  }, [stateController]);

  useEffect(() => {
    if (mnemonicPhrase.length > 0) return;
    // eslint-disable-next-line
    init();
  }, [mnemonicPhrase, init]);

  const navigate = useNavigate();

  const onCreate = async () => {
    if (!mnemonicPhrase) {
      toast.error(t("new_wallet.new_mnemonic.error_phrase_blank"));
      return;
    }

    const mnemonic = await stateController.getPendingWallet();
    if (mnemonicPhaseConfirm.join(" ") !== mnemonic) {
      toast.error(
        t("Mnemonic confirmation does not match. Please check and try again")
      );
      return;
    }
    setLoading(true);
    await createNewWallet({
      payload: mnemonicPhaseConfirm.join(" "),
      walletType: "root",
    });
    await updateWalletState({ vaultIsEmpty: false });
    await stateController.clearPendingWallet();
    setLoading(false);
    navigate("/home");
  };

  if (!mnemonicPhrase || loading) {
    return <ReactLoading type="spin" color="#ODODOD" />;
  }

  return (
    <div className="w-full h-full flex flex-col items-center gap-4 standard:gap-8 text-base p-4">
      <div
        className={cn(
          "h-full flex flex-col justify-between w-full",
          "justify-between"
        )}
      >
        <div>
          <p className="w-full flex justify-center text-[#FF4545] mb-5 text-sm text-center">
            {t("components.layout.mnemonic_confirm_desc")}
          </p>
          <div className="grid grid-cols-3 text-sm gap-x-2 gap-y-4 mt-4">
            {Array(12)
              .fill("-")
              .map((_, index) => (
                <div
                  key={`cofirm-${index}`}
                  className="flex justify-between items-center gap-2"
                >
                  <span className="w-4 text-end text-[#A69C8C] text-[14px]">
                    {index + 1}.
                  </span>
                  <p className="bg-[#F5F5F5] rounded flex justify-center w-full p-2 text-primary text-base leading-[140%]">
                    {mnemonicPhaseConfirm && mnemonicPhaseConfirm[index]
                      ? mnemonicPhaseConfirm[index]
                      : "-"}
                  </p>
                </div>
              ))}
          </div>
        </div>

        <div
          onClick={() => setMNemonicPhaseConfirm([])}
          className="flex gap-2 p-1 border border-[#F5F5F5] w-[80px] rounded cursor-pointer hover:bg-primary hover:text-white"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="w-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m6 4.125 2.25 2.25m0 0 2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
            />
          </svg>
          Clear
        </div>
        <div className="flex flex-wrap gap-2 ">
          {mnemonicPhrase.map((word, index) => (
            <div
              key={`mnemonic-${index}`}
              className={cn(
                "bg-[#F5F5F5] rounded p-2 text-primary text-base leading-[140%] cursor-pointer",
                {
                  "!text-[#A69C8C] line-through":
                    mnemonicPhaseConfirm.includes(word),
                }
              )}
              onClick={() => {
                if (mnemonicPhaseConfirm.includes(word)) return;
                setMNemonicPhaseConfirm((prevState) => {
                  if (!prevState.includes(word)) {
                    return [...prevState, word];
                  }
                });
              }}
            >
              {word}
            </div>
          ))}
        </div>

        <div className={s.continueWrapper}>
          <button
            className="btn primary w-full"
            onClick={onCreate}
            disabled={mnemonicPhaseConfirm.length !== mnemonicPhrase.length}
          >
            {t("new_wallet.continue")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmMnemonic;
