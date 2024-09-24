import { isCkbNetwork } from "@/shared/networks";
import WalletPanel from "../wallet-panel";
import {
  useGetCurrentAccount,
  useGetCurrentNetwork,
} from "@/ui/states/walletState";
import { t } from "i18next";
import cn from "classnames";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { shortAddress } from "@/shared/utils/transactions";
import Loading from "react-loading";
import { Client, Collector, Pool, PoolInfo } from "@utxoswap/swap-sdk-js";

const IcnSearch = ({ className }: { className?: string }) => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(className ? className : "")}
    >
      <path
        d="M15.4995 14H14.7095L14.4295 13.73C15.0544 13.0039 15.5112 12.1487 15.767 11.2256C16.0229 10.3024 16.0715 9.33413 15.9095 8.38998C15.4395 5.60998 13.1195 3.38997 10.3195 3.04997C9.3351 2.92544 8.33527 3.02775 7.39651 3.34906C6.45775 3.67038 5.60493 4.20219 4.90332 4.90381C4.20171 5.60542 3.66989 6.45824 3.34858 7.397C3.02726 8.33576 2.92495 9.33559 3.04949 10.32C3.38949 13.12 5.60949 15.44 8.38949 15.91C9.33364 16.072 10.3019 16.0234 11.2251 15.7675C12.1483 15.5117 13.0035 15.0549 13.7295 14.43L13.9995 14.71V15.5L18.2495 19.75C18.6595 20.16 19.3295 20.16 19.7395 19.75C20.1495 19.34 20.1495 18.67 19.7395 18.26L15.4995 14ZM9.49949 14C7.00949 14 4.99949 11.99 4.99949 9.49997C4.99949 7.00997 7.00949 4.99997 9.49949 4.99997C11.9895 4.99997 13.9995 7.00997 13.9995 9.49997C13.9995 11.99 11.9895 14 9.49949 14Z"
        fill="#ABA8A1"
      />
    </svg>
  );
};
export default function UTXOSwapSearchToken() {
  const location = useLocation();
  const [pools, setPools] = useState<PoolInfo[]>([]);
  const [textSearch, setTextSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const currentNetwork = useGetCurrentNetwork();
  const navigate = useNavigate();
  const keySearch = useMemo(() => {
    if (location.state?.searchKey) {
      return location.state.searchKey;
    }
    return "0x0000000000000000000000000000000000000000000000000000000000000000"; // CKB
  }, [location.state]);

  const isFrom = useMemo(() => {
    return !!location.state.isFrom;
  }, [location.state]);

  const client = useMemo(() => {
    if (isCkbNetwork(currentNetwork.network)) {
      return new Client(
        currentNetwork.slug === "nervos",
        currentNetwork.network.utxoAPIKey
      );
    }
    return undefined;
  }, [currentNetwork]);

  const tokens = useMemo(() => {
    if (pools.length === 0) return [];
    if (!textSearch) return pools;

    return pools.filter(
      (p) =>
        p.assetY.symbol
          .toLowerCase()
          .includes(textSearch.toLowerCase().trim()) ||
        p.assetY.name.toLowerCase().includes(textSearch.toLowerCase().trim())
    );
  }, [pools, textSearch]);

  const loadTokens = async () => {
    setIsLoading(true);
    try {
      const { list: pools } = await client.getPoolsByToken({
        pageNo: 0,
        pageSize: 200,
        searchKey: keySearch,
      });

      if (pools && pools.length > 0) {
        setPools(pools);
      }
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const t = setTimeout(() => {
      if (pools.length === 0) {
        loadTokens();
      }
    }, 1000);

    return () => {
      clearTimeout(t);
    };
  }, [pools, isLoading]);

  return (
    <div className="w-full h-full relative">
      <WalletPanel />
      {isCkbNetwork(currentNetwork.network) ? (
        <>
          <div className="p-4">
            <div className="border border-grey-200 rounded-lg py-[10px] px-4 bg-grey-300 flex gap-1">
              <IcnSearch className="w-6 h-6" />
              <input
                placeholder="Search..."
                className="flex-grow placeholder:text-grey-100 text-base font-normal bg-transparent text-grey-100"
                type="text"
                onChange={(e) => setTextSearch(e.target.value)}
                value={textSearch}
              />
            </div>
            <div className="flex flex-col gap-2 mt-2 pb-[80px]">
              {isLoading && (
                <div className="flex justify-center mt-4">
                  <Loading
                    type="spin"
                    color="#ODODOD"
                    width={"3rem"}
                    height={"3rem"}
                    className="react-loading pr-2"
                  />
                </div>
              )}
              {tokens.length > 0
                ? tokens.map((t, i) => {
                    const isAssetXMatched = t.assetX.typeHash === keySearch;
                    const assetX =
                      (isFrom && isAssetXMatched) ||
                      (!isFrom && !isAssetXMatched)
                        ? t.assetY
                        : t.assetX;

                    const assetY =
                      t.assetY.typeHash === assetX.typeHash
                        ? t.assetX
                        : t.assetY;

                    const assetDisplay = isFrom ? assetX : assetY;

                    return (
                      <div
                        key={`token-${t.batchId}-${i}`}
                        className={cn(
                          "flex gap-2 items-center py-4 px-3 bg-grey-300 rounded-lg cursor-pointer hover:bg-grey-200",
                          {
                            "!bg-grey-200":
                              assetDisplay?.typeScript?.args ===
                              (isFrom
                                ? location.state?.poolInfo?.assetX?.typeScript
                                    ?.args
                                : location.state?.poolInfo?.assetY?.typeScript
                                    ?.args),
                          }
                        )}
                        onClick={() =>
                          navigate("/swap", {
                            state: {
                              ...location.state,
                              poolInfo: {
                                ...t,
                              },
                            },
                          })
                        }
                      >
                        <div className="w-10 h-10">
                          <img
                            src={assetDisplay.logo || "/coin.png"}
                            className="w-full rounded-full object-cover object-center"
                          />
                        </div>
                        <div className="flex flex-col gap-0 flex-grow">
                          <div className="text-primary text-base font-medium leading-6">
                            {assetDisplay.symbol}{" "}
                            {!!assetDisplay.name && `(${assetDisplay.name})`}
                          </div>
                          <div className="text-sm leading-[18px] text-[#787575] font-normal">
                            {shortAddress(assetDisplay.typeScript?.args, 7)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                : !isLoading && (
                    <div className="px-4 py-3 text-sm text-grey-100">
                      <div className="w-full items-center flex flex-col justify-start gap-6 text-base text-grey-100 capitalize mt-6">
                        {t("components.swap.noAssetsAvailable")}
                        <img src="/no-tokens.png" />
                      </div>
                    </div>
                  )}
            </div>
          </div>
          <div className="fixed bottom-0 w-full px-4 pb-4 pt-2 bg-white">
            <button
              type="submit"
              className={cn("btn primary standard:m-6 standard:mb-3 w-full")}
              onClick={() =>
                navigate("/swap", {
                  state: { ...location.state },
                })
              }
            >
              {t("components.swap.close")}
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
  );
}
