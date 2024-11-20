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
import { useState } from "react";
import Modal from "@/ui/components/modal";
import Switch from "@/ui/components/switch";
import { useWalletState } from "@/ui/states/walletState";
import {
  emptyAppState,
  emptyWalletState,
} from "@/background/services/storage/utils";
import { useNavigate } from "react-router-dom";
import CheckPassword from "@/ui/components/check-password";

const ICON_SIZE = 8;
const ICON_CN = `w-${ICON_SIZE} h-${ICON_SIZE}`;

const Settings = () => {
  const navigate = useNavigate();
  const { logout, logoutAndErase, updateAppState } = useAppState((v) => ({
    logout: v.logout,
    logoutAndErase: v.logoutAndErase,
    updateAppState: v.updateAppState,
  }));

  const { updateWalletState } = useWalletState((v) => ({
    updateWalletState: v.updateWalletState,
  }));

  const [isOpenLogout, setIsOpenLogout] = useState(false);
  const [isBackup, setIsBackup] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

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
      icon: <IcnHelpSupport className={ICON_CN} />,
      label: t("settings.help_n_support"),
      link: TELEGRAM_HELP_AND_SUPPORT,
      target: "_blank",
      gaLabel: "helpAndSupport",
    },
    {
      icon: <IcnArrowLeftOnRectangle className={ICON_CN} />,
      label: t("settings.logout"),
      onClick: () => setIsOpenLogout(true),
      gaLabel: "logout",
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
      <Modal
        onClose={() => setIsOpenLogout(false)}
        open={isOpenLogout}
        title={t("logout.are_you_sure")}
      >
        {isVerified ? (
          <>
            <div className="text-base text-primary flex flex-col items-center gap-2">
              <div className="text-base">
                {t("logout.warning_1")} <br />
                {t("logout.warning_2")}
              </div>
              <Switch
                label={t("logout.have_you_backed")}
                value={isBackup}
                onChange={setIsBackup}
                locked={false}
                className="switch flex w-full flex-row-reverse items-center justify-between py-1 capitalize !text-primary [&>label]:!text-primary [&>label]:!font-medium"
              />
            </div>
            <div className="flex justify-center gap-4 mt-4">
              <button
                className="btn w-full secondary"
                onClick={() => {
                  setIsBackup(false);
                  setIsVerified(false);
                  setIsOpenLogout(false);
                }}
              >
                {t("switch_wallet.no")}
              </button>
              <button
                className="btn w-full primary"
                disabled={!isBackup}
                onClick={async () => {
                  if (isBackup) {
                    await logoutAndErase();
                    await updateWalletState({
                      ...emptyWalletState(),
                    });
                    await updateAppState({
                      ...emptyAppState(),
                    });
                    window.location.reload();
                    navigate("/");
                  }
                }}
              >
                {t("switch_wallet.yes")}
              </button>
            </div>
          </>
        ) : (
          <CheckPassword handler={(_password) => setIsVerified(true)} />
        )}
      </Modal>
    </div>
  );
};

export default Settings;
