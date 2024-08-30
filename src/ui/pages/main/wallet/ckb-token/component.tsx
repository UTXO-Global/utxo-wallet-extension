import { isCkbNetwork } from "@/shared/networks";
import { formatNumber } from "@/shared/utils";
import {
  useGetCurrentAccount,
  useGetCurrentNetwork,
} from "@/ui/states/walletState";
import { useTransactionManagerContext } from "@/ui/utils/tx-ctx";
import cn from "classnames";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

export default function CKBToken() {
  const currentAccount = useGetCurrentAccount();
  const currentNetwork = useGetCurrentNetwork();
  const { currentPrice, changePercent24Hr } = useTransactionManagerContext();
  const ckbPrice = useMemo(() => {
    return currentPrice ? Number(currentPrice) : 0;
  }, [currentPrice]);

  const ckbChange24h = useMemo(() => {
    return changePercent24Hr ? Number(changePercent24Hr) : 0;
  }, [changePercent24Hr]);

  const ckbBalance = useMemo(() => {
    return currentAccount.balance ? Number(currentAccount.balance) : 0;
  }, [currentAccount.balance]);

  const navigate = useNavigate();

  if (!isCkbNetwork(currentNetwork.network)) return <></>;

  return (
    <div className="px-4 mt-2">
      <div
        className="py-2 px-4 rounded-lg flex justify-between items-center cursor-pointer border border-grey-300"
        onClick={() => navigate("/pages/tokens/ckb/ckb")}
      >
        <div className="flex gap-[10px] items-center">
          <img src="/ckb.png" className="w-8 h-8 rounded-full" />
          <div className="flex flex-col gap-0">
            <label className="font-medium text-base">CKB</label>
            <div className="flex items-center gap-1">
              <span className="text-sm font-normal text-[#787575] leading-[18px]">
                ${ckbPrice.toFixed(3)}
              </span>{" "}
              <span
                className={cn("text-xs leading-[18px] -tracking-[0.1px]", {
                  "text-[#09C148]": ckbChange24h >= 0,
                  "text-[#FF4545]": ckbChange24h < 0,
                })}
              >
                ({ckbChange24h.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-end text-right">
          <div className="text-primary text-base font-medium">
            {formatNumber(ckbBalance, 2, 3)}
          </div>
          <div className="text-sm font-normal leading-[18px] text-[#787575]">
            ${formatNumber(ckbBalance * ckbPrice, 2, 3)}
          </div>
        </div>
      </div>
    </div>
  );
}
