import { useWalletState } from "@/ui/states/walletState";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { t } from "i18next";
import { useState } from "react";
import Rename from "@/ui/components/rename";
import { useDeleteWallet } from "@/ui/hooks/wallet";
import Modal from "@/ui/components/modal";
import { IcnPencil } from "@/ui/components/icons/IcnPencil";

const WalletDetail = () => {
  const [renameId, setRenameId] = useState<number | undefined>(undefined);
  const [deleteWalletId, setDeleteWalletId] = useState<number>();

  const { walletId } = useParams();
  const navigate = useNavigate();
  const deleteWallet = useDeleteWallet();
  const { wallets, updateWalletState } = useWalletState((v) => ({
    wallets: v.wallets,
    updateWalletState: v.updateWalletState,
  }));
  const wallet = wallets[Number(walletId)];

  const onRename = async (name: string) => {
    if (wallets.map((i) => i.name).includes(name))
      return toast.error(t("switch_account.name_already_taken_error"));

    await updateWalletState({
      wallets: wallets.with(Number(walletId), { ...wallets[walletId], name }),
    });
    setRenameId(undefined);
  };

  const onDelete = async () => {
    setDeleteWalletId(undefined);

    await deleteWallet(wallets[deleteWalletId].id);
    navigate("/");
  };

  return (
    <div className="w-full h-full p-4">
      <div className="flex justify-start gap-2 items-center">
        <h4 className="text-center fon-bold text-lg">{wallet.name}</h4>
        <IcnPencil
          className="w-5 cursor-pointer"
          onClick={() => setRenameId(Number(walletId))}
        />
      </div>

      <div className="grid gap-2 content-start mt-2">
        <Link
          to={`/pages/show-mnemonic/${walletId}`}
          className="flex justify-between items-center p-4 cursor-pointer text-base font-medium text-primary bg-grey-300 rounded-lg"
        >
          <p>{t("about_wallet.recovery_phrase")}</p>
          <ChevronRightIcon className="w-4 text-[#ABA8A1]" />
        </Link>
        <div
          className="flex justify-between items-center p-4 cursor-pointer text-base font-medium text-primary bg-grey-300 rounded-lg"
          onClick={() => {
            if (wallets.length <= 1)
              toast.error(t("switch_wallet.last_wallet_error"));
            else setDeleteWalletId(Number(walletId));
          }}
        >
          <p>{t("about_wallet.delete")}</p>
          <ChevronRightIcon className="w-4 text-[#ABA8A1]" />
        </div>
      </div>

      <Modal
        onClose={() => setDeleteWalletId(undefined)}
        open={deleteWalletId !== undefined}
        title={"Confirmation"}
      >
        <div className="text-base text-primary px-4 flex flex-col items-center">
          <div className="text-sm">{t("switch_wallet.are_you_sure")}</div>
          <span className="text-[#FF4545] block mt-1 font-bold">
            {deleteWalletId !== undefined ? wallets[deleteWalletId].name : ""}
          </span>
        </div>
        <div className="flex justify-center gap-4 mt-3">
          <button
            className="btn w-full secondary"
            onClick={() => setDeleteWalletId(undefined)}
          >
            {t("switch_wallet.no")}
          </button>
          <button className="btn w-full primary" onClick={onDelete}>
            {t("switch_wallet.yes")}
          </button>
        </div>
      </Modal>

      <Rename
        active={renameId !== undefined}
        currentName={(() => {
          if (renameId === undefined) return "";
          return wallet.name;
        })()}
        handler={onRename}
        onClose={() => setRenameId(undefined)}
      />
    </div>
  );
};

export default WalletDetail;
