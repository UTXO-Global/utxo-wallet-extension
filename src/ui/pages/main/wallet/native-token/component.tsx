import { NETWORK_ICON } from "@/shared/networks";
import { formatNumber } from "@/shared/utils";
import {
  useGetCurrentAccount,
  useGetCurrentNetwork,
} from "@/ui/states/walletState";
import { useTransactionManagerContext } from "@/ui/utils/tx-ctx";
import cn from "classnames";
import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Analytics from "@/ui/utils/gtm";

export default function NativeToken() {
  const currentAccount = useGetCurrentAccount();
  const currentNetwork = useGetCurrentNetwork();
  const { currentPrice, changePercent24Hr } = useTransactionManagerContext();
  const nativeCoinPrice = useMemo(() => {
    return currentPrice ? Number(currentPrice) : 0;
  }, [currentPrice]);

  const nativeCoinChange24h = useMemo(() => {
    return changePercent24Hr ? Number(changePercent24Hr) : 0;
  }, [changePercent24Hr]);

  const nativeCoinBalance = useMemo(() => {
    return currentAccount?.balance ? Number(currentAccount.balance) : 0;
  }, [currentAccount?.balance]);

  const navigate = useNavigate();

  useEffect(() => {
    try {
      // NOTE: [GA] - track tvl
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      Analytics.fireEvent("wallet_tvl", {
        address: currentAccount.accounts[0].address,
        network: currentNetwork.slug,
        amount: nativeCoinBalance,
      });
    } catch (e) {
      console.error(e);
    }
  }, [nativeCoinBalance]);

  return (
    <div className="px-4 mt-2">
      <div
        className="py-2 px-4 rounded-lg flex justify-between items-center cursor-pointer border border-grey-300 bg-white hover:bg-grey-300"
        onClick={() =>
          navigate(
            `/pages/tokens/${currentNetwork.coinSymbol}/${currentNetwork.coinSymbol}`
          )
        }
      >
        <div className="flex gap-[10px] items-center">
          <img
            src={NETWORK_ICON[currentNetwork.slug]}
            className="w-8 h-8 rounded-full"
          />
          <div className="flex flex-col gap-0">
            <label className="font-medium text-base">
              {currentNetwork.coinSymbol}
            </label>
            <div className="flex items-center gap-1">
              <span className="text-sm font-normal text-[#787575] leading-[18px]">
                ${formatNumber(nativeCoinPrice, 2, 3)}
              </span>{" "}
              <span
                className={cn("text-xs leading-[18px] -tracking-[0.1px]", {
                  "text-[#09C148]": nativeCoinChange24h >= 0,
                  "text-[#FF4545]": nativeCoinChange24h < 0,
                })}
              >
                ({nativeCoinChange24h.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-end text-right">
          <div className="text-primary text-base font-medium">
            {formatNumber(nativeCoinBalance, 2, 8)}
          </div>
          <div className="text-sm font-normal leading-[18px] text-[#787575]">
            ${formatNumber(nativeCoinBalance * nativeCoinPrice, 2, 3)}
          </div>
        </div>
      </div>
    </div>
  );
}
