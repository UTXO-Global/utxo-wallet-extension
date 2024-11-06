import {
  useGetCurrentAccount,
  useGetCurrentNetwork,
} from "@/ui/states/walletState";
import { useEffect, useMemo, useState } from "react";
import Loading from "react-loading";
import TransactionList from "@/ui/components/transactions-list";
import { IcnCopy, IcnReceive, IcnSend } from "@/ui/components/icons";
import toast from "react-hot-toast";
import { NETWORK_ICON, isCkbNetwork } from "@/shared/networks";
import { t } from "i18next";
import cn from "classnames";
import Analytics from "@/ui/utils/gtm";
import { useNavigate, useParams } from "react-router-dom";
import ReceiveAddress from "@/ui/components/receive-address";
import { formatNumber } from "@/shared/utils";
import { fetchExploreAPI } from "@/ui/utils/helpers";
import { CKBTokenInfo } from "@/shared/networks/ckb/types";
import { useGetCKBAddressInfo } from "@/ui/hooks/address-info";
import { shortAddress } from "@/shared/utils/transactions";
import ShortBalance from "@/ui/components/ShortBalance";
import TextAvatar from "@/ui/components/text-avatar/component";
import DOMPurify from "dompurify";

const COIN_NATIVE_NAME = {
  CKB: "Nervos CKB",
  BTC: "Bitcoin",
  tBTC: "Bitcoin Testnet",
  sBTC: "Bitcoin Signet",
};

const TokenDetail = () => {
  const { type, typeHash } = useParams();
  const [isShowReceive, setIsShowReceive] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<CKBTokenInfo | undefined>(
    undefined
  );
  const currentAccount = useGetCurrentAccount();
  const currentNetwork = useGetCurrentNetwork();
  const navigate = useNavigate();
  const { isLoading: addressInfoLoading, addressInfo } = useGetCKBAddressInfo();

  const isNativeToken = useMemo(() => {
    return (
      type === currentNetwork.coinSymbol &&
      typeHash === currentNetwork.coinSymbol
    );
  }, [type, typeHash]);

  const currentToken = useMemo(() => {
    if (!addressInfo) return;

    return addressInfo.attributes.udt_accounts.find(
      (t) => t.type_hash === typeHash && t.udt_type === type
    );
  }, [addressInfoLoading, addressInfo]);

  const getToken = async () => {
    if (
      type === currentNetwork.coinSymbol &&
      typeHash === currentNetwork.coinSymbol
    ) {
      setTokenInfo({
        attributes: {
          symbol: currentNetwork.coinSymbol,
          full_name: COIN_NATIVE_NAME[currentNetwork.coinSymbol],
          icon_file: NETWORK_ICON[currentNetwork.slug],
          decimal: "8",
        },
      });
      return;
    }
    if (isLoading) return;
    setIsLoading(true);

    try {
      const path = `/v1/${
        type === "xudt_compatible" ? "xudt" : type
      }s/${typeHash}`;
      const res = await fetchExploreAPI(currentNetwork.slug, path);
      const { data } = await res.json();
      setTokenInfo(data as CKBTokenInfo);
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  const ckbBalance = useMemo(() => {
    const bal =
      Number(currentAccount.balance || 0) -
      Number(currentAccount.ordinalBalance || 0);

    return bal > 0 ? bal : 0;
  }, [currentAccount]);

  const ckbOccupiedBalance = useMemo(() => {
    return currentAccount.ordinalBalance
      ? Number(currentAccount.ordinalBalance)
      : 0;
  }, [currentAccount.ordinalBalance]);

  const tokenBalence = useMemo(() => {
    if (isNativeToken) {
      return ckbBalance;
    }

    if (!currentToken) return 0;

    return Number(currentToken.amount) / 10 ** Number(currentToken.decimal);
  }, [ckbBalance, currentToken]);

  const panelNavs = useMemo(() => {
    return isCkbNetwork(currentNetwork.network)
      ? [
          {
            navPath: `/pages/receive/${currentAccount.accounts[0].address}`,
            navName: "pf_receive",
            navLabel: "receive",
            icon: <IcnReceive />,
            title: t("wallet_page.receive"),
          },
          {
            navPath: "/pages/create-send",
            navName: "pf_send",
            navLabel: "send",
            icon: <IcnSend />,
            title: t("wallet_page.send"),
          },
        ]
      : [
          {
            navPath: "/pages/receive",
            navName: "pf_receive",
            navLabel: "receive",
            icon: <IcnReceive />,
            title: t("wallet_page.receive"),
            isPopup: true,
          },
          {
            navPath: "/pages/create-send",
            navName: "pf_send",
            navLabel: "send",
            icon: <IcnSend />,
            title: t("wallet_page.send"),
          },
        ];
  }, [currentAccount.accounts, currentNetwork.network]);

  const fullNameLength = useMemo(() => {
    const fullnameLen = tokenInfo?.attributes?.full_name?.length || 0;
    const symbolLen = tokenInfo?.attributes?.symbol?.length || 0;
    return fullnameLen + symbolLen;
  }, [tokenInfo]);

  const _navigate = (path: string, name: string, label: string) => {
    // NOTE: [GA]
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    Analytics.fireEvent(name, {
      action: "click",
      label,
    });
    navigate(path, {
      state: {
        token: !isNativeToken && tokenInfo ? tokenInfo : undefined,
      },
    });
  };

  useEffect(() => {
    getToken().catch((e) => {
      console.log(e);
    });
  }, []);

  if (!currentAccount || !tokenInfo) return <Loading color="#ODODOD" />;

  return (
    <>
      <div className="flex gap-4 items-center bg-grey-400 px-4 py-2 w-full h-[92px]">
        {!!tokenInfo.attributes.icon_file ? (
          <img
            src={DOMPurify.sanitize(tokenInfo.attributes.icon_file)}
            className="w-16 h-16"
          />
        ) : (
          <TextAvatar
            len={2}
            text={tokenInfo.attributes.symbol}
            className="!w-16 !h-16 !text-3xl"
          />
        )}
        <div className="flex flex-col gap-1 flex-grow">
          <div
            className={cn("text-primary flex gap-1 items-center w-full", {
              "flex-col !items-start": fullNameLength > 10,
            })}
          >
            <div className="flex items-center gap-1">
              <strong className="font-bold text-xl leading-[25px]">
                {!!tokenInfo.attributes.symbol
                  ? tokenInfo.attributes.symbol
                  : "Unnamed"}
              </strong>
              {!!tokenInfo.attributes.full_name && (
                <div className="text-base font-normal leading-[25px] flex gap-[3px] items-center">
                  <span className="-mt-[3px]">(</span>
                  <span>{tokenInfo.attributes.full_name}</span>{" "}
                  <span className="-mt-[3px]">)</span>
                </div>
              )}
            </div>
            {!isNativeToken && tokenInfo && (
              <div
                className={cn("pb-[1px] flex items-center", {
                  "mt-1": fullNameLength > 10,
                })}
              >
                {fullNameLength <= 10 && (
                  <div className="h-[21px] w-[1px] bg-grey-200" />
                )}
                <div className="flex gap-1 items-start">
                  <label className="inline-block bg-grey-300 px-2 rounded text-[10px] text-[#787575] leading-5">
                    {tokenInfo.attributes.udt_type.toUpperCase()}
                  </label>
                  {tokenInfo.attributes.xudt_tags?.includes("rgb++") && (
                    <label
                      className="inline-block bg-grey-300 px-2 rounded text-[10px] text-black leading-5"
                      style={{
                        background:
                          "linear-gradient(120.76deg, #FFD37B 31.34%, #77F8BA 92.54%)",
                      }}
                    >
                      RGB++
                    </label>
                  )}
                </div>
              </div>
            )}
          </div>
          {!isNativeToken && (
            <div className="text-sm font-normal leading-[18px] text-[#787575] flex gap-2">
              <p>{shortAddress(tokenInfo.attributes.type_hash, 8)}</p>
              <IcnCopy
                className="w-4 h-4 right-2 transition-colors stroke-[#787575] hover:stroke-primary cursor-pointer"
                onClick={() => {
                  navigator.clipboard
                    .writeText(tokenInfo.attributes.type_hash)
                    .then(() => {
                      toast.success("Type hash copied");
                    })
                    .catch((err) => {
                      toast.error("Failed to copy");
                    });
                }}
              />
            </div>
          )}
        </div>
      </div>
      <div className="relative w-full h-full top-0 px-4">
        <div className="w-full flex-col justify-start relative top-0 overflow-auto">
          <div className="flex flex-col gap-1 mt-4">
            <div className="font-medium leading-6 flex gap-4 justify-between items-center">
              <label className="text-base">
                {t("components.token_card.balance")}
              </label>
              <ShortBalance balance={tokenBalence} zeroDisplay={18} />
            </div>

            {isNativeToken && isCkbNetwork(currentNetwork.network) && (
              <div className="font-medium leading-6 flex gap-4 justify-between items-center text-[#787575] capitalize">
                <label className="text-base">
                  {t("wallet_page.occupied_balance")}
                </label>
                <span className="text-lg">
                  {formatNumber(ckbOccupiedBalance, 2, 3)}
                </span>
              </div>
            )}
          </div>

          <div
            className={cn(`grid gap-2 mt-4`, {
              "grid-cols-2": panelNavs.length <= 2,
              "grid-cols-4": panelNavs.length > 2,
            })}
          >
            {panelNavs.map((nav, i) => (
              <div
                key={`panel-account-nav-${i}`}
                className={cn(
                  `py-3 px-4 flex gap-1 flex-col cursor-pointer justify-center items-center transition-all bg-grey-300 hover:bg-grey-200 rounded-[10px]`,
                  {
                    "!cursor-not-allowed hover:!bg-grey-300":
                      tokenBalence <= 0 && nav.navPath === "/pages/create-send",
                  }
                )}
                onClick={() => {
                  if (nav.isPopup) {
                    setIsShowReceive(true);
                  } else {
                    if (
                      tokenBalence <= 0 &&
                      nav.navPath === "/pages/create-send"
                    )
                      return;
                    _navigate(nav.navPath, nav.navName, nav.navLabel);
                  }
                }}
              >
                <p className="text-base font-medium">{nav.title}</p>
              </div>
            ))}
          </div>
          <TransactionList
            className="mt-4 mb-4 !px-0 !z-5"
            type={type.toLowerCase() !== "ckb" ? type : undefined}
            typeHash={typeHash.toLowerCase() !== "ckb" ? typeHash : undefined}
          />
        </div>
        <ReceiveAddress
          active={isShowReceive}
          onClose={() => setIsShowReceive(false)}
        />
      </div>
    </>
  );
};

export default TokenDetail;
