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
import {
  CKB_TYPE_HASH,
  Client,
  Collector,
  Pool,
  SWAP_OCCUPIED_CKB_AMOUNT,
} from "@utxoswap/swap-sdk-js";
import { useControllersState } from "@/ui/states/controllerState";
import Loading from "react-loading";
import toast from "react-hot-toast";
import TextAvatar from "@/ui/components/text-avatar/component";
import IcnInfo from "@/ui/components/icons/IcnInfo";
import { useAppState } from "@/ui/states/appState";

export default function UTXOReviewOrder() {
  const [isProgressing, setIsProgressing] = useState(false);
  const navigate = useNavigate();
  const { currentPrice } = useTransactionManagerContext();
  const currentNetwork = useGetCurrentNetwork();
  const currentAccount = useGetCurrentAccount();
  const { keyringController } = useControllersState((v) => ({
    apiController: v.apiController,
    keyringController: v.keyringController,
  }));
  const { swapSetting } = useAppState();

  const swapOccupiedCKBAmount = useMemo(() => {
    return Number(SWAP_OCCUPIED_CKB_AMOUNT) / 10 ** 8;
  }, []);

  const availableCKBBalance = useMemo(() => {
    const bal =
      Number(currentAccount.balance || 0) -
      Number(currentAccount.ordinalBalance || 0) -
      0.00001;

    return bal > 0 ? bal : 0;
  }, [currentAccount]);

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
        id: "reviewPriceImpact",
        title: t("components.swap.price_impact"),
        value: <>{state.outputAmount.priceImpact.toFixed(3)}%</>,
        tooltip: t("components.swap.tooltip.price_impact"),
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
        title: t("components.swap.max_slippage"),
        value: <>{swapSetting.slippage}%</>,
        tooltip: t("components.swap.tooltip.max_slippage"),
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
      if (availableCKBBalance < swapOccupiedCKBAmount) {
        setIsProgressing(false);
        return toast.error(t("components.swap.tooltip.balance_reservation"));
      }
      pool.calculateOutputAmountAndPriceImpactWithExactInput(
        `${location.state?.inputAmount}`
      );

      const txHash = await pool.swapWithExactInput(
        signTxFunc,
        `${swapSetting.slippage.toString()}`,
        5000
      );

      navigate(`/pages/swap/swap-success/${txHash}`, {
        state: { ...location.state, txId: txHash },
      });
    } catch (e: any) {
      switch (e.code as number) {
        case 1:
          toast.error("Insufficient CKB capacity. Please try again");
          break;
        case 2:
          toast.error(
            `Insufficient ${pool.tokens[0].symbol ?? "free UDT"} balance`
          );
          break;
        default:
          toast.error((e as any)?.message ?? "Unknown error");
      }
    }
    setIsProgressing(false);
  };

  return (
    <div className="w-full h-full top-0 relative">
      <div className={cn("standard:h-[calc(100dvh_-_140px)]")}>
        {isCkbNetwork(currentNetwork.network) ? (
          <>
            <div className="p-4">
              <div className="bg-grey-300 rounded-t-lg pt-2 pb-4 px-2 flex flex-col gap-2 relative">
                <div className="flex gap-2 items-center p-2 pb-0">
                  <div className="w-10 h-10">
                    {!!location.state?.tokens[0]?.logo ? (
                      <img
                        src={location.state?.tokens[0]?.logo}
                        className="w-full rounded-full object-cover object-center"
                      />
                    ) : (
                      <TextAvatar
                        text={location.state?.tokens[0]?.symbol}
                        className="w-10 h-10"
                      />
                    )}
                  </div>
                  <div className="flex flex-col gap-0 flex-grow">
                    <div className="text-[#787575] text-base font-medium">
                      {t("components.swap.you_pay")}
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

              <div className="mt-[2px] bg-grey-300 rounded-b-lg pt-2 pb-4 px-2 flex flex-col gap-2 relative">
                <div className="flex gap-2 items-center p-2 pb-0">
                  <div className="w-10 h-10">
                    {!!location.state?.tokens[1]?.logo ? (
                      <img
                        src={location.state?.tokens[1]?.logo}
                        className="w-full rounded-full object-cover object-center"
                      />
                    ) : (
                      <TextAvatar
                        text={location.state?.tokens[1]?.symbol}
                        className="w-10 h-10"
                      />
                    )}
                  </div>
                  <div className="flex flex-col gap-0 flex-grow">
                    <div className="text-[#787575] text-base font-medium flex items-center justify-between">
                      <span>{t("components.swap.you_receive")}</span>
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

              <div className="bg-grey-300 rounded-lg py-2 px-4 mt-2">
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
