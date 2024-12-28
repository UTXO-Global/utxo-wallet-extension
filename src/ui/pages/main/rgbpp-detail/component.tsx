import {
  useGetCurrentAccount,
  useGetCurrentNetwork,
} from "@/ui/states/walletState";
import { useCallback, useEffect, useMemo, useState } from "react";
import Loading from "react-loading";
import { IcnCopy, IcnReceive, IcnSend } from "@/ui/components/icons";
import toast from "react-hot-toast";
import { t } from "i18next";
import cn from "classnames";
import Analytics from "@/ui/utils/gtm";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import ReceiveAddress from "@/ui/components/receive-address";
import { fetchExplorerAPI } from "@/ui/utils/helpers";
import { CKBTokenInfo } from "@/shared/networks/ckb/types";
import { shortAddress } from "@/shared/utils/transactions";
import ShortBalance from "@/ui/components/ShortBalance";
import TextAvatar from "@/ui/components/text-avatar/component";
import DOMPurify from "dompurify";
import { CKB_MAINNET, CKB_TESTNET } from "@/shared/networks/ckb";
import { BTC_LIVENET } from "@/shared/networks/btc";
import RgbppTxList from "./rgbpp-tx-list";

const RgbppDetail = () => {
  const { typeHash } = useParams();
  const [isShowReceive, setIsShowReceive] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<CKBTokenInfo | undefined>(
    undefined
  );
  const currentAccount = useGetCurrentAccount();
  const currentNetwork = useGetCurrentNetwork();
  const navigate = useNavigate();
  const location = useLocation();

  const tokenBalance = useMemo(() => {
    if (location.state && location.state.tokenAmount) {
      return location.state.tokenAmount;
    }
    return 0;
  }, [location]);

  const getToken = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const ckbSlug =
        currentNetwork.slug === BTC_LIVENET.slug
          ? CKB_MAINNET.slug
          : CKB_TESTNET.slug;
      const res = await fetchExplorerAPI(ckbSlug, `/v1/xudts/${typeHash}`);
      const { data } = await res.json();
      setTokenInfo(data as CKBTokenInfo);
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  }, [typeHash]);

  const panelNavs = useMemo(() => {
    return [
      {
        navPath: "/pages/receive",
        navName: "pf_receive",
        navLabel: "receive",
        icon: <IcnReceive />,
        title: t("wallet_page.receive"),
        isPopup: true,
      },
      {
        navPath: "/pages/create-send-rgbpp",
        navName: "pf_send",
        navLabel: "send",
        icon: <IcnSend />,
        title: t("wallet_page.send"),
      },
      {
        navPath: "/pages/btc-leap-rgbpp",
        navName: "pf_btc_leap",
        navLabel: "btc_leap",
        icon: <IcnSend />,
        title: "Leap To CKB",
      },
    ];
  }, [currentAccount.accounts]);

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
        token: tokenInfo ? tokenInfo : undefined,
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
            {tokenInfo && (
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
          {
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
          }
        </div>
      </div>
      <div className="relative w-full h-full top-0 px-4">
        <div className="w-full flex-col justify-start relative top-0 overflow-auto">
          <div className="flex flex-col gap-1 mt-4">
            <div className="font-medium leading-6 flex gap-4 justify-between items-center">
              <label className="text-base">
                {t("components.token_card.balance")}
              </label>
              <ShortBalance balance={tokenBalance} zeroDisplay={18} />
            </div>
          </div>

          <div
            className={cn(`grid gap-2 mt-4`, {
              "grid-cols-2": panelNavs.length <= 2,
              "grid-cols-3": panelNavs.length > 2,
            })}
          >
            {panelNavs.map((nav, i) => (
              <div
                key={`panel-account-nav-${i}`}
                className={cn(
                  `py-3 px-4 flex gap-1 flex-col cursor-pointer justify-center items-center transition-all bg-grey-300 hover:bg-grey-200 rounded-[10px]`,
                  {
                    "!cursor-not-allowed hover:!bg-grey-300":
                      tokenBalance <= 0 && nav.navPath !== "/pages/receive",
                  }
                )}
                onClick={() => {
                  if (nav.isPopup) {
                    setIsShowReceive(true);
                  } else {
                    if (tokenBalance <= 0 && nav.navPath !== "/pages/receive")
                      return;
                    _navigate(nav.navPath, nav.navName, nav.navLabel);
                  }
                }}
              >
                <p className="text-base font-medium">{nav.title}</p>
              </div>
            ))}
          </div>
          <RgbppTxList className="mt-4 mb-4 !px-0 !z-5" typeHash={typeHash} />
        </div>
        <ReceiveAddress
          active={isShowReceive}
          onClose={() => setIsShowReceive(false)}
        />
      </div>
    </>
  );
};

export default RgbppDetail;
