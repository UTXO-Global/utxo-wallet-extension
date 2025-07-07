import { browserTabsCreate } from "@/shared/utils/browser";
import { useAppState } from "@/ui/states/appState";
import s from "./styles.module.scss";

import Tile from "@/ui/components/tile";
import { TileProps } from "@/ui/components/tile/component";
import { ArrowsPointingOutIcon, LanguageIcon } from "@heroicons/react/24/solid";

import { t } from "i18next";
import config from "../../../../../package.json";
import versionInfo from "../../../../../version.json";
import {
  IcnArrowLeftOnRectangle,
  IcnConnectSite,
  IcnRightPanel,
  IcnSecurity,
  IcnWallet,
} from "@/ui/components/icons";
import { IcnHelpSupport } from "@/ui/components/icons/IcnHelpSupport";
import { TELEGRAM_HELP_AND_SUPPORT } from "@/shared/constant";

const ICON_SIZE = 8;
const ICON_CN = `w-${ICON_SIZE} h-${ICON_SIZE}`;

const Settings = () => {
  const { logout } = useAppState((v) => ({
    logout: v.logout,
  }));

  const expandView = async () => {
    await browserTabsCreate({
      url: "index.html",
    });
  };

  const items: TileProps[] = [
    {
      icon: <IcnSecurity className={ICON_CN} />,
      label: t("settings.security_settings"),
      link: "/pages/security",
      gaLabel: "security",
    },
    {
      icon: <IcnConnectSite className={ICON_CN} />,
      label: t("settings.connected_sites"),
      link: "/pages/connected-sites",
      gaLabel: "connected_sites",
    },
    {
      icon: <LanguageIcon className={ICON_CN} />,
      label: t("settings.language"),
      link: "/pages/language",
    },
    {
      icon: <IcnWallet className={ICON_CN} />,
      label: t("settings.wallet"),
      link: "/pages/switch-wallet",
    },
    {
      icon: <ArrowsPointingOutIcon className={ICON_CN} />,
      label: t("settings.expand_view"),
      onClick: expandView,
      gaLabel: "expand_view",
    },
    {
      icon: <IcnArrowLeftOnRectangle className={ICON_CN} />,
      label: t("settings.logout"),
      onClick: logout,
      gaLabel: "logout",
    },
    {
      icon: <IcnHelpSupport className={ICON_CN} />,
      label: t("settings.help_n_support"),
      link: TELEGRAM_HELP_AND_SUPPORT,
      target: "_blank",
      gaLabel: "helpAndSupport",
    },
    {
      icon: <IcnRightPanel className={ICON_CN} />,
      label: t("settings.side_panel"),
      onClick: async () => {
        const tabs = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });

        const { id: tabId } = tabs[0];
        if (!!tabId) {
          await chrome.sidePanel.setOptions({
            enabled: true,
            path: "index.html",
            tabId,
          });
          await chrome.sidePanel.setPanelBehavior({
            openPanelOnActionClick: false,
          });
          await chrome.sidePanel.open({
            tabId,
          });
          window.close();
        }
      },
    },
  ];

  const analytics = (label: string) => {};

  return (
    <div className={s.wrapper}>
      <div className={s.settings}>
        {items.map((i) => (
          <div key={i.label} onClick={() => analytics(i.gaLabel)}>
            <Tile {...i} />
          </div>
        ))}
      </div>
      <div className={s.version}>
        Current Version{" "}
        <span>
          {config.version}#{(versionInfo as any).timestamp.toString()}
        </span>{" "}
        | By{" "}
        <a
          href="#"
          onClick={async () => {
            await browserTabsCreate({
              url: `https://x.com/UTXOGlobal`,
              active: true,
            });
          }}
        >
          UTXO Global team
        </a>
      </div>
    </div>
  );
};

export default Settings;
