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
  Token,
} from "@utxoswap/swap-sdk-js";
import { formatNumber } from "@/shared/utils";
import ShortBalance from "@/ui/components/ShortBalance";
import { useTransactionManagerContext } from "@/ui/utils/tx-ctx";

const MIN_CAPACITY = 63;
const MIN_PRICE_IMPACT = -80;
const PRICE_IMPACT_WARNING = -5;

export default function UtxoSwap() {
  const navigate = useNavigate();
  const currentNetwork = useGetCurrentNetwork();
  const currentAccount = useGetCurrentAccount();
  const location = useLocation();

  const [typeHashDefault, setTypeHashDefault] = useState(CKB_TYPE_HASH);
  const [tokens, setTokens] = useState<[Token, Token]>();
  const [pool, setPool] = useState<Pool>(undefined);
  const [poolInfo, setPoolInfo] = useState<PoolInfo>(undefined);

  const [assetXAmount, setAssetXAmount] = useState("");
  const [slippage, setSlippage] = useState(0.5);
  const [isSlippageAuto, setIsSlippageAuto] = useState(true);
  const { currentPrice } = useTransactionManagerContext();
  const [isReverse, setIsReverse] = useState(
    location.state?.isReverse !== undefined
      ? !!location.state?.isReverse
      : false
  );

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

  const getBalanceToken = (typeHash: string) => {
    if (typeHash === CKB_TYPE_HASH) return availableCKBBalance;
    if (currentAccount.coinBalances[typeHash]) {
      return currentAccount.coinBalances[typeHash] || 0;
    }

    return 0;
  };

  const onMaxClick: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault();
    setAssetXAmount(
      new Intl.NumberFormat("en-EN", {
        maximumFractionDigits: 8,
        minimumFractionDigits: 8,
      }).format(Number(tokens ? tokens[0]?.balance : 0))
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
      const { output, priceImpact, buyPrice } =
        pool.calculateOutputAmountAndPriceImpactWithExactInput(
          _inputAmount.toString()
        );

      return {
        value: Number(output),
        priceImpact: Number(priceImpact) * 100,
        buyPrice: Number(buyPrice),
      };
    }

    return { value: 0, priceImpact: 0, buyPrice: 0 };
  }, [pool, poolInfo, inputAmount]);

  const currentState = useMemo(() => {
    return {
      ...location.state,
      tokens: tokens,
      searchKey: typeHashDefault,
      poolInfo,
      inputAmount,
      outputAmount,
      price: outputAmount.buyPrice,
      slippage: slippage,
      isSlippageAuto: isSlippageAuto,
      fees: 0.0001,
    };
  }, [
    typeHashDefault,
    tokens,
    pool,
    location.state,
    inputAmount,
    outputAmount,
    poolInfo,
    slippage,
    isSlippageAuto,
  ]);

  const getPoolDefault = async () => {
    try {
      const { list: pools } = await client.getPoolsByToken({
        pageNo: 0,
        pageSize: 1,
        searchKey: typeHashDefault,
      });

      if (pools && pools.length > 0) {
        setPoolInfo(pools[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const isValidForm = useMemo(() => {
    if (inputAmount > availableCKBBalance) return false;
    if (!poolInfo) return false;
    if (outputAmount.priceImpact < MIN_PRICE_IMPACT) return false;
    return true;
  }, [availableCKBBalance, inputAmount, outputAmount]);

  useEffect(() => {
    if (poolInfo) {
      const newTokens: [Token, Token] = isReverse
        ? [poolInfo.assetY, poolInfo.assetX]
        : [poolInfo.assetX, poolInfo.assetY];

      setTokens(newTokens);
      setPool(
        new Pool({
          tokens: newTokens,
          ckbAddress: currentAccount.accounts[0].address,
          collector,
          client,
          poolInfo: poolInfo,
        })
      );
    }
  }, [poolInfo, isReverse]);

  useEffect(() => {
    let t: NodeJS.Timeout;
    if (location.state?.poolInfo) {
      setPoolInfo(location.state?.poolInfo);
    } else if (client && typeHashDefault && !pool) {
      t = setTimeout(() => {
        getPoolDefault();
      }, 1000);
    }

    return () => {
      clearTimeout(t);
    };
  }, [client, typeHashDefault, location.state?.poolInfo]);

  useEffect(() => {
    if (location.state?.isSlippageAuto !== undefined) {
      setIsSlippageAuto(location.state?.isSlippageAuto);
    }

    if (location.state?.slippage !== undefined) {
      setSlippage(location.state?.slippage);
    }
  }, [location.state]);

  return (
    <div className="w-full h-full top-0 relative">
      <div className="!h-100vh-72px standard:!h-100vh-100px overflow-auto relative">
        <WalletPanel state={currentState} />
        {isCkbNetwork(currentNetwork.network) ? (
          <>
            <div className="px-4 py-2">
              <div className="bg-grey-300 rounded-t-lg pt-2 pb-4 px-2 flex flex-col gap-2 relative">
                <div
                  className="flex gap-2 items-center justify-between p-2 pb-0 cursor-pointer"
                  onClick={() =>
                    navigate("/swap/search-token", {
                      state: {
                        ...currentState,
                        searchKey: poolInfo
                          ? poolInfo.assetY?.typeHash
                          : typeHashDefault,
                        isFrom: true,
                      },
                    })
                  }
                >
                  <div className="w-10 h-10">
                    <img
                      src={pool?.tokens[0].logo}
                      className="w-full rounded-full object-cover object-center"
                    />
                  </div>
                  <div className="flex flex-col gap-0 flex-grow">
                    <div className="text-black text-base font-medium flex justify-between items-center leading-5">
                      <div>{pool?.tokens[0].symbol}</div>
                      <div>
                        <IcnChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="flex gap-[2px] w-full items-center text-base text-[#787575] font-normal leading-5">
                      <span>{t("components.swap.balance")}:</span>
                      <ShortBalance
                        balance={Number(
                          getBalanceToken(tokens ? tokens[0].typeHash : "")
                        )}
                        zeroDisplay={6}
                        className="!text-base !leading-5"
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
                          inputAmount > Number(tokens ? tokens[0].balance : 0),
                      }
                    )}
                    placeholder="0"
                    autoFocus={true}
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
                  <button
                    className="w-8 h-8 rounded-full"
                    onClick={() => {
                      setIsReverse(!isReverse);
                    }}
                  >
                    <IcnSwapDirect />
                  </button>
                </div>
              </div>
              <div className="mt-[2px] bg-grey-400 hover:bg-grey-300 p-2 !pb-4 rounded-b-lg flex flex-col gap-2">
                <div
                  className="flex justify-between items-center p-2 bg-[#EBECEC]/80 rounded-lg cursor-pointer"
                  onClick={() =>
                    navigate("/swap/search-token", {
                      state: {
                        ...currentState,
                        searchKey: poolInfo
                          ? poolInfo.assetX?.typeHash
                          : typeHashDefault,
                        isFrom: false,
                      },
                    })
                  }
                >
                  <div className="flex gap-2 items-center">
                    <div className="w-10 h-10">
                      <img
                        src={tokens ? tokens[1].logo : "/coin.png"}
                        className="w-full rounded-full object-cover object-center"
                      />
                    </div>
                    <div className="text-black text-base font-medium">
                      {tokens ? tokens[1].symbol : ""}{" "}
                    </div>
                  </div>

                  <div>
                    <IcnChevronDown className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-center justify-between px-2 gap-2 text-2xl leading-[30px]">
                  <input
                    className={cn(
                      "text-black text-2xl leading-[30px] bg-transparent font-medium outline-none w-[180px] flex-grow placeholder:text-grey-100"
                    )}
                    value={formatNumber(outputAmount.value, 2, 5)}
                    readOnly
                  />
                  <div className="font-medium text-base text-[#787575]">
                    ${formatNumber(inputAmount * ckbPrice, 2, 3)}
                  </div>
                </div>
              </div>
              <div className="mt-1 bg-grey-300 p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between rounded-lg">
                  <span className="text-primary text-base font-medium">
                    {t("components.swap.price")}
                  </span>
                  <div className="text-[#787575] text-sm leading-[18px] font-normal rounded-lg flex items-center gap-[2px]">
                    <div className=" whitespace-nowrap">
                      1 {tokens ? tokens[0].symbol : ""}
                    </div>
                    <IcnApproximate className="w-[9px] h-[7px]" />{" "}
                    {outputAmount.buyPrice > 0 ? (
                      <ShortBalance
                        balance={outputAmount.buyPrice}
                        zeroDisplay={6}
                        className="!text-sm"
                      />
                    ) : (
                      <span>0</span>
                    )}{" "}
                    {tokens ? tokens[1].symbol : ""}
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg">
                  <span className="text-primary text-base font-medium">
                    Price impact
                  </span>
                  <div
                    className={cn(
                      "text-[#787575] text-sm leading-[18px] font-normal rounded-lg flex items-center gap-[2px]",
                      {
                        "!text-[#FCCD13]":
                          outputAmount.priceImpact < 0 &&
                          outputAmount.priceImpact >= PRICE_IMPACT_WARNING,
                        "!text-[#FF4545]":
                          outputAmount.priceImpact < PRICE_IMPACT_WARNING,
                      }
                    )}
                  >
                    {outputAmount?.priceImpact.toFixed(2)}
                  </div>
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
                  : outputAmount.priceImpact < MIN_PRICE_IMPACT
                  ? "Price Impact Too Hight"
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
