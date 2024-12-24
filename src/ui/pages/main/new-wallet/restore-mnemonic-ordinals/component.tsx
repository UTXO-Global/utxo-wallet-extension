import SelectWithHint from "@/ui/components/select-hint/component";
import { useCreateNewWallet } from "@/ui/hooks/wallet";
import { useWalletState } from "@/ui/states/walletState";
import cn from "classnames";
import { t } from "i18next";
import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import Loading from "react-loading";
import { useNavigate } from "react-router-dom";
import s from "./styles.module.scss";

const RestoreMnemonicOrdinals = () => {
  const { updateWalletState } = useWalletState((v) => ({
    updateWalletState: v.updateWalletState,
  }));
  const [mnemonicPhrase, setMnemonicPhrase] = useState<(string | undefined)[]>(
    new Array(12).fill("")
  );
  const createNewWallet = useCreateNewWallet();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);

  const setMnemonic = useCallback(
    (v: string, index: number) => {
      if (!v) {
        return;
      }
      const phrase = v.split(" ");
      if (phrase.length === 12) setMnemonicPhrase(phrase);
      else setMnemonicPhrase(mnemonicPhrase.with(index, v));
    },
    [mnemonicPhrase]
  );

  const onRestore = async () => {
    if (mnemonicPhrase.findIndex((f) => !f) !== -1) {
      toast.error(t("new_wallet.restore_mnemonic.incomplete_phrase_error"));
      return;
    }
    setLoading(true);
    try {
      await createNewWallet({
        isNewVersion: true,
        payload: mnemonicPhrase.join(" "),
        walletType: "root",
        hdPath: "m/44'/3'/0'/0/0",
        passphrase: "",
      });
      await updateWalletState({ vaultIsEmpty: false });
      navigate("/home");
    } catch (e) {
      toast.error(t("new_wallet.restore_mnemonic.invalid_words_error"));
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading color="#ODODOD" />;

  return (
    <div className={s.restoreMnemonic}>
      <div className={cn(s.step, "justify-between")}>
        <div className={s.phrase}>
          {new Array(12).fill("").map((_, index) => (
            <div key={index} className={s.word}>
              <p className="w-6">{index + 1}.</p>
              <SelectWithHint
                selected={mnemonicPhrase[index]}
                setSelected={(v) => setMnemonic(v, index)}
              />
            </div>
          ))}
        </div>
        <div className={s.continueWrapper}>
          <button className="btn primary" onClick={onRestore}>
            {t("new_wallet.continue")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RestoreMnemonicOrdinals;
