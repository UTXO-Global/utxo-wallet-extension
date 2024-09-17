import { isCkbNetwork } from "@/shared/networks";
import cn from "classnames";
import BottomPanel from "../wallet/bottom-panel";
import WalletPanel from "./wallet-panel";
import { useLocation, useNavigate } from "react-router-dom";
import { useGetCurrentNetwork } from "@/ui/states/walletState";
import { t } from "i18next";
import { IcnApproximate, IcnChevronDown } from "@/ui/components/icons";

export default function UtxoSwap() {
  const navigate = useNavigate();
  const currentNetwork = useGetCurrentNetwork();
  const location = useLocation();

  return (
    <div className="w-full h-full top-0 relative">
      <div className="!h-100vh-72px standard:!h-100vh-100px overflow-auto relative">
        <WalletPanel />
        {isCkbNetwork(currentNetwork.network) ? (
          <>
            <div className="px-4 py-2">
              <div className="bg-grey-300 rounded-t-lg pt-2 pb-4 px-2 flex flex-col gap-2 relative">
                <div className="flex gap-2 items-center p-2 pb-0">
                  <div className="w-10 h-10">
                    <img
                      src="/ckb.png"
                      className="w-full rounded-full object-cover object-center"
                    />
                  </div>
                  <div className="flex flex-col gap-0 flex-grow">
                    <div className="text-black text-base font-medium">CKB</div>
                    <div className="flex justify-between w-full items-center text-base text-[#787575] font-normal">
                      <span>{t("components.swap.balance")}:</span>
                      <div>100,000</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between px-2 gap-2">
                  <input
                    className="text-black text-2xl leading-[30px] bg-transparent font-medium outline-none placeholder:text-grey-100 flex-grow"
                    placeholder="0"
                    autoFocus
                  />
                  <button className="text-black text-base font-medium cursor-pointer">
                    {t("components.swap.max")}
                  </button>
                </div>

                <div className="absolute -bottom-4 flex w-full items-center justify-center">
                  <button className="w-8 h-8 rounded-full">
                    <IcnSwapDirect />
                  </button>
                </div>
              </div>
              <div className="mt-[2px] bg-grey-400 hover:bg-grey-300 p-2 !pb-4 rounded-b-lg flex flex-col gap-2">
                <div
                  className="flex justify-between items-center p-2 bg-grey-400/80 rounded-lg cursor-pointer"
                  onClick={() =>
                    navigate("/swap/search-token", { state: location.state })
                  }
                >
                  <div className="flex gap-2 items-center">
                    <div className="w-10 h-10">
                      <img
                        src="/ckb.png"
                        className="w-full rounded-full object-cover object-center"
                      />
                    </div>
                    <div className="text-black text-base font-medium">USDC</div>
                  </div>

                  <div className="p-2">
                    <IcnChevronDown className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-center justify-between px-2 gap-2 text-2xl leading-[30px]">
                  <input
                    className="text-black text-2xl leading-[30px] bg-transparent font-medium outline-none placeholder:text-grey-100 flex-grow"
                    placeholder="0"
                    autoFocus
                  />
                  <div className="font-medium text-base text-[#787575]">$0</div>
                </div>
              </div>
              <div className="mt-1 bg-grey-300 p-4 flex items-center justify-between rounded-lg">
                <span className="text-primary text-base font-medium">
                  {t("components.swap.price")}
                </span>
                <div className="text-[#787575] text-sm leading-[18px] font-normal rounded-lg flex items-center gap-[2px]">
                  1 CKB <IcnApproximate className="w-[9px] h-[7px]" /> 0.51 USDC
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 w-full px-4 pb-4 pt-2">
              <button
                type="submit"
                className={cn(
                  "btn primary standard:m-6 standard:mb-3 disabled:bg-[#D1D1D1] disabled:text-grey-100 w-full",
                  {
                    "hover:bg-none hover:border-transparent": false,
                  }
                )}
                disabled={false}
                onClick={() =>
                  navigate("/pages/swap/review-order", {
                    state: location.state,
                  })
                }
              >
                {t("send.create_send.continue")}
              </button>
            </div>
          </>
        ) : (
          <div className="py-20 flex flex-col items-center justify-center">
            <img src="/feature.png" alt="feature" className="w-[180px]" />
            <p className="text-base font-normal text-center text-[#ABA8A1] mt-4">
              {`The feature is not supported yet!`}
            </p>
          </div>
        )}
      </div>
      <div className="absolute w-full bottom-0">
        <BottomPanel />
      </div>
    </div>
  );
}

const IcnSwapDirect = ({ className }: { className?: string }) => {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(className ? className : "")}
    >
      <rect width="32" height="32" rx="16" fill="#0D0D0D" />
      <path
        d="M16 11.5V20.5M16 20.5L20.25 16.25M16 20.5L11.75 16.25"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
