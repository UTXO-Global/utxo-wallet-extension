import {
  useGetCurrentAccount,
  useGetCurrentNetwork,
} from "@/ui/states/walletState";
import { useTransactionManagerContext } from "@/ui/utils/tx-ctx";
import { useEffect } from "react";
import Loading from "react-loading";
import AccountPanel from "./account-panel";
import s from "./styles.module.scss";
import WalletPanel from "./wallet-panel";
import BottomPanel from "./bottom-panel";
import CKBToken from "./ckb-token/component";
import TokenTabs from "./tokens";
import TransactionList from "@/ui/components/transactions-list";
import { getNetworkDataBySlug, isCkbNetwork } from "@/shared/networks";

const Wallet = () => {
  const { trottledUpdate } = useTransactionManagerContext();
  const currentAccount = useGetCurrentAccount();
  const currentNetwork = useGetCurrentNetwork();

  useEffect(() => {
    trottledUpdate();
  }, [trottledUpdate]);

  if (!currentAccount) return <Loading color="#ODODOD" />;

  return (
    <div className="relative w-full top-0">
      <div className={`${s.walletDiv} !h-100vh-72px standard:!h-100vh-100px`}>
        <WalletPanel />
        <AccountPanel />
        {isCkbNetwork(currentNetwork.network) && (
          <>
            <CKBToken />
            <TokenTabs active="xudt" />
          </>
        )}
      </div>
      <div className="absolute w-full bottom-0">
        <BottomPanel />
      </div>
    </div>
  );
};

export default Wallet;
