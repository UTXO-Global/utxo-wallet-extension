import {
  useGetCurrentAccount,
  useGetCurrentNetwork,
} from "@/ui/states/walletState";
import { useTransactionManagerContext } from "@/ui/utils/tx-ctx";
import { useEffect, useMemo, useState } from "react";
import Loading from "react-loading";
import s from "./styles.module.scss";
import TransactionList from "@/ui/components/transactions-list";
import { IcnCopy, IcnReceive, IcnSend } from "@/ui/components/icons";
import toast from "react-hot-toast";
import { isCkbNetwork } from "@/shared/networks";
import { t } from "i18next";
import cn from "classnames";
import Analytics from "@/ui/utils/gtm";
import { useNavigate, useParams } from "react-router-dom";
import ReceiveAddress from "@/ui/components/receive-address";
import { analyzeSmallNumber, formatNumber } from "@/shared/utils";
import { ckbExplorerApi } from "@/ui/utils/helpers";
import { CKBTokenInfo } from "@/shared/networks/ckb/types";
import { useGetCKBAddressInfo } from "@/ui/hooks/address-info";
import { TOKEN_FILE_ICON_DEFAULT } from "@/shared/constant";
import { shortAddress } from "@/shared/utils/transactions";
import { BI } from "@ckb-lumos/lumos";
import ShortBalance from "@/ui/components/ShortBalance";

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

  const isCKBToken = useMemo(() => {
    return type === "ckb" && typeHash === "ckb";
  }, [type, typeHash]);

  const currentToken = useMemo(() => {
    if (!addressInfo) return;

    return addressInfo.attributes.udt_accounts.find(
      (t) => t.type_hash === typeHash && t.udt_type === type
    );
  }, [addressInfoLoading, addressInfo]);

  const getToken = async () => {
    if (type === "ckb" && typeHash === "ckb") {
      setTokenInfo({
        attributes: {
          symbol: "CKB",
          full_name: "Nervos CKB",
          icon_file: "/ckb.png",
          decimal: "8",
        },
      });
      return;
    }
    if (isLoading) return;
    setIsLoading(true);

    try {
      const res = await fetch(
        `${ckbExplorerApi(currentNetwork.slug)}/v1/${type}s/${typeHash}`,
        {
          method: "GET",
          headers: {
            Accept: "application/vnd.api+json",
          },
        }
      );
      const { data } = await res.json();
      setTokenInfo(data as CKBTokenInfo);
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  const ckbBalance = useMemo(() => {
    return currentAccount.balance ? Number(currentAccount.balance) : 0;
  }, [currentAccount.balance]);

  const ckbOccupiedBalance = useMemo(() => {
    return currentAccount.ordinalBalance
      ? Number(currentAccount.ordinalBalance)
      : 0;
  }, [currentAccount.ordinalBalance]);

  const tokenBalence = useMemo(() => {
    if (isCKBToken) {
      return currentAccount.balance ? Number(currentAccount.balance) : 0;
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

  const _navigate = (path: string, name: string, label: string) => {
    // NOTE: [GA]
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    Analytics.fireEvent(name, {
      action: "click",
      label,
    });
    navigate(path, {
      state: {
        token: !isCKBToken ? tokenInfo : undefined,
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
      <div className="flex gap-4 items-center bg-grey-400 p-4 pb-0 w-full">
        <img
          src={tokenInfo.attributes.icon_file || TOKEN_FILE_ICON_DEFAULT}
          className="w-16 h-16"
        />
        <div className="flex flex-col gap-1">
          <div
            className={cn("text-primary flex gap-1 items-center", {
              "flex-col !items-start":
                tokenInfo.attributes.full_name.length > 5,
            })}
          >
            <div>
              <strong className="font-bold text-xl leading-6">
                {!!tokenInfo.attributes.symbol
                  ? tokenInfo.attributes.symbol
                  : "Unnamed"}
              </strong>{" "}
              {!!tokenInfo.attributes.full_name && (
                <span className="text-base font-normal leading-[18px]">
                  ({tokenInfo.attributes.full_name})
                </span>
              )}
            </div>
            {tokenInfo.attributes.full_name?.length <= 5 && (
              <div className="h-[21px] w-[1px] bg-grey-200" />
            )}
            <div className="flex gap-1 items-start">
              <label className="inline-block bg-grey-300 px-2 rounded text-[10px] text-[#787575] leading-5">
                {tokenInfo.attributes.udt_type === "xudt" ? "xUDT" : "sUDT"}
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
          {typeHash !== "ckb" && (
            <div className="text-sm font-normal leading-[18px] text-[#787575] flex gap-2">
              <p>{shortAddress(tokenInfo.attributes.type_hash, 5)}</p>
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
              <ShortBalance balance={tokenBalence} zeroDisplay={5} />
            </div>

            {isCKBToken && (
              <div className="font-medium leading-6 flex gap-4 justify-between items-center text-[#787575]">
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
            type={type !== "ckb" ? type : undefined}
            typeHash={typeHash !== "ckb" ? typeHash : undefined}
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
