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

const convertToAsterisks = (word: string) => {
  return '*'.repeat(word.length)
}

const ConfirmMnemonic = () => {
  const [loading, setLoading] = useState(false);
  const { updateWalletState } = useWalletState((v) => ({
    updateWalletState: v.updateWalletState,
  }));

  const { stateController } = useControllersState((v) => ({
    walletController: v.walletController,
    stateController: v.stateController,
  }));
  const [mnemonicPhaseConfirm, setMNemonicPhaseConfirm] = useState<string[]>(
    []
  );

  const [indices, setIndices] = useState<number[]>([]);

  const createNewWallet = useCreateNewWallet();

  const init = useCallback(async () => {
    const mnemonic = await stateController.getPendingWallet();
    const mnemonicArr = mnemonic.split(" ");
    const _indices = [];
    while (_indices.length < 5) {
      const randomIndex = Math.floor(Math.random() * mnemonicArr.length);
      if (!_indices.includes(randomIndex)) {
        _indices.push(randomIndex);
      }
    }

    setIndices(_indices);
    _indices.forEach((index) => {
      mnemonicArr[index] = "";
    });

    setMNemonicPhaseConfirm(mnemonicArr);
  }, [stateController]);

  useEffect(() => {
    if (mnemonicPhaseConfirm.length > 0) return;
    // eslint-disable-next-line
    init();
  }, [mnemonicPhaseConfirm, init]);

  const navigate = useNavigate();

  const onCreate = async () => {
    if (!mnemonicPhaseConfirm || mnemonicPhaseConfirm.length === 0) {
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

  if (!mnemonicPhaseConfirm || loading) {
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
        <div className="mb-5">
          <p className="w-full flex justify-center text-[#787575] mb-5 text-base text-center">
            {t("components.layout.mnemonic_confirm_desc")}
          </p>
          <div className="grid grid-cols-3 text-sm gap-x-2 gap-y-6 mt-10">
            {mnemonicPhaseConfirm.map((word, index) => (
              <div
                key={`confirm-${index}`}
                className="flex justify-between items-center gap-2"
              >
                <span className="w-4 text-end text-[#A69C8C] text-[14px]">
                  {index + 1}.
                </span>
                <p
                  className={cn(
                    "bg-[#F5F5F5] rounded flex justify-center w-full p-2 text-primary text-base leading-[140%]",
                    {
                      "border border-[#0D0D0D]": indices.includes(index),
                    }
                  )}
                >
                  {!indices.includes(index) ? (
                    convertToAsterisks(word)
                  ) : (
                    <input
                      className="w-full bg-transparent text-center"
                      onChange={(e) => {
                        setMNemonicPhaseConfirm((prevState) => {
                          const newState = [...prevState];
                          newState[index] = e.target.value;
                          return newState;
                        });
                      }}
                    />
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className={s.continueWrapper}>
          <button className="btn primary w-full" onClick={onCreate}>
            {t("components.layout.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmMnemonic;
