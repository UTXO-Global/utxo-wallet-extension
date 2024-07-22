import Rename from "@/ui/components/rename";
import { useSwitchAccount, useUpdateCurrentWallet } from "@/ui/hooks/wallet";
import {
  useGetCurrentAccount,
  useGetCurrentNetwork,
  useGetCurrentWallet,
} from "@/ui/states/walletState";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import { t } from "i18next";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import cn from "classnames";
import { IcnCheck } from "@/ui/components/icons";

const SwitchAccount = () => {
  const [renameId, setRenameId] = useState<number | undefined>(undefined);

  const currentAccount = useGetCurrentAccount();
  const currentWallet = useGetCurrentWallet();

  const switchAccount = useSwitchAccount();
  const navigate = useNavigate();

  const updateCurrentWallet = useUpdateCurrentWallet();
  const currentNetwork = useGetCurrentNetwork();

  const onRename = async (name: string) => {
    if (currentWallet.accounts.map((i) => i.name).includes(name.trim()))
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

  const networkAccounts = useMemo(() => {
    return currentWallet?.accounts.filter(
      (account) => account.network === currentNetwork.slug
    );
  }, [currentNetwork]);

  return (
    <div className="flex justify-items-start flex-col items-center w-full h-full">
      <div className="flex flex-col gap-1 p-4 w-full">
        {networkAccounts.map((acc, i) => (
          <div
            key={`account-${i}`}
            className={cn(
              `rounded-lg hover:bg-[#F5F5F5] border-[#F5F5F5] border transition-colors px-4 py-3 flex justify-between items-center cursor-pointer`,
              {
                "bg-[#EBECEC] !border-[#EBECEC] hover:!border-[#EBECEC] hover:!bg-[#EBECEC]": currentAccount.id === acc.id,
              }
            )}
            onClick={async () => {
              await switchAccount(acc.id);
            }}
          >
            <div className="cursor-pointer">
              <p className="text-lg text-primary font-medium">{acc.name}</p>
            </div>
            <div className="flex items-center">
              {currentAccount.id === acc.id ? (
                <IcnCheck />
              ) : null}

              <EllipsisVerticalIcon
                className="text-[#ABA8A1] flex-1 h-6 w-6 cursor-pointer"
                onClick={(e) => {
                  navigate(`/pages/about-account/${acc.id}`);
                  e.stopPropagation();
                }}
              />
            </div>
          </div>
        ))}
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

export default SwitchAccount;
