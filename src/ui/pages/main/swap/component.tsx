import { isCkbNetwork } from "@/shared/networks";
import cn from "classnames";
import BottomPanel from "../wallet/bottom-panel";
import WalletPanel from "./wallet-panel";
import { useLocation, useNavigate } from "react-router-dom";
import {
  useGetCurrentAccount,
  useGetCurrentNetwork,
} from "@/ui/states/walletState";
import { t } from "i18next";
import { IcnApproximate, IcnChevronDown } from "@/ui/components/icons";
import { MouseEventHandler, useEffect, useMemo, useState } from "react";
import {
  CKB_TYPE_HASH,
  Client,
  Collector,
  Pool,
  PoolInfo,
} from "@utxoswap/swap-sdk-js";
import { formatNumber } from "@/shared/utils";
import ShortBalance from "@/ui/components/ShortBalance";
import { useTransactionManagerContext } from "@/ui/utils/tx-ctx";

const MIN_CAPACITY = 63;

export default function UtxoSwap() {
  const navigate = useNavigate();
  const currentNetwork = useGetCurrentNetwork();
  const currentAccount = useGetCurrentAccount();
  const location = useLocation();
  const [typeHashDefault, setTypeHashDefault] = useState(CKB_TYPE_HASH);
  const [pool, setPool] = useState<Pool>(undefined);
  const [poolInfo, setPoolInfo] = useState<PoolInfo>(undefined);
  const [assetXAmount, setAssetXAmount] = useState("");
  const { currentPrice } = useTransactionManagerContext();

  const ckbPrice = useMemo(() => {
    return currentPrice ? Number(currentPrice) : 0;
  }, [currentPrice]);

  const availableCKBBalance = useMemo(() => {
    const bal =
      Number(currentAccount.balance || 0) -
      Number(currentAccount.ordinalBalance || 0) -
      0.00001;

    return bal > 0 ? bal : 0;
  }, [currentAccount]);

  const onMaxClick: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault();
    setAssetXAmount(
      new Intl.NumberFormat("en-EN", {
        maximumFractionDigits: 8,
        minimumFractionDigits: 8,
      }).format(availableCKBBalance)
    );
  };

  const inputAmount = useMemo(() => {
    if (!!assetXAmount) {
      return Number(assetXAmount.replaceAll(",", ""));
    }
    return 0;
  }, [assetXAmount]);

  const outputAmount = useMemo(() => {
    if (pool) {
      const _inputAmount = Number(inputAmount);
      const { output } = pool.calculateOutputAmountAndPriceImpactWithExactInput(
        _inputAmount.toString()
      );
      return Number(output);
    }

    return 0;
  }, [pool, poolInfo, inputAmount]);

  const currentState = useMemo(() => {
    return {
      ...location.state,
      searchKey: typeHashDefault,
      poolInfo,
      inputAmount,
      outputAmount,
      price: inputAmount > 0 ? outputAmount / inputAmount : 0,
      slippage: 0.5,
      fees: 0.00001,
    };
  }, [
    typeHashDefault,
    pool,
    location.state,
    inputAmount,
    outputAmount,
    poolInfo,
  ]);

  const isValidForm = useMemo(() => {
    if (inputAmount > availableCKBBalance) return false;
    if (inputAmount < MIN_CAPACITY) return false;
    if (!poolInfo) return false;
    return true;
  }, [availableCKBBalance, inputAmount, outputAmount]);

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

  useEffect(() => {
    const getPoolDefault = async () => {
      try {
        const { list: pools } = await client.getPoolsByToken({
          pageNo: 0,
          pageSize: 1,
          searchKey: typeHashDefault,
        });

        if (pools && pools.length > 0) {
          setPool(
            new Pool({
              tokens: [pools[0].assetX, pools[0].assetY],
              ckbAddress: currentAccount.accounts[0].address,
              collector,
              client,
              poolInfo: pools[0],
            })
          );
          setPoolInfo(pools[0]);
        }
      } catch (e) {
        console.error(e);
      }
    };

    let t: NodeJS.Timeout;
    if (location.state?.poolInfo && pool?.tokens !== location.state?.poolInfo) {
      setPool(
        new Pool({
          tokens: [
            location.state?.poolInfo.assetX,
            location.state?.poolInfo.assetY,
          ],
          ckbAddress: currentAccount.accounts[0].address,
          collector,
          client,
          poolInfo: location.state?.poolInfo,
        })
      );
      setPoolInfo(location.state?.poolInfo);
    } else if (client && typeHashDefault && !pool) {
      t = setTimeout(() => {
        getPoolDefault();
      }, 1000);
    }

    return () => {
      clearTimeout(t);
    };
  }, [client, typeHashDefault, location.state]);

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
                      src={pool?.tokens[0].logo}
                      className="w-full rounded-full object-cover object-center"
                    />
                  </div>
                  <div className="flex flex-col gap-0 flex-grow">
                    <div className="text-black text-base font-medium">
                      {pool?.tokens[0].symbol}
                    </div>
                    <div className="flex justify-between w-full items-center text-base text-[#787575] font-normal">
                      <span>{t("components.swap.balance")}:</span>
                      <ShortBalance
                        balance={Number(availableCKBBalance)}
                        zeroDisplay={6}
                        className="!text-base"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between px-2 gap-2">
                  <input
                    className={cn(
                      "text-black text-2xl leading-[30px] bg-transparent font-medium outline-none placeholder:text-grey-100 flex-grow",
                      {
                        "!text-[#FF4545]":
                          inputAmount < MIN_CAPACITY ||
                          inputAmount > availableCKBBalance,
                      }
                    )}
                    placeholder="0"
                    autoFocus
                    value={assetXAmount}
                    onChange={(e) => {
                      const reg = /^(\d+(\.\d{0,})?)?$/;
                      const numeric = e.target.value.replace(/,/g, "");

                      if (reg.test(numeric)) {
                        setAssetXAmount(
                          new Intl.NumberFormat("en-EN").format(Number(numeric))
                        );
                      }
                    }}
                  />
                  <button
                    className="text-black text-base font-medium cursor-pointer"
                    onClick={onMaxClick}
                  >
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
                    navigate("/swap/search-token", { state: currentState })
                  }
                >
                  <div className="flex gap-2 items-center">
                    <div className="w-10 h-10">
                      <img
                        src={pool?.tokens[1].logo || "/coin.png"}
                        className="w-full rounded-full object-cover object-center"
                      />
                    </div>
                    <div className="text-black text-base font-medium">
                      {pool?.tokens[1].symbol}
                    </div>
                  </div>

                  <div className="p-2">
                    <IcnChevronDown className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-center justify-between px-2 gap-2 text-2xl leading-[30px]">
                  <div
                    className={cn(
                      "text-black text-2xl leading-[30px] bg-transparent font-medium outline-none min-w-[100px] flex-grow",
                      { "text-grey-100": outputAmount <= 0 }
                    )}
                  >
                    {formatNumber(outputAmount, 2, 5)}
                  </div>
                  <div className="font-medium text-base text-[#787575]">
                    ${formatNumber(inputAmount * ckbPrice, 2, 3)}
                  </div>
                </div>
              </div>
              <div className="mt-1 bg-grey-300 p-4 flex items-center justify-between rounded-lg">
                <span className="text-primary text-base font-medium">
                  {t("components.swap.price")}
                </span>
                <div className="text-[#787575] text-sm leading-[18px] font-normal rounded-lg flex items-center gap-[2px]">
                  {`1 ${poolInfo?.assetX.symbol}`}{" "}
                  <IcnApproximate className="w-[9px] h-[7px]" />{" "}
                  {inputAmount > 0 ? (
                    <ShortBalance
                      balance={outputAmount / inputAmount}
                      zeroDisplay={6}
                      className="!text-sm"
                    />
                  ) : (
                    <span>0</span>
                  )}{" "}
                  {poolInfo?.assetY.symbol}
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full px-4 pb-4 pt-2 standard:bottom-12">
              <button
                type="submit"
                className={cn(
                  "btn primary disabled:bg-[#D1D1D1] disabled:text-grey-100 w-full",
                  {
                    "hover:bg-none hover:border-transparent": !isValidForm,
                  }
                )}
                disabled={!isValidForm}
                onClick={() =>
                  navigate("/pages/swap/review-order", {
                    state: { ...currentState },
                  })
                }
              >
                {inputAmount > availableCKBBalance
                  ? t("components.swap.insufficient_balance")
                  : t("send.create_send.continue")}
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
