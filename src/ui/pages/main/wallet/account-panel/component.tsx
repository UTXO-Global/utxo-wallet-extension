import {
  useGetCurrentAccount,
  useGetCurrentNetwork,
} from "@/ui/states/walletState";
import Analytics from "@/ui/utils/gtm";
import { useTransactionManagerContext } from "@/ui/utils/tx-ctx";
import { Popover } from "@headlessui/react";
import { t } from "i18next";
import { useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Loading from "react-loading";
import { useNavigate } from "react-router-dom";
import s from "../styles.module.scss";
import { IcnApproximate, IcnSend, IcnReceive } from "@/ui/components/icons";
import cn from "classnames";
import { isCkbNetwork } from "@/shared/networks";
import ReceiveAddress from "@/ui/components/receive-address";
import { formatNumber } from "@/shared/utils";

const FAUCET_LINK = {
  btc_testnet: "https://bitcoinfaucet.uo1.net/",
  btc_testnet_4: "https://mempool.space/testnet4/faucet",
  btc_signet: "https://signetfaucet.com/",
};

const AccountPanel = () => {
  const currentAccount = useGetCurrentAccount();
  const currentNetwork = useGetCurrentNetwork();
  const { currentPrice } = useTransactionManagerContext();
  const navigate = useNavigate();
  const [isShowReceive, setIsShowReceive] = useState<boolean>(false);

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

  const isCkbTestnet = useMemo(() => {
    return currentNetwork && currentNetwork.slug === "nervos_testnet";
  }, [currentNetwork]);

  const faucetCkb = useCallback(() => {
    fetch("https://faucet-api.nervos.org/claim_events", {
      headers: {
        accept: "application/json, text/plain, */*",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        claim_event: {
          address_hash: currentAccount.accounts[0].address,
          amount: "100000",
        },
      }),
      method: "POST",
    })
      .then((response) => {
        if (response.status === 200) {
          response
            .json()
            .then((_) => {
              toast.success("Faucet success");
            })
            .catch((e) => {});
        } else if (response.status === 422) {
          toast.error("Amount is already reached maximum limit.");
        } else {
          toast.error("Cannot faucet. Please try again");
        }
      })
      .catch((e) => {});
  }, [currentNetwork, currentAccount]);

  return (
    <div className={`${s.accPanel} px-4`}>
      <Popover className="relative w-full">
        {({ open }) => (
          <>
            {[
              "btc_testnet",
              "btc_testnet_4",
              "btc_signet",
              "nervos_testnet",
            ].includes(currentNetwork.slug) ? (
              <p className="text-[#FF4545] text-center mt-2 mb-6 text-lg font-normal">
                {currentNetwork.name} activated.{" "}
                {isCkbTestnet ? (
                  <span
                    className="underline text-[#FFA23A] cursor-pointer"
                    onClick={faucetCkb}
                  >
                    Faucet Here
                  </span>
                ) : (
                  <a
                    href={FAUCET_LINK[currentNetwork.slug]}
                    target="_blank"
                    className="underline text-[#FFA23A] cursor-pointer"
                    rel="noreferrer"
                  >
                    Faucet Here
                  </a>
                )}
              </p>
            ) : null}

            <div className="grid gap-1 min-h-[80px]">
              <div className="text-[32px] leading-[35.2px] text-right flex flex-wrap items-center justify-center gap-1">
                {currentAccount?.balance === undefined ? (
                  <Loading
                    type="spin"
                    color="#ODODOD"
                    width={"2rem"}
                    height={"2rem"}
                    className="react-loading pr-2"
                  />
                ) : (
                  <span className="max-w-[310px] truncate">
                    {formatNumber((currentAccount?.balance ?? 0) as any, 2, 8)}
                  </span>
                )}
                <span>{currentNetwork.coinSymbol}</span>
              </div>
              <div className="text-center">
                {currentAccount?.balance !== undefined
                  ? currentPrice !== 0 &&
                    currentPrice !== undefined && (
                      <div className="text-[#787575] gap-[5px] font-normal text-lg leading-[25.2px] flex items-center justify-center">
                        <IcnApproximate className="w-[9px]" /> $
                        {(currentAccount.balance * currentPrice)?.toFixed(3)}
                      </div>
                    )
                  : undefined}

                {currentAccount?.ordinalBalance !== undefined &&
                currentNetwork.ordUrl ? (
                  <div className="text-[#787575] text-lg leading-[25.2px]">
                    Ordinal Balance: {currentAccount.ordinalBalance}{" "}
                    {currentNetwork.coinSymbol}
                  </div>
                ) : undefined}

                {/*<div className="text-[#FF4545] gap-2 flex items-center justify-center !mt-2">
                  <span className="text-lg font-normal">-$0.233</span>
                  <span className="text-sm font-medium rounded py-[2px] px-1 bg-[#FF4545]/20">-0.12%</span>
                </div>
              */}
              </div>
            </div>
            <div
              className={cn(`grid gap-2 !mt-6 pb-2`, {
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
          </>
        )}
      </Popover>
      <ReceiveAddress
        active={isShowReceive}
        onClose={() => setIsShowReceive(false)}
      />
    </div>
  );
};

export default AccountPanel;
