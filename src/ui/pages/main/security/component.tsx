import { browserTabsCreate } from "@/shared/utils/browser";
import s from "./styles.module.scss";

import Tile from "@/ui/components/tile";
import { TileProps } from "@/ui/components/tile/component";
import { KeyIcon, LockClosedIcon } from "@heroicons/react/24/solid";

import { useAppState } from "@/ui/states/appState";
import { t } from "i18next";
import config from "../../../../../package.json";
import versionInfo from '../../../../../version.json';

const ICON_SIZE = 8;
const ICON_CN = `w-${ICON_SIZE} h-${ICON_SIZE}`;

const Security = () => {
  const { logout } = useAppState((v) => ({
    logout: v.logout,
  }));

  const items: TileProps[] = [
    {
      icon: <KeyIcon className={ICON_CN} />,
      label: t("components.layout.change_password"),
      link: "/pages/change-password",
    },
    {
      icon: <LockClosedIcon className={ICON_CN} />,
      label: t("components.layout.lock"),
      onClick: () => {
        // TODO: confirm dialog
        logout();
      },
    },
  ];

  return (
    <div className={s.wrapper}>
      <div className={s.settings}>
        {items.map((i) => (
          <Tile key={i.label} {...i} />
        ))}
      </div>
      <div className={s.version}>
        Version <span>{config.version}#{(versionInfo as any).timestamp.toString()}</span> | By{" "}
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

export default Security;
