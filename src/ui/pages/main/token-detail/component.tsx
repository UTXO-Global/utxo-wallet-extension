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
import { formatNumber } from "@/shared/utils";
import { ckbExplorerApi } from "@/ui/utils/helpers";
import { CKBTokenInfo } from "@/shared/networks/ckb/types";
import { useGetCKBAddressInfo } from "@/ui/hooks/address-info";
import { TOKEN_FILE_ICON_DEFAULT } from "@/shared/constant";
import { shortAddress } from "@/shared/utils/transactions";
import { BI } from "@ckb-lumos/lumos";

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
  const { trottledUpdate } = useTransactionManagerContext();
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

  const tokenBalence = useMemo(() => {
    if (isCKBToken) {
      return currentAccount.balance ? Number(currentAccount.balance) : 0;
    }

    if (!currentToken) return 0;

    return BI.from(currentToken.amount)
      .div(BI.from(10 ** Number(currentToken.decimal)))
      .toNumber();
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
    navigate(path);
  };

  useEffect(() => {
    getToken().catch((e) => {
      console.log(e);
    });
  }, []);

  useEffect(() => {
    trottledUpdate();
  }, [trottledUpdate]);

  if (!currentAccount || !tokenInfo) return <Loading color="#ODODOD" />;

  return (
    <div className="relative w-full h-full top-0 px-4 mt-4">
      <div className="w-full flex-col justify-start relative top-0 overflow-auto">
        <div className="flex gap-4 items-center">
          <img
            src={tokenInfo.attributes.icon_file || TOKEN_FILE_ICON_DEFAULT}
            className="w-16 h-16"
          />
          <div className="flex flex-col gap-1">
            <p className="text-primary">
              <strong className="font-bold text-xl leading-6">
                {tokenInfo.attributes.symbol}
              </strong>{" "}
              <span className="text-sm font-normal leading-[18px]">
                ({tokenInfo.attributes.full_name})
              </span>
            </p>
            {typeHash !== "ckb" && (
              <div className="text-sm font-normal leading-[18px] text-[#787575] flex gap-2">
                <p>{shortAddress(tokenInfo.attributes.type_hash, 10)}</p>
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
        <div className="font-medium leading-6 flex gap-4 justify-between items-center mt-4">
          <label className="text-base">
            {t("components.token_card.balance")}
          </label>
          <span className="text-lg">{formatNumber(tokenBalence, 2, 3)}</span>
        </div>

        <div
          className={cn(`grid gap-2 mt-5 pb-2`, {
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
                  if (tokenBalence <= 0 && nav.navPath === "/pages/create-send")
                    return;
                  _navigate(nav.navPath, nav.navName, nav.navLabel);
                }
              }}
            >
              {nav.icon}
              <p className="text-base font-medium">{nav.title}</p>
            </div>
          ))}
        </div>
        <TransactionList className="mt-6 mb-4 !px-0" />
      </div>
      <ReceiveAddress
        active={isShowReceive}
        onClose={() => setIsShowReceive(false)}
      />
    </div>
  );
};

export default TokenDetail;

// https://mainnet-api.explorer.nervos.org/api/v1/udt_transactions/{type_hash}
// https://mainnet-api.explorer.nervos.org/api/v1/udt_transactions/{type_hash}
