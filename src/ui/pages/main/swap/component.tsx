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
  DEFAULT_FEE_DENOMINATOR,
  Pool,
  PoolInfo,
  Token,
} from "@utxoswap/swap-sdk-js";
import { formatNumber } from "@/shared/utils";
import ShortBalance from "@/ui/components/ShortBalance";
import { useTransactionManagerContext } from "@/ui/utils/tx-ctx";
import { apiController } from "@/background/controllers";
import { Tooltip } from "react-tooltip";
import IcnInfo from "@/ui/components/icons/IcnInfo";
import TextAvatar from "@/ui/components/text-avatar";

const MIN_CAPACITY = 63;
const MIN_PRICE_IMPACT = -80;
const PRICE_IMPACT_WARNING = -5;

const ckbToken: Token = {
  decimals: 8,
  name: "CKB",
  symbol: "CKB",
  typeHash: CKB_TYPE_HASH,
  logo: "https://storage.utxoswap.xyz/images/ckb.png",
};

const nativeTypeHash = {
  [CKB_TYPE_HASH]: "ckb",
  "0xe6396293287fefb9f26d98eb0318fe80890908f0849226ad0c8cab2d62f1e351": "btc", // BTC Testnet
  "0x3cd44aecea36e0a27e671f1fc79e65add7bf2f0e8b368389dc810ec81c63fa57": "btc", // BTC mainnet
};

export default function UtxoSwap() {
  const navigate = useNavigate();
  const currentNetwork = useGetCurrentNetwork();
  const currentAccount = useGetCurrentAccount();
  const location = useLocation();

  const [pool, setPool] = useState<Pool>(undefined);
  const [poolInfo, setPoolInfo] = useState<PoolInfo>(undefined);

  const [assetXAmount, setAssetXAmount] = useState("");
  const [slippage, setSlippage] = useState(0.5);
  const [isSlippageAuto, setIsSlippageAuto] = useState(true);
  const [isReverse, setIsReverse] = useState(
    location.state?.isReverse !== undefined
      ? !!location.state?.isReverse
      : false
  );

  const { getCoinPrice } = useTransactionManagerContext();
  const [prices, setPrices] = useState<{ typeHash: string; price: number }>({
    typeHash: "",
    price: 0,
  });

  const [tokens, setTokens] = useState<[Token, Token]>(
    !location.state?.isReverse ? [ckbToken, undefined] : [undefined, ckbToken]
  );

  const assetX = useMemo(() => {
    if (tokens && tokens.length > 0) {
      return tokens[0];
    }
    return undefined;
  }, [tokens]);

  const assetY = useMemo(() => {
    if (tokens && tokens.length > 1) {
      return tokens[1];
    }
    return undefined;
  }, [tokens]);

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

  const availableCKBBalance = useMemo(() => {
    const bal =
      Number(currentAccount.balance || 0) -
      Number(currentAccount.ordinalBalance || 0) -
      0.00001;

    return bal > 0 ? bal : 0;
  }, [currentAccount]);

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

  const totalOutputUsd = useMemo(() => {
    if (outputAmount.value === 0 || inputAmount === 0) return 0;
    if (!!prices.typeHash && prices.price > 0) {
      if (assetX?.typeHash === prices.typeHash) {
        return prices.price * inputAmount;
      }

      if (assetY?.typeHash === prices.typeHash) {
        return prices.price * outputAmount.value;
      }
    }

    return 0;
  }, [assetX, assetY, prices, inputAmount, outputAmount]);

  const fee = useMemo(() => {
    const rate = poolInfo ? poolInfo.feeRate : 30;
    return (rate / DEFAULT_FEE_DENOMINATOR) * inputAmount;
  }, [poolInfo, inputAmount]);

  const isShowPrice = useMemo(() => {
    return assetX && assetY && inputAmount > 0 && outputAmount.value > 0;
  }, [assetX, assetY, inputAmount, outputAmount]);

  const getBalanceToken = (typeHash: string) => {
    if (typeHash === CKB_TYPE_HASH) return availableCKBBalance;
    if (currentAccount.coinBalances[typeHash]) {
      return currentAccount.coinBalances[typeHash] || 0;
    }

    return 0;
  };

  const onMaxClick: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault();
    const balance = assetX ? getBalanceToken(assetX.typeHash) : 0;
    setAssetXAmount(
      new Intl.NumberFormat("en-EN", {
        maximumFractionDigits: 8,
        minimumFractionDigits: 8,
      }).format(Number(balance))
    );
  };

  const currentState = useMemo(() => {
    return {
      ...location.state,
      tokens: tokens,
      poolInfo,
      inputAmount,
      outputAmount,
      price: outputAmount.buyPrice,
      slippage: slippage,
      isSlippageAuto: isSlippageAuto,
      isReverse: isReverse,
      networkFee: 0.0001,
      fee: fee,
    };
  }, [
    tokens,
    pool,
    location.state,
    inputAmount,
    outputAmount,
    poolInfo,
    slippage,
    isSlippageAuto,
    isReverse,
  ]);

  const isValidForm = useMemo(() => {
    if (tokens.length < 2) return false;
    if (tokens[0] === undefined || tokens[1] === undefined) return false;
    if (!pool) return false;
    if (!poolInfo) return false;
    if (inputAmount > getBalanceToken(assetX?.typeHash)) return false;
    if (outputAmount.priceImpact < MIN_PRICE_IMPACT) return false;
    return true;
  }, [inputAmount, outputAmount, tokens, pool, assetX]);

  const changeAssetXAmount = (e: any) => {
    const reg = /^\d*\.?\d*$/;
    let numeric = e.target.value.replace(/,/g, "");

    if (
      numeric.startsWith("0") &&
      numeric !== "0" &&
      !numeric.startsWith("0.")
    ) {
      numeric = numeric.replace(/^0+/, "0");
    }

    if (reg.test(numeric) || numeric === "") {
      if (numeric !== "" && !numeric.endsWith(".")) {
        setAssetXAmount(new Intl.NumberFormat("en-EN").format(Number(numeric)));
      }

      setAssetXAmount(numeric);
    }
  };

  useEffect(() => {
    if (
      poolInfo &&
      tokens.length === 2 &&
      tokens[0] !== undefined &&
      tokens[1] !== undefined
    ) {
      setPool(
        new Pool({
          tokens: tokens,
          ckbAddress: currentAccount.accounts[0].address,
          collector,
          client,
          poolInfo: poolInfo,
        })
      );
    }
  }, [poolInfo, tokens]);

  useEffect(() => {
    if (location.state?.poolInfo !== undefined) {
      if (
        location.state.poolInfo.assetX?.typeHash !==
          poolInfo?.assetX?.typeHash ||
        location.state.poolInfo.assetY?.typeHash !== poolInfo?.assetY?.typeHash
      ) {
        setPoolInfo(location.state?.poolInfo);
      }
    }

    if (
      location.state?.tokens !== undefined &&
      typeof location.state?.tokens === "object" &&
      location.state?.tokens.length === 2
    ) {
      const newTokens: [Token, Token] = [
        location.state?.tokens[0],
        location.state?.tokens[1],
      ];

      setTokens(newTokens);
    }

    if (location.state?.isSlippageAuto !== undefined) {
      setIsSlippageAuto(location.state?.isSlippageAuto);
    }

    if (location.state?.slippage !== undefined) {
      setSlippage(location.state?.slippage);
    }
  }, [location.state]);

  useEffect(() => {
    const f = async () => {
      let typeHash = "";
      if (nativeTypeHash[assetX?.typeHash]) {
        typeHash = assetX?.typeHash;
      } else if (nativeTypeHash[assetY?.typeHash]) {
        typeHash = assetY?.typeHash;
      }

      if (!!typeHash) {
        const price = await getCoinPrice(nativeTypeHash[typeHash]);
        setPrices((prev) => {
          return { ...prev, typeHash: typeHash, price: price.usd };
        });
      }
    };

    f().catch((e) => {
      console.log(e);
    });
  }, [tokens]);

  const SelectToken = ({ state }: { state: any }) => {
    return (
      <div className="py-[10px] px-2">
        <div
          className={cn(
            "flex py-2 px-3 gap-1 rounded-[100px] border border-[#787575] items-center justify-center w-[125px] cursor-pointer hover:bg-grey-200 hover-border-primary transition-all"
          )}
          onClick={() => navigate("/swap/search-token", { state })}
        >
          <div className="capitalize text-sm leading-5 text-black font-medium">
            {t("components.swap.selectToken")}
          </div>
          <IcnChevronDown className="w-3 h-3 !stroke-primary" />
        </div>
      </div>
    );
  };

  const SwapFrom = () => {
    const state = {
      ...currentState,
      assetX: assetX || ckbToken,
      assetY: assetY,
      isChangeAssetX: true,
    };
    return (
      <div className="bg-grey-300 p-2 !pb-4 rounded-t-lg flex flex-col gap-2 relative">
        {assetX ? (
          <div
            className="p-2 flex gap-2 items-center justify-between cursor-pointer hover:bg-grey-200 rounded-lg"
            onClick={() => navigate("/swap/search-token", { state })}
          >
            <div className="w-10 h-10">
              {!!assetX.logo ? (
                <img
                  src={assetX.logo}
                  className="w-full rounded-full object-cover object-center"
                />
              ) : (
                <TextAvatar text={assetX.symbol} />
              )}
            </div>
            <div className="flex gap-0 flex-grow justify-between items-center">
              <div className="text-black text-base leading-[22px] font-medium flex flex-col items-start">
                <div>{assetX ? assetX.symbol : ""}</div>
                <div className="flex gap-1 w-full items-center text-[#787575]">
                  <span className="text-sm leading-4 font-medium">
                    {t("components.swap.balance")}:
                  </span>
                  <ShortBalance
                    balance={Number(
                      getBalanceToken(assetX ? assetX.typeHash : "")
                    )}
                    zeroDisplay={6}
                    className="!text-sm !leading-[14px] font-medium"
                  />
                </div>
              </div>
              <div>
                <IcnChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>
        ) : (
          <SelectToken state={state} />
        )}
        <div className="flex items-center justify-between gap-2 px-2">
          <input
            className={cn(
              "text-black text-2xl leading-6 h-6 bg-transparent font-medium outline-none placeholder:text-grey-100 flex-grow",
              {
                "!text-[#FF4545]":
                  inputAmount > getBalanceToken(assetX?.typeHash),
              }
            )}
            placeholder="0"
            autoFocus={true}
            value={assetXAmount}
            onChange={changeAssetXAmount}
          />
          <button
            className="text-black text-base font-medium cursor-pointer"
            onClick={onMaxClick}
          >
            {t("components.swap.max")}
          </button>
        </div>

        <div className="absolute -bottom-5 flex w-full items-center justify-center">
          <button
            className="w-9 h-9 rounded-full group"
            onClick={() => {
              const newToken: [Token, Token] = [tokens[1], tokens[0]];
              setTokens(newToken);
              setIsReverse(!isReverse);
              setAssetXAmount(outputAmount.value.toString());
            }}
          >
            <IcnSwapDirect className="w-9 h-9" />
          </button>
        </div>
      </div>
    );
  };

  const SwapTo = () => {
    const state = {
      ...currentState,
      assetX: assetX || ckbToken,
      assetY: assetY,
      isChangeAssetX: false,
    };

    return (
      <div className="mt-[2px] bg-grey-300 p-2 !pb-4 rounded-b-lg flex flex-col gap-2">
        {assetY ? (
          <div
            className="flex p-2 justify-between items-center hover:bg-grey-200 rounded-lg cursor-pointer"
            onClick={() => navigate("/swap/search-token", { state })}
          >
            <div className="flex gap-2 items-center">
              <div className="w-10 h-10">
                {!!assetY?.logo ? (
                  <img
                    src={assetY.logo}
                    className="w-full rounded-full object-cover object-center"
                  />
                ) : (
                  <TextAvatar text={assetY?.symbol} className="w-10 h-10" />
                )}
              </div>
              <div className="text-black text-base font-medium">
                {assetY ? assetY.symbol : ""}{" "}
              </div>
            </div>

            <IcnChevronDown className="w-4 h-4" />
          </div>
        ) : (
          <SelectToken state={state} />
        )}
        <div className="flex items-center justify-between gap-2 text-2xl leading-6 px-2">
          <input
            className={cn(
              "h-6 text-black text-2xl leading-6 bg-transparent font-medium outline-none w-[180px] flex-grow placeholder:text-grey-100",
              {
                "text-grey-100": outputAmount.value === 0,
              }
            )}
            value={
              outputAmount.value > 0
                ? formatNumber(outputAmount.value, 2, 8)
                : "0"
            }
            readOnly
          />
          <div className="font-medium text-base text-[#787575]">
            ${formatNumber(totalOutputUsd, 2, 3)}
          </div>
        </div>
      </div>
    );
  };

  const Prices = () => {
    return (
      <div className="mt-1 bg-grey-300 py-2 px-4 flex flex-col rounded-lg">
        <div className="flex items-center justify-between border-b border-b-grey-200 pt-2 pb-3">
          <span className="text-primary text-base font-medium capitalize">
            {t("components.swap.price")}
          </span>
          <div className="text-[#787575] text-sm leading-[18px] font-normal flex items-center gap-[2px]">
            <div className=" whitespace-nowrap">
              1 {tokens ? tokens[0].symbol : ""}
            </div>
            <IcnApproximate className="w-[9px] h-[7px]" />{" "}
            {outputAmount.buyPrice > 0 ? (
              <ShortBalance
                balance={outputAmount.buyPrice}
                zeroDisplay={8}
                className="!text-sm"
              />
            ) : (
              <span>0</span>
            )}{" "}
            {assetY ? assetY.symbol : ""}
          </div>
        </div>
        <div className="flex items-center justify-between border-b border-b-grey-200 pt-2 pb-3">
          <div className="text-primary text-base font-medium flex gap-1 items-center">
            <span className="text-primary text-base font-medium capitalize">
              {t("components.swap.priceImpact")}
            </span>
            <IcnInfo className={"priceImpact"} />
            <Tooltip
              anchorSelect={`.priceImpact`}
              place="top"
              className="!text-[12px] !leading-[14px] !bg-primary !text-white !p-2 !max-w-[180px] !tracking-[0.1px] !rounded-lg"
            >
              {t("components.swap.tooltip.priceImpack")}
            </Tooltip>
          </div>
          <div
            className={cn(
              "text-[#787575] text-sm leading-[18px] font-normal flex items-center gap-[2px]",
              {
                "!text-[#FCCD13]":
                  Number(outputAmount.priceImpact.toFixed(2)) < 0 &&
                  Number(outputAmount.priceImpact.toFixed(2)) >=
                    PRICE_IMPACT_WARNING,
                "!text-[#FF4545]":
                  outputAmount.priceImpact < PRICE_IMPACT_WARNING,
              }
            )}
          >
            {outputAmount.priceImpact.toFixed(2)}%
          </div>
        </div>
        <div className="flex items-center justify-between py-2">
          <div className="text-primary text-base font-medium flex gap-1 items-center">
            <span className="text-primary text-base font-medium capitalize">
              {t("components.swap.fee")}
            </span>
            <IcnInfo className={"fee"} />
            <Tooltip
              anchorSelect={`.fee`}
              place="top"
              className="!text-[12px] !leading-[14px] !bg-primary !text-white !p-2 !max-w-[180px] !tracking-[0.1px] !rounded-lg"
            >
              {t("components.swap.tooltip.fees")}
            </Tooltip>
          </div>
          <div
            className={cn(
              "text-[#787575] text-sm leading-[18px] font-normal flex items-center gap-[2px]"
            )}
          >
            {fee}%
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full top-0 relative">
      <div className="!h-100vh-72px standard:!h-100vh-100px overflow-auto relative">
        <WalletPanel state={currentState} />
        {isCkbNetwork(currentNetwork.network) ? (
          <>
            <div className="p-4">
              <SwapFrom />
              <SwapTo />
              {isShowPrice && <Prices />}
            </div>
            <div className="absolute bottom-0 left-0 w-full px-4 pb-4 pt-2 standard:bottom-12">
              {isShowPrice && (
                <button
                  type="submit"
                  className={cn(
                    "btn primary disabled:bg-[#D1D1D1] disabled:text-grey-100 w-full capitalize",
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
                  {inputAmount > getBalanceToken(assetX?.typeHash)
                    ? t("components.swap.insufficient_balance")
                    : outputAmount.priceImpact < MIN_PRICE_IMPACT
                    ? t("components.swap.priceImpactTooHight")
                    : t("components.swap.reviewOrder")}
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
      <rect
        width="32"
        height="32"
        rx="16"
        className="fill-primary group-hover:fill-[#2C2C2C]"
      />
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
