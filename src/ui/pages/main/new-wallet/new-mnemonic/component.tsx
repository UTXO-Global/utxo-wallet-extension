import CopyBtn from "@/ui/components/copy-btn";
import { useCreateNewWallet } from "@/ui/hooks/wallet";
import { useAppState } from "@/ui/states/appState";
import { useControllersState } from "@/ui/states/controllerState";
import { useWalletState } from "@/ui/states/walletState";
import cn from "classnames";
import { t } from "i18next";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import ReactLoading from "react-loading";
import { useLocation, useNavigate } from "react-router-dom";
import s from "./styles.module.scss";
import Checkbox from "@/ui/components/checkbox";

const NewMnemonic = () => {
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [savedPhrase, setSavedPhrase] = useState(false);
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
  const [mnemonicPhrase, setMnemonicPhrase] = useState<string | undefined>(
    undefined
  );

  const createNewWallet = useCreateNewWallet();

  const init = useCallback(async () => {
    if (location.state?.pending) {
      return setMnemonicPhrase(location.state.pending);
    }

    const phrase = await walletController.generateMnemonicPhrase();
    await updateAppState({
      pendingWallet: phrase,
    });
    setMnemonicPhrase(phrase);
  }, [
    setMnemonicPhrase,
    updateAppState,
    walletController,
    location.state?.pending,
  ]);

  useEffect(() => {
    if (mnemonicPhrase) return;
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    init();
  }, [mnemonicPhrase, init]);

  const navigate = useNavigate();

  const onCreate = async () => {
    if (!mnemonicPhrase) {
      toast.error(t("new_wallet.new_mnemonic.error_phrase_blank"));
      return;
    }
    setLoading(true);
    await createNewWallet({
      payload: mnemonicPhrase,
      walletType: "root",
    });
    await updateWalletState({ vaultIsEmpty: false });
    await stateController.clearPendingWallet();
    setLoading(false);
    navigate("/home");
  };

  const onSwitch = () => {
    setSavedPhrase((p) => !p);
  };

  if (!mnemonicPhrase || loading) {
    return <ReactLoading type="spin" color="#ffbc42" />;
  }

  return (
    <div className="w-full h-full flex flex-col items-center gap-4 standard:gap-8 text-base p-4 pb-0">
      <div
        className={cn(
          "h-full flex flex-col justify-between w-full",
          "justify-between"
        )}
      >
        <div>
          <p className="w-full flex justify-center text-[#FF4545] mb-5 text-sm text-center">
            {t("new_wallet.new_mnemonic.warning")}
          </p>
          <div className="grid grid-cols-3 text-sm gap-x-2 gap-y-6 mt-10">
            {mnemonicPhrase.split(" ").map((word, index) => (
              <div
                key={index}
                className="flex justify-between items-center gap-2"
              >
                <span className="w-4 text-end text-[#A69C8C] text-[14px]">
                  {index + 1}.
                </span>
                <p className="bg-[#F5F5F5] rounded flex justify-center w-full p-2 text-primary text-base leading-[140%]">
                  {word}
                </p>
              </div>
            ))}
          </div>
        </div>
        <CopyBtn
          label={t("new_wallet.new_mnemonic.copy")}
          value={mnemonicPhrase}
          className="mx-auto flex items-center gap-1 bg-[#EBECEC] rounded-full px-6 py-2"
        />
        <Checkbox
          label={t("new_wallet.new_mnemonic.i_saved_this_phrase")}
          onChange={onSwitch}
          value={savedPhrase}
          className={s.savePhrase}
        />
        <div className={s.continueWrapper}>
          <button
            className="btn primary w-full"
            onClick={() => onCreate()}
            disabled={!savedPhrase}
          >
            {t("new_wallet.continue")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewMnemonic;
