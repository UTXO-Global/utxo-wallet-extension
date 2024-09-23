import { useGetCurrentWallet, useWalletState } from "@/ui/states/walletState";
import { useEffect } from "react";
import s from "./styles.module.scss";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";

import { useSwitchWallet } from "@/ui/hooks/wallet";
import { useNavigate } from "react-router-dom";
import cn from "classnames";
import { IcnCheck } from "@/ui/components/icons";

const SwitchWallet = () => {
  const currentWallet = useGetCurrentWallet();
  const { wallets } = useWalletState((v) => ({
    wallets: v.wallets,
    updateWalletState: v.updateWalletState,
  }));
  const switchWallet = useSwitchWallet();
  const navigate = useNavigate();

  useEffect(() => {
    if (wallets.findIndex((f) => f.id === currentWallet.id) > 5)
      document.getElementById(String(currentWallet.id))?.scrollIntoView();
  }, [currentWallet.id, wallets]);

  return (
    <div className={s.switchWalletDiv}>
      <div className={s.wallets}>
        {wallets.map((wallet, i) => (
          <div
            key={`wallet-${i}`}
            className={cn(
              `rounded-lg hover:bg-[#F5F5F5] border-[#F5F5F5] border transition-colors px-4 py-3 flex justify-between items-center cursor-pointer`,
              {
                "bg-[#EBECEC] !border-[#EBECEC] hover:!border-[#EBECEC] hover:!bg-[#EBECEC]":
                  currentWallet.id === wallet.id,
              }
            )}
            onClick={async () => {
              await switchWallet(i);
              setTimeout(() => {
                navigate("/home");
              }, 100);
            }}
          >
            <div className="cursor-pointer">
              <p className="text-lg text-primary font-medium">{wallet.name}</p>
            </div>
            <div className="flex items-center">
              {currentWallet.id === wallet.id ? (
                <IcnCheck className="" />
              ) : null}

              <EllipsisVerticalIcon
                className="text-[#ABA8A1] flex-1 h-6 w-6 cursor-pointer"
                onClick={(e) => {
                  navigate(`/pages/about-wallet/${wallet.id}`);
                  e.stopPropagation();
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SwitchWallet;
