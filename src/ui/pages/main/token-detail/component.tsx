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
import { useNavigate } from "react-router-dom";
import ReceiveAddress from "@/ui/components/receive-address";

const TokenDetail = () => {
  const [isShowReceive, setIsShowReceive] = useState<boolean>(false);
  const { trottledUpdate } = useTransactionManagerContext();
  const currentAccount = useGetCurrentAccount();
  const currentNetwork = useGetCurrentNetwork();
  const navigate = useNavigate();

  useEffect(() => {
    trottledUpdate();
  }, [trottledUpdate]);

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

  if (!currentAccount) return <Loading color="#ODODOD" />;

  return (
    <div className="relative w-full h-full top-0 px-4 mt-4">
      <div className="w-full flex-col justify-start relative top-0 overflow-auto">
        <div className="flex gap-4 items-center">
          <img src="/ckb.png" className="w-16 h-16" />
          <div className="flex flex-col gap-1">
            <p className="text-primary">
              <strong className="font-bold text-xl leading-6">CKB</strong>{" "}
              <span className="text-sm font-normal leading-[18px]">
                (Nervos CKB)
              </span>
            </p>
            <div className="text-sm font-normal leading-[18px] text-[#787575] flex gap-2">
              <p>0x178fb47b597...</p>
              <IcnCopy
                className="w-4 h-4 right-2 transition-colors stroke#787575] hover:stroke-primary cursor-pointer"
                onClick={() => {
                  navigator.clipboard
                    .writeText("0x178fb47b597")
                    .then(() => {
                      toast.success("Address copied");
                    })
                    .catch((err) => {
                      toast.error("Failed to copy");
                    });
                }}
              />
            </div>
          </div>
        </div>
        <div className="font-medium leading-6 flex gap-4 justify-between items-center mt-4">
          <label className="text-base">
            {t("components.token_card.balance")}
          </label>
          <span className="text-lg">100,000.000</span>
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
                    currentAccount?.balance === undefined &&
                    nav.navPath === "/pages/create-send",
                }
              )}
              onClick={() => {
                if (nav.isPopup) {
                  setIsShowReceive(true);
                } else {
                  if (
                    currentAccount?.balance === undefined &&
                    nav.navPath === "/pages/create-send"
                  )
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
        <TransactionList className="mt-6" />
      </div>
      <ReceiveAddress
        active={isShowReceive}
        onClose={() => setIsShowReceive(false)}
      />
    </div>
  );
};

export default TokenDetail;
