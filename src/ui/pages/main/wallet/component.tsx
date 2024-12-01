import {
  useGetCurrentAccount,
  useGetCurrentNetwork,
  useGetCurrentWallet,
} from "@/ui/states/walletState";
import { useTransactionManagerContext } from "@/ui/utils/tx-ctx";
import { useEffect, useState } from "react";
import Loading from "react-loading";
import AccountPanel from "./account-panel";
import s from "./styles.module.scss";
import WalletPanel from "./wallet-panel";
import BottomPanel from "./bottom-panel";
import TokenTabs from "./tokens";
import { isCkbNetwork } from "@/shared/networks";
import NativeToken from "./native-token";
import Campaign from "./campaign";
import NewOneKeyAccount from "../hware/onekey/new-account";

const Wallet = () => {
  const [mounted, setMounted] = useState(false);
  const { trottledUpdate } = useTransactionManagerContext();
  const currentAccount = useGetCurrentAccount();
  const currentWallet = useGetCurrentWallet();
  const currentNetwork = useGetCurrentNetwork();

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
        {currentWallet.type === "onekey" && !currentAccount ? (
          <NewOneKeyAccount />
        ) : (
          <AccountPanel />
        )}
        <Campaign />
        <NativeToken />
        {isCkbNetwork(currentNetwork.network) && <TokenTabs />}
      </div>
      <div className="absolute w-full bottom-0">
        <BottomPanel />
      </div>
    </div>
  );
};

export default Wallet;
