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
import {
  IcnSend,
  IcnReceive,
} from "@/ui/components/icons";
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
  const { currentPrice, changePercent24Hr } = useTransactionManagerContext();
  const navigate = useNavigate();
  const [isShowReceive, setIsShowReceive] = useState<boolean>(false);

  const ckbPrice = useMemo(() => {
    return currentPrice ? Number(currentPrice) : 0;
  }, [currentPrice]);

  const ckbChange24h = useMemo(() => {
    return changePercent24Hr ? Number(changePercent24Hr) : 0;
  }, [changePercent24Hr]);

  const ckbBalance = useMemo(() => {
    return currentAccount.balance ? Number(currentAccount.balance) : 0;
  }, [currentAccount.balance]);

  const panelNavs = useMemo(() => {
    const isCKB = isCkbNetwork(currentNetwork.network);
    const navs = [
      {
        navPath: `/pages/receive/${
          isCKB ? currentAccount.accounts[0].address : ""
        }`,
        navName: "pf_receive",
        navLabel: "receive",
        icon: <IcnReceive />,
        title: t("wallet_page.receive"),
        isPopup: !isCKB,
      },
      {
        navPath: "/pages/create-send",
        navName: "pf_send",
        navLabel: "send",
        icon: <IcnSend />,
        title: t("wallet_page.send"),
      },
    ];
    return navs;
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
              <p className="text-[#FF4545] text-center mt-2 !mb-3 text-lg font-normal">
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

            <div className="grid gap-3 my-6">
              <div className="text-4xl font-medium leading-[39.6px] text-right flex flex-wrap items-center justify-center gap-1">
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
                    ${formatNumber(ckbBalance * ckbPrice, 2, 3)}
                  </span>
                )}
              </div>
            </div>
            <div
              className={cn(`grid gap-2 !mt-6 pb-2`, {
                "grid-cols-2": panelNavs.length <= 2,
                "grid-cols-3": panelNavs.length === 3,
                "grid-cols-4": panelNavs.length > 3,
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
