import cn from "classnames";
import {
  useGetCurrentAccount,
  useGetCurrentNetwork,
} from "@/ui/states/walletState";
import { useTransactionManagerContext } from "@/ui/utils/tx-ctx";
import { useEffect, useState, useMemo } from "react";
import Loading from "react-loading";
import AccountPanel from "./account-panel";
import s from "./styles.module.scss";
import WalletPanel from "./wallet-panel";
import BottomPanel from "./bottom-panel";
import TokenTabs from "./tokens";
import { isCkbNetwork } from "@/shared/networks";
import NativeToken from "./native-token";
import Campaign from "./campaign";

const Wallet = () => {
  const [mounted, setMounted] = useState(false);
  const { trottledUpdate } = useTransactionManagerContext();
  const currentAccount = useGetCurrentAccount();
  const currentNetwork = useGetCurrentNetwork();
  const [tab, setTab] = useState<"coins" | "myDids">("coins");

  const tabs = useMemo(() => {
    if (isCkbNetwork(currentNetwork.network))
      return [
        {
          key: "coins",
          label: "Coins",
        },
      ];
    return [];
  }, [currentNetwork.network]);

  useEffect(() => {
    trottledUpdate();
  }, [trottledUpdate]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!currentAccount && !mounted) return <Loading color="#ODODOD" />;

  return (
    <div className="relative w-full top-0">
      <div className={`${s.walletDiv} !h-100vh-72px standard:!h-100vh-100px`}>
        <WalletPanel />
        <AccountPanel />
        <Campaign />
        <NativeToken />
        <div className="px-4">
          <div className="mt-4 flex gap-4">
            {tabs.map((z) => (
              <div key={z.key} className="bg-grey-400 rounded-full flex gap-0">
                <div
                  className={cn(
                    "font-medium text-sm leading-5 tracking-[0.2px] rounded-full px-4 py-[6px] text-[#787575] cursor-pointer bg-grey-300",
                    {
                      "!bg-grey-200": z.key === tab,
                    }
                  )}
                  onClick={() => setTab(z.key as any)}
                >
                  {z.label}
                </div>
              </div>
            ))}
          </div>
        </div>
        {isCkbNetwork(currentNetwork.network) ? (
          <>{tab === "coins" ? <TokenTabs /> : null}</>
        ) : null}
      </div>
      <div className="absolute w-full bottom-0">
        <BottomPanel />
      </div>
    </div>
  );
};

export default Wallet;
