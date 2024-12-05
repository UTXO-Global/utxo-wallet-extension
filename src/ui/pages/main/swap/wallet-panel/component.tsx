import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  useGetCurrentAccount,
  useGetCurrentNetwork,
  useGetCurrentWallet,
} from "@/ui/states/walletState";
import { IcnChevronDown } from "@/ui/components/icons";
import { useMemo } from "react";
import { useAppState } from "@/ui/states/appState";
import { isCkbNetwork } from "@/shared/networks";

const WalletPanel = ({ state }: { state?: any }) => {
  const currentWallet = useGetCurrentWallet();
  const currentAccount = useGetCurrentAccount();
  const currentNetwork = useGetCurrentNetwork();
  const { swapSetting } = useAppState();
  const location = useLocation();
  const navigate = useNavigate();

  const localState = useMemo(() => {
    if (state) return state;
    return location.state;
  }, [state, location.state]);

  const _navigate = (path: string) => {
    navigate(path, { state: localState });
  };

  return (
    <div className="flex justify-between items-center sticky left-0 py-3 px-4 w-full top-0 z-50 standard:!relative border-b border-grey-300 bg-light-100">
      <Link
        className="flex gap-3 items-center select-none cursor-pointer"
        to={"/pages/switch-account"}
      >
        <img
          src="/utxo-global-account.png"
          className="w-10 h-10 rounded-full"
        />
        <div className="grid">
          <div className="flex gap-2 items-center">
            <div
              className={`text-base truncate max-w-[90px] font-normal !leading-[22.4px]`}
            >
              {currentWallet?.name ?? "wallet"}{" "}
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <div
              className={`text-base truncate max-w-[90px] font-medium !leading-4`}
            >
              {currentAccount?.name}{" "}
            </div>
            <IcnChevronDown className="w-3 h-3" />
          </div>
        </div>
      </Link>

      {isCkbNetwork(currentNetwork.network) ? (
        <div className="flex gap-4 items-center">
          <div
            className="flex items-center cursor-pointer gap-1 bg-grey-300 p-[6px] rounded group"
            onClick={() => _navigate("/pages/swap/slippage-settings")}
          >
            <IcnSlippageSettings />
            <span className="text-sm leading-5 font-medium text-primary">
              {swapSetting.slippage}%
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default WalletPanel;

const IcnSlippageSettings = () => {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="stroke-primary hover:stroke-[#787575] group-hover:rotate-180 cursor-pointer transition-transform w-4 h-4"
    >
      <path
        d="M8.00058 1.83342L8.00058 10.0701M8.00058 12.9774L8.00058 14.1667M8.00058 12.9774C7.61513 12.9774 7.24547 12.8243 6.97292 12.5517C6.70036 12.2792 6.54724 11.9095 6.54724 11.5241C6.54724 11.1386 6.70036 10.769 6.97292 10.4964C7.24547 10.2239 7.61513 10.0707 8.00058 10.0707C8.38603 10.0707 8.75569 10.2239 9.02824 10.4964C9.30079 10.769 9.45391 11.1386 9.45391 11.5241C9.45391 11.9095 9.30079 12.2792 9.02824 12.5517C8.75569 12.8243 8.38603 12.9774 8.00058 12.9774ZM12.4052 1.83342L12.4052 5.66541M12.4052 5.66541C12.7908 5.66541 13.1609 5.8189 13.4335 6.09152C13.7061 6.36413 13.8592 6.73388 13.8592 7.11941C13.8592 7.50486 13.7055 7.87452 13.4329 8.14708C13.1604 8.41963 12.7907 8.57275 12.4052 8.57275M12.4052 5.66541C12.0197 5.66541 11.6503 5.8189 11.3777 6.09152C11.1051 6.36413 10.9519 6.73388 10.9519 7.11941C10.9519 7.50486 11.105 7.87452 11.3776 8.14708C11.6501 8.41963 12.0198 8.57275 12.4052 8.57275M12.4052 8.57275L12.4052 14.1667M3.59591 1.83342L3.59591 3.90341M3.59591 6.81075L3.59591 14.1667M3.59591 6.81075C3.21046 6.81075 2.8408 6.65763 2.56825 6.38508C2.2957 6.11252 2.14258 5.74286 2.14258 5.35742C2.14258 5.16656 2.18017 4.97757 2.25321 4.80125C2.32624 4.62492 2.43329 4.46471 2.56825 4.32975C2.7032 4.1948 2.86342 4.08775 3.03974 4.01471C3.21607 3.94167 3.40506 3.90408 3.59591 3.90408C3.78677 3.90408 3.97575 3.94167 4.15208 4.01471C4.3284 4.08775 4.48862 4.1948 4.62357 4.32975C4.75853 4.46471 4.86558 4.62492 4.93862 4.80125C5.01165 4.97757 5.04924 5.16656 5.04924 5.35742C5.04924 5.74286 4.89613 6.11252 4.62357 6.38508C4.35102 6.65763 3.98136 6.81075 3.59591 6.81075Z"
        stroke="black"
        strokeMiterlimit="10"
        strokeLinecap="round"
      />
    </svg>
  );
};
