import { isCkbNetwork } from "@/shared/networks";
import cn from "classnames";
import { useLocation, useNavigate } from "react-router-dom";
import {
  useGetCurrentAccount,
  useGetCurrentNetwork,
} from "@/ui/states/walletState";
import { t } from "i18next";
import { IcnApproximate } from "@/ui/components/icons";
import { Tooltip } from "react-tooltip";
import { useMemo, useState } from "react";
import { formatNumber } from "@/shared/utils";
import { useTransactionManagerContext } from "@/ui/utils/tx-ctx";
import { Client, Collector, Pool } from "@utxoswap/swap-sdk-js";
import { useControllersState } from "@/ui/states/controllerState";
import Loading from "react-loading";
import toast from "react-hot-toast";

export default function UTXOReviewOrder() {
  const [isProgressing, setIsProgressing] = useState(false);
  const navigate = useNavigate();
  const { currentPrice } = useTransactionManagerContext();
  const currentNetwork = useGetCurrentNetwork();
  const currentAccount = useGetCurrentAccount();
  const { apiController, keyringController } = useControllersState((v) => ({
    apiController: v.apiController,
    keyringController: v.keyringController,
  }));

  const collector = useMemo(() => {
    if (isCkbNetwork(currentNetwork.network)) {
      return new Collector({ ckbIndexerUrl: currentNetwork.network.rpc_url });
    }
    return undefined;
  }, [currentNetwork]);

  const client = useMemo(() => {
    if (isCkbNetwork(currentNetwork.network)) {
      return new Client(
        currentNetwork.slug === "nervos",
        currentNetwork.network.utxoAPIKey
      );
    }
    return undefined;
  }, [currentNetwork]);

  const location = useLocation();
  const fields = useMemo(() => {
    const state = location.state;
    if (!state) return [];
    return [
      {
        id: "reviewPrice",
        title: t("components.swap.price"),
        value: (
          <>
            1 {state.poolInfo?.assetX?.symbol}{" "}
            <IcnApproximate className="w-[9px] h-[7px]" />{" "}
            {state.price?.toLocaleString("fullwide", {
              useGrouping: false,
              maximumFractionDigits: 8,
            })}{" "}
            {state.poolInfo?.assetY?.symbol}
          </>
        ),
      },
      {
        id: "reviewPriceImpack",
        title: t("components.swap.priceImpact"),
        value: <>{state.outputAmount.priceImpact.toFixed(3)}%</>,
        tooltip: t("components.swap.tooltip.priceImpack"),
      },
      {
        id: "reviewFees",
        title: t("components.swap.fee"),
        value: (
          <>
            {state.fee.toLocaleString("fullwide", {
              useGrouping: false,
              maximumFractionDigits: 100,
            })}{" "}
            {state.poolInfo?.assetX?.symbol}
          </>
        ),
        tooltip: t("components.swap.tooltip.fees"),
      },
      {
        id: "reviewMaxSlippage",
        title: t("components.swap.maxSlippage"),
        value: <>{state.slippage}%</>,
        tooltip: t("components.swap.tooltip.maxSlippage"),
      },
    ];
  }, [location.state]);

  const signTxFunc = async (rawTx: CKBComponents.RawTransactionToSign) => {
    try {
      const signed = await keyringController.signCkbTransaction(
        currentAccount.accounts[0].address,
        currentNetwork.slug,
        rawTx,
        currentAccount.accounts[0].hdPath
      );

      return signed as CKBComponents.RawTransaction;
    } catch (e) {
      console.error(e);
    }
    return undefined;
  };

  const pool = useMemo(() => {
    return new Pool({
      tokens: [location.state?.tokens[0], location.state?.tokens[1]],
      ckbAddress: currentAccount?.accounts[0].address,
      collector,
      client,
      poolInfo: location.state?.poolInfo,
    });
  }, [location.state, currentAccount]);

  const onSwap = async () => {
    setIsProgressing(true);
    try {
      pool.calculateOutputAmountAndPriceImpactWithExactInput(
        `${location.state?.inputAmount}`
      );

      const txHash = await pool.swapWithExactInput(
        signTxFunc,
        `${location.state?.slippage?.toString() || "0.5"}`,
        5000
      );

      navigate(`/pages/swap/swap-success/${txHash}`, {
        state: { ...location.state, txId: txHash },
      });
    } catch (e) {
      toast.error((e as any)?.message ?? "Unknown error");
    }
    setIsProgressing(false);
  };

  return (
    <div className="w-full h-full top-0 relative">
      <div className={cn("standard:h-[calc(100dvh_-_140px)]")}>
        {isCkbNetwork(currentNetwork.network) ? (
          <>
            <div className="px-4 py-2">
              <div className="bg-grey-300 rounded-t-lg pt-2 pb-4 px-2 flex flex-col gap-2 relative">
                <div className="flex gap-2 items-center p-2 pb-0">
                  <div className="w-10 h-10">
                    <img
                      src={location.state?.tokens[0]?.logo || "/coin.png"}
                      className="w-full rounded-full object-cover object-center"
                    />
                  </div>
                  <div className="flex flex-col gap-0 flex-grow">
                    <div className="text-[#787575] text-base font-medium">
                      {t("components.swap.youPay")}
                    </div>
                    <div className="text-[22px] leading-7 text-black font-medium">
                      <div>
                        {formatNumber(location.state?.inputAmount)}{" "}
                        {location.state?.tokens[0]?.symbol}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-2 bg-grey-300 rounded-b-lg pt-2 pb-4 px-2 flex flex-col gap-2 relative">
                <div className="flex gap-2 items-center p-2 pb-0">
                  <div className="w-10 h-10">
                    <img
                      src={location.state?.tokens[1]?.logo || "/coin.png"}
                      className="w-full rounded-full object-cover object-center"
                    />
                  </div>
                  <div className="flex flex-col gap-0 flex-grow">
                    <div className="text-[#787575] text-base font-medium flex items-center justify-between">
                      <span>{t("components.swap.youReceive")}</span>
                      <span>
                        $
                        {formatNumber(
                          Number(location.state?.inputAmount | 0) *
                            currentPrice,
                          2,
                          3
                        )}
                      </span>
                    </div>
                    <div className="text-[22px] leading-7 text-black font-medium">
                      <div>
                        {formatNumber(location.state?.outputAmount.value, 2, 5)}{" "}
                        {location.state?.tokens[1]?.symbol}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-grey-300 rounded-lg py-3 px-4 mt-2">
                {fields.map((f, i) => (
                  <div
                    className="flex items-center justify-between pt-2 pb-3 border-b border-grey-200 last:border-b-0 last:!pb-2"
                    key={`field-${f.id}-${i}`}
                  >
                    <div className="text-primary text-base font-medium flex gap-1 items-center">
                      <span className="capitalize">{f.title}</span>
                      {!!f.tooltip ? (
                        <>
                          <IcnInfo className={f.id} />
                          <Tooltip
                            anchorSelect={`.${f.id}`}
                            place="top"
                            className="!text-[12px] !leading-[14px] !bg-primary !text-white !p-2 !max-w-[180px] !tracking-[0.1px] !rounded-lg"
                          >
                            {f.tooltip}
                          </Tooltip>
                        </>
                      ) : (
                        <></>
                      )}
                    </div>
                    <div className="text-[#787575] text-sm leading-[18px] font-normal rounded-lg flex items-center gap-[2px]">
                      {f.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute left-0 bottom-0 w-full px-4 pb-4 pt-2 z-10">
              {isProgressing ? (
                <div className="flex justify-center w-full">
                  <Loading color="#ODODOD" type="bubbles" />
                </div>
              ) : (
                <button
                  type="submit"
                  className={cn(
                    "btn primary disabled:bg-[#D1D1D1] disabled:text-grey-100 w-full",
                    {
                      "hover:bg-none hover:border-transparent": false,
                    }
                  )}
                  disabled={false}
                  onClick={onSwap}
                >
                  {t("components.layout.swap")}
                </button>
              )}
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
    </div>
  );
}

const IcnInfo = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={cn(className ? className : "")}
    >
      <path
        d="M7.99967 14.6673C11.6663 14.6673 14.6663 11.6673 14.6663 8.00065C14.6663 4.33398 11.6663 1.33398 7.99967 1.33398C4.33301 1.33398 1.33301 4.33398 1.33301 8.00065C1.33301 11.6673 4.33301 14.6673 7.99967 14.6673Z"
        stroke="#787575"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 5.33398V8.66732"
        stroke="#787575"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.99609 10.666H8.00208"
        stroke="#787575"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
