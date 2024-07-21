import Select from "@/ui/components/select";
import SelectWithHint from "@/ui/components/select-hint/component";
import { useCreateNewWallet } from "@/ui/hooks/wallet";
import { useGetCurrentNetwork, useWalletState } from "@/ui/states/walletState";
import Analytics from "@/ui/utils/gtm";
import cn from "classnames";
import { t } from "i18next";
import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import Loading from "react-loading";
import { useNavigate } from "react-router-dom";

const RestoreMnemonic = () => {
  const { updateWalletState } = useWalletState((v) => ({
    updateWalletState: v.updateWalletState,
  }));
  const [mnemonicPhrase, setMnemonicPhrase] = useState<(string | undefined)[]>(
    new Array(12).fill("")
  );
  const createNewWallet = useCreateNewWallet();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const currentNetwork = useGetCurrentNetwork();
  const [selectedWalletName, setSelectedWaleltName] = useState(
    currentNetwork.walletToImport ? currentNetwork.walletToImport[0].name : ""
  );

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
        payload: mnemonicPhrase.join(" "),
        walletType: "root",
        passphrase:
          selectedWalletName !== ""
            ? currentNetwork.walletToImport.find(
                (w) => w.name === selectedWalletName
              ).passphrase
            : "",
        walletName: selectedWalletName !== "" ? selectedWalletName : undefined,
      });
      await updateWalletState({ vaultIsEmpty: false });
      // NOTE: [GA] - Restore mnemonic
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      Analytics.fireEvent("ob_restore_mnemonic", {
        action: "click",
        label: "continue",
      });
      navigate("/home");
    } catch (e) {
      if (e.message === "Already existed") {
        toast.error(e.message);
      } else {
        toast.error(t("new_wallet.restore_mnemonic.invalid_words_error"));
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading color="#ODODOD" />;

  return (
    <div className="w-full h-full flex flex-col items-center gap-6 text-base p-4 pb-0">
      <div className={cn("h-full w-full flex flex-col justify-between mt-2")}>
        <div>
          {currentNetwork.walletToImport && (
            <div className="w-full mb-4">
              <Select
                label={t("new_wallet.restore_from_label")}
                values={currentNetwork.walletToImport.map((wallet) => ({
                  name: wallet.name,
                }))}
                selected={{
                  name: selectedWalletName,
                }}
                setSelected={(e) => {
                  setSelectedWaleltName(e.name);
                }}
              />
            </div>
          )}
          <p className="text-[#787575] text-center">
            Enter your Mnemonic to restore your wallet
          </p>
          <div className="grid grid-cols-3 text-sm gap-x-2 gap-y-6 mt-6">
            {new Array(12).fill("").map((_, index) => (
              <div
                key={index}
                className="flex justify-between items-center gap-2"
              >
                <p className="w-4 text-end text-[#A69C8C] text-[14px]">
                  {index + 1}.
                </p>
                <SelectWithHint
                  selected={mnemonicPhrase[index]}
                  setSelected={(v) => setMnemonic(v, index)}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="w-full flex justify-between pt-4 pb-2 flex-col">
          <button className="btn primary" onClick={onRestore}>
            {t("new_wallet.continue")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RestoreMnemonic;
