import { isCkbNetwork } from "@/shared/networks";
import { useGetCurrentNetwork } from "@/ui/states/walletState";
import { useLocation, useNavigate } from "react-router-dom";
import cn from "classnames";
import { t } from "i18next";
import { useState } from "react";

export default function UTXOSwapSetting() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentNetwork = useGetCurrentNetwork();
  const [slippage, setSlippage] = useState(location.state?.slippage || 0.5);
  const [isAuto, setIsAuto] = useState(!!location.state?.isSlippageAuto);

  return (
    <div className="w-full h-full top-0 relative">
      {isCkbNetwork(currentNetwork.network) && (
        <div className="px-8 py-[34px] gap-[34px] flex flex-col items-center justify-center text-center">
          <div className="flex flex-col items-center justify-center">
            <IcnSwapSetting className="w-20 h-20 rounded-full" />
            <div className="mt-6 text-2xl leading-7 font-medium text-primary capitalize">
              {t("components.swap.slippageSettings")}
            </div>
            <div className="mt-4 text-sm leading-[18px] font-normal text-[#787575]">
              {t("components.swap.slippageSettingDesc")}
            </div>
          </div>
          <div className="flex items-center px-[10px] gap-2">
            <div className="flex gap-0 bg-[#FAFAFA] rounded-2xl text-grey-100">
              <button
                className={cn("py-[6px] px-5", {
                  "bg-grey-200 text-primary rounded-full": isAuto,
                })}
                onClick={() => {
                  setIsAuto(true);
                  setSlippage(0.5);
                }}
              >
                {t("components.swap.auto")}
              </button>
              <button
                className={cn("py-[6px] px-5 rounded-full", {
                  "bg-grey-200 text-primary": !isAuto,
                })}
                onClick={() => setIsAuto(false)}
              >
                {t("components.swap.custom")}
              </button>
            </div>
            <div className="bg-grey-300 py-[6px] px-4 w-[66px] flex justify-center items-center rounded-full">
              <input
                type="text"
                value={slippage}
                className="flex-grow w-8 text-center bg-transparent"
                placeholder="0.5"
                disabled={isAuto}
                readOnly={isAuto}
                onChange={(e) => {
                  setSlippage(e.target.value);
                }}
              />
              <span>%</span>
            </div>
          </div>
        </div>
      )}
      <div className="fixed bottom-0 w-full px-4 pb-4 pt-2 bg-white">
        <button
          type="submit"
          className={cn("btn primary standard:m-6 standard:mb-3 w-full")}
          onClick={() =>
            navigate("/swap", {
              state: {
                ...location.state,
                slippage: slippage,
                isSlippageAuto: isAuto,
              },
            })
          }
        >
          {t("components.layout.confirm")}
        </button>
      </div>
    </div>
  );
}

const IcnSwapSetting = ({ className }: { className?: string }) => {
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(className ? className : "")}
    >
      <rect width="80" height="80" rx="40" fill="#F5F5F5" />
      <path
        d="M57.456 31.5327L50.9105 31.5327M42.1832 31.5327L22.5469 31.5327M29.0923 46.8051L22.5469 46.8051M57.456 46.8051L37.8196 46.8051"
        stroke="black"
        strokeWidth="3.27269"
        strokeLinecap="round"
      />
      <path
        d="M37.8191 46.8043C37.8191 44.3944 35.8654 42.4408 33.4554 42.4408C31.0455 42.4408 29.0918 44.3944 29.0918 46.8043C29.0918 49.2142 31.0455 51.1678 33.4554 51.1678C35.8654 51.1678 37.8191 49.2142 37.8191 46.8043Z"
        stroke="black"
        strokeWidth="3.27269"
        strokeLinecap="round"
      />
      <path
        d="M50.9109 31.5314C50.9109 29.1215 48.9572 27.1678 46.5472 27.1678C44.1373 27.1678 42.1836 29.1215 42.1836 31.5314C42.1836 33.9413 44.1373 35.8949 46.5472 35.8949C48.9572 35.8949 50.9109 33.9413 50.9109 31.5314Z"
        stroke="black"
        strokeWidth="3.27269"
        strokeLinecap="round"
      />
    </svg>
  );
};
