import {
  useGetCurrentNetwork,
  useGetCurrentWallet,
} from "@/ui/states/walletState";
import { Link, useParams } from "react-router-dom";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { t } from "i18next";
import { useState } from "react";
import { useUpdateCurrentWallet } from "@/ui/hooks/wallet";
import Rename from "@/ui/components/rename";
import { IcnPencil } from "@/ui/components/icons/IcnPencil";

const AccountDetail = () => {
  const [renameId, setRenameId] = useState<number | undefined>(undefined);

  const { accId } = useParams();
  const currentWallet = useGetCurrentWallet();
  const updateCurrentWallet = useUpdateCurrentWallet();
  const account = currentWallet.accounts[Number(accId)];
  const currentNetwork = useGetCurrentNetwork();

  const onRename = async (name: string) => {
    if (
      currentWallet.accounts
        .filter((z) => z.network === currentNetwork.slug)
        .find((f) => f.name?.trim() === name.trim()) !== undefined
    )
      return toast.error(t("switch_account.name_already_taken_error"));

    setRenameId(undefined);

    await updateCurrentWallet({
      accounts: currentWallet.accounts.map((i, idx) => {
        if (idx === renameId) {
          return {
            ...i,
            name,
          };
        } else {
          return i;
        }
      }),
    });
  };

  return (
    <div className="w-full h-full p-4 pt-8">
      <img
        src="/account.png"
        style={{
          width: "80px",
        }}
        alt=""
        className="mx-auto"
      />
      <div className="flex justify-center gap-2 items-center mt-4 mb-10">
        <h4 className="text-center fon-medium text-[20px] leading-[28px] text-primary p-[10px]">
          {account.name}
        </h4>
        <IcnPencil
          className="w-4 h-4 cursor-pointer"
          onClick={() => setRenameId(Number(accId))}
        />
      </div>

      <div className="grid gap-2 content-start mt-8">
        <Link
          to={`/pages/address-type/${accId}`}
          className="flex justify-between items-center p-4 cursor-pointer text-base font-medium text-primary bg-grey-300 rounded-lg"
        >
          <p>{t("about_account.address_type")}</p>
          <ChevronRightIcon className="w-4 text-[#ABA8A1]" />
        </Link>
        <Link
          to={`/pages/show-pk/${accId}`}
          className="flex justify-between items-center p-4 cursor-pointer text-base font-medium text-primary bg-grey-300 rounded-lg"
        >
          <p>{t("about_account.export_private_key")}</p>
          <ChevronRightIcon className="w-4 text-[#ABA8A1]" />
        </Link>
      </div>

      <Rename
        active={renameId !== undefined}
        currentName={(() => {
          if (renameId === undefined) return "";
          return currentWallet.accounts[renameId].name;
        })()}
        handler={onRename}
        onClose={() => setRenameId(undefined)}
      />
    </div>
  );
};

export default AccountDetail;
