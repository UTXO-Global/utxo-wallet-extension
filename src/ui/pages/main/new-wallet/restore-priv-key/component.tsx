import { isBitcoinNetwork, isCkbNetwork } from "@/shared/networks";
import PasswordInput from "@/ui/components/password-input";
import Select from "@/ui/components/select";
import { useCreateNewWallet } from "@/ui/hooks/wallet";
import { useGetCurrentNetwork, useWalletState } from "@/ui/states/walletState";
import * as tinysecp from "@bitcoinerlab/secp256k1";
import ECPairFactory from "@/packages/pair";
import { t } from "i18next";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import Loading from "react-loading";
import { useNavigate } from "react-router-dom";

interface FormType {
  privKey: string;
}

const waysToRestore: { name: "wif" | "hex" }[] = [
  { name: "hex" },
  { name: "wif" },
];

const RestorePrivKey = () => {
  const { register, handleSubmit } = useForm<FormType>({
    defaultValues: {
      privKey: "",
    },
  });
  const [selectedWayToRestore, setSelectedWayToRestore] = useState<{
    name: "wif" | "hex";
  }>(waysToRestore[0]);

  const createNewWallet = useCreateNewWallet();
  const currentNetwork = useGetCurrentNetwork();
  const navigate = useNavigate();
  const { updateWalletState } = useWalletState((v) => ({
    updateWalletState: v.updateWalletState,
  }));
  const [loading, setLoading] = useState<boolean>(false);

  const recoverWallet = async ({ privKey }: FormType) => {
    setLoading(true);
    try {
      // Convert WIF to hex based on current network
      if (selectedWayToRestore.name === "wif") {
        const ECPair = ECPairFactory(tinysecp);
        if (isBitcoinNetwork(currentNetwork.network)) {
          const pair = ECPair.fromWIF(privKey, currentNetwork.network);
          privKey = pair.privateKey.toString("hex");
        }
      }

      privKey =
        privKey.indexOf("0x") === 0 ? privKey.replace("0x", "") : privKey;

      await createNewWallet({
        payload: privKey,
        walletType: "simple",
        restoreFrom: "hex", // use hex to save because we have already convert
      });
      await updateWalletState({ vaultIsEmpty: false });
      navigate("/home");
    } catch (e) {
      if (e.message === "Already existed") {
        toast.error(e.message);
      } else {
        toast.error(t("new_wallet.restore_private.invalid_private_key_error"));
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading color="#ODODOD" />;

  return (
    <div className="w-full h-full flex flex-col items-center gap-6 text-base p-4 pb-0">
      <form
        className="h-full w-full flex flex-col mt-[94px]"
        onSubmit={handleSubmit(recoverWallet)}
      >
        <div className="flex flex-col gap-4">
          <Select
            label={t("new_wallet.restore_from_label")}
            disabled={isCkbNetwork(currentNetwork.network)}
            values={waysToRestore}
            selected={selectedWayToRestore}
            setSelected={(name) => {
              setSelectedWayToRestore(name);
            }}
            className="capitalize"
          />
          <PasswordInput
            showSeparateLabel={false}
            label={t("new_wallet.restore_private.private_key")}
            register={register}
            name="privKey"
          />
        </div>
        <div className="w-full flex justify-between mt-6 flex-col">
          <button className="btn primary" type="submit">
            {t("new_wallet.restore_private.recover")}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RestorePrivKey;
