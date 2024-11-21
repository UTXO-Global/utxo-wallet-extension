import { browserTabsCreate } from "@/shared/utils/browser";
import { useAppState } from "@/ui/states/appState";
import Analytics from "@/ui/utils/gtm";
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
    // {
    //   icon: <GlobeAltIcon className={ICON_CN} />,
    //   label: t("settings.network"),
    //   link: "/pages/network",
    //   gaLabel: "network",
    // },
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
  ];

  const analytics = (label: string) => {
    // NOTE: [GA] - Settings
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    Analytics.fireEvent("st_options", {
      action: "click",
      label,
    });
  };

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
        Version{" "}
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
