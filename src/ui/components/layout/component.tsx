import { useControllersState } from "@/ui/states/controllerState";
import {
  useGetCurrentAccount,
  useGetCurrentNetwork,
  useGetCurrentWallet,
  useWalletState,
} from "@/ui/states/walletState";
import { Menu } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import cn from "classnames";
import { t } from "i18next";
import { useMemo } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import SearchInscriptions from "../search-inscriptions";
import s from "./styles.module.scss";
import { IcnPlusCircle } from "../icons";

interface IRouteTitle {
  route: string | RegExp;
  title: string;
  action?: {
    icon: React.ReactNode;
    link?: string;
  };
  backAction?: () => void;
  disableBack?: boolean;
  dropdown?: {
    name: string;
    link: string;
  }[];
}

export default function PagesLayout() {
  const { stateController } = useControllersState((v) => ({
    stateController: v.stateController,
  }));

  const currentRoute = useLocation();
  const currentAccount = useGetCurrentAccount();
  const currentWallet = useGetCurrentWallet();
  const currentNetwork = useGetCurrentNetwork();
  const navigate = useNavigate();
  const { wallets } = useWalletState((v) => ({ wallets: v.wallets }));

  const defaultTitles: IRouteTitle[] = useMemo(
    () => [
      {
        route: "/pages/switch-account",
        title: t("components.layout.switch_account"),
        action:
          currentWallet && currentWallet.type === "root"
            ? {
                icon: <IcnPlusCircle className="w-6 h-6" />,
                link: "/pages/create-new-account",
              }
            : undefined,
      },
      {
        route: "/pages/address-type/@",
        title: t("components.layout.address_type"),
      },
      {
        route: "/pages/create-new-account",
        title: t("components.layout.create_new_account"),
      },
      {
        route: "/pages/restore-type",
        title: t("components.layout.restore_wallet"),
      },
      {
        route: "/pages/about-account/@",
        title: t("components.layout.about_account"),
      },
      {
        route: "/pages/change-password",
        title: t("components.layout.change_password"),
      },
      {
        route: "/pages/security",
        title: t("components.layout.security"),
      },
      {
        route: "/pages/receive/@",
        title: currentAccount?.name ?? "Account",
      },
      {
        route: "/pages/switch-wallet",
        title: t("components.layout.switch_wallet"),
        action: {
          icon: <IcnPlusCircle className="w-6 h-6" />,
          link: "/pages/create-new-wallet",
        },
      },
      {
        route: "/pages/about-wallet/@",
        title: t("components.layout.about_wallet"),
      },
      {
        route: "/pages/restore-mnemonic",
        title: t("components.layout.restore_from_mnemonic"),
      },
      {
        route: "/pages/restore-priv-key",
        title: t("components.layout.restore_from_private_key"),
      },
      {
        route: "/pages/send",
        title: t("components.layout.send"),
      },
      {
        route: "/pages/transaction-info/@",
        title: t("components.layout.transaction_info"),
      },
      {
        route: "/pages/settings",
        title: t("components.layout.settings"),
      },
      {
        route: "/pages/show-mnemonic/@",
        title:
          currentWallet && currentWallet.type === "root"
            ? t("components.layout.show_mnemonic")
            : t("components.layout.show_private_key"),
      },
      {
        route: "/pages/show-pk/@",
        title: t("components.layout.show_private_key"),
      },
      {
        route: "/pages/discover",
        title: t("components.layout.discover"),
      },
      {
        route: "/pages/connected-sites",
        title: t("components.layout.connected_sites"),
      },
      {
        route: "/pages/language",
        title: t("components.layout.change_language"),
      },
      {
        route: "/pages/network",
        title: t("components.layout.network"),
      },
      {
        route: "/pages/explore",
        title: t("components.layout.explorer"),
      },
    ],
    [currentAccount?.name]
  );

  const routeTitles = useMemo(
    () =>
      [
        ...defaultTitles,
        {
          route: "/pages/create-new-wallet",
          title: t("components.layout.create_new_wallet"),
          disableBack: wallets.length <= 0,
        },
        {
          route: "/pages/new-mnemonic",
          title: t("components.layout.create_new_wallet"),
          backAction: async () => {
            if (await stateController.getPendingWallet()) {
              await stateController.clearPendingWallet();
            }
            navigate(-1);
          },
        },
        {
          route: "/pages/confirm-mnemonic",
          title: t("components.layout.mnemonic_confirmation"),
          backAction: async () => {
            navigate(-1);
          },
        },
        {
          backAction: () => {
            navigate("/home");
          },
          route: "/pages/finalle-send/@",
          title: t("components.layout.send"),
        },
        {
          backAction: () => {
            navigate("/pages/create-send", {
              state: currentRoute.state,
            });
          },
          route: "/pages/confirm-send",
          title: t("components.layout.send"),
        },
        {
          route: "/pages/inscription-details",
          title:
            t("inscription_details.title") +
            ` #${currentRoute.state?.inscription_number}`,
        },
        {
          route: "/pages/create-send",
          title: `${t("components.layout.send")} ${currentNetwork?.coinSymbol}`,
          backAction: () => {
            navigate("/home");
          },
        },
        {
          route: /\/pages\/(inscriptions)/,
          title: t("components.layout.inscriptions"),
          dropdown: [
            {
              name: "Inscriptions",
              link: "/pages/inscriptions",
            },
          ],
          action: {
            icon: <SearchInscriptions />,
          },
          backAction: () => {
            navigate("/home");
          },
        },
      ] as IRouteTitle[],
    [navigate, stateController, currentRoute, wallets.length, defaultTitles]
  );

  const currentRouteTitle = useMemo(
    () =>
      routeTitles.find((i) => {
        if (typeof i.route === "string") {
          if (i.route.includes("@")) {
            return currentRoute.pathname.includes(
              i.route.slice(0, i.route.length - 1)
            );
          }
          return currentRoute.pathname === i.route;
        } else {
          return i.route.test(currentRoute.pathname);
        }
      }),
    [currentRoute, routeTitles]
  );

  return (
    <div
      className={cn(s.layout)}
      style={{
        ...(currentRoute.pathname === "/pages/create-new-wallet" &&
        !currentWallet
          ? { gridTemplateRows: "unset" }
          : {}),
      }}
    >
      {currentRoute.pathname === "/pages/create-new-wallet" &&
      !currentWallet ? null : (
        <div
          className={s.header}
          style={{
            ...(currentRoute.pathname === "/pages/explore"
              ? { width: "350px" }
              : {}),
          }}
        >
          {!currentRouteTitle?.disableBack ? (
            <div
              className={cn(s.controlElem, s.back)}
              onClick={() => {
                if (currentRouteTitle?.backAction)
                  currentRouteTitle.backAction();
                else navigate(-1);
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4.25 12.2744L19.25 12.2744"
                  stroke="#0D0D0D"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M10.2998 18.2988L4.2498 12.2748L10.2998 6.24976"
                  stroke="#0D0D0D"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          ) : undefined}

          {currentRouteTitle?.dropdown ? (
            <Menu as="div" className={cn(s.controlElem, s.title, "relative")}>
              <Menu.Button className={"flex justify-center items-center gap-1"}>
                {
                  currentRouteTitle.dropdown.find(
                    (i) => i.link === currentRoute.pathname
                  )?.name
                }
                <ChevronDownIcon className="w-5 h-5" />
              </Menu.Button>
              <Menu.Items
                className={
                  "absolute top-0 left-1/2 -translate-x-1/2 bg-bg flex flex-col gap-3 w-max p-5 rounded-xl"
                }
              >
                {currentRouteTitle.dropdown.map((i) => (
                  <Menu.Item key={i.link}>
                    <Link to={i.link}>{i.name}</Link>
                  </Menu.Item>
                ))}
              </Menu.Items>
            </Menu>
          ) : (
            <div className={cn(s.controlElem, s.title)}>
              <span>{currentRouteTitle?.title}</span>
            </div>
          )}

          {currentRouteTitle?.action ? (
            currentRouteTitle?.action.link ? (
              <Link
                className={cn(s.controlElem, s.addNew)}
                to={currentRouteTitle.action.link}
              >
                {currentRouteTitle.action.icon}
              </Link>
            ) : (
              currentRouteTitle.action.icon
            )
          ) : undefined}
        </div>
      )}
      <div
        className={cn(s.contentDiv)}
        style={{
          ...(currentRoute.pathname === "/pages/explore"
            ? { width: "350px" }
            : {}),
        }}
      >
        <Outlet />
      </div>
    </div>
  );
}
