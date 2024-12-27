import { CKB_HD_PATH_VERSION, CKB_OLD_HD_PATH } from "@/shared/networks/ckb";
import { WalletToImport } from "@/shared/networks/types";
import Select from "@/ui/components/select";
import SelectWithHint from "@/ui/components/select-hint/component";
import { useCreateNewWallet } from "@/ui/hooks/wallet";
import { useGetCurrentNetwork, useWalletState } from "@/ui/states/walletState";
import cn from "classnames";
import { t } from "i18next";
import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import Loading from "react-loading";
import { useNavigate } from "react-router-dom";
import config from "../../../../../../package.json";

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
  const [selectedWallet, setSelectedWallet] = useState<
    WalletToImport | undefined
  >(
    currentNetwork.walletToImport ? currentNetwork.walletToImport[0] : undefined
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
        version: selectedWallet.version,
        payload: mnemonicPhrase.join(" "),
        walletType: "root",
        passphrase:
          selectedWallet.name !== ""
            ? currentNetwork.walletToImport.find(
                (w) => w.name === selectedWallet.name
              ).passphrase
            : "",
        walletName:
          setSelectedWallet.name !== "" ? selectedWallet.name : undefined,
        restoreFromWallet: selectedWallet.value,
      });
      await updateWalletState({ vaultIsEmpty: false });
      navigate("/home");
    } catch (e) {
      console.log(e);
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
                values={currentNetwork.walletToImport}
                selected={{
                  name: selectedWallet.name,
                }}
                setSelected={(e) => {
                  setSelectedWallet(e as WalletToImport);
                }}
                className="capitalize"
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
          <div className="text-center py-2 text-[#787575] text-sm">
            Version: {config.version}
          </div>
          <button className="btn primary" onClick={onRestore}>
            {t("new_wallet.continue")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RestoreMnemonic;
