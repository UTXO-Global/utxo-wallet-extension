import { browserTabsCreate } from "@/shared/utils/browser";
import s from "./styles.module.scss";

import { TileProps } from "@/ui/components/tile/component";
import { KeyIcon, LockClosedIcon } from "@heroicons/react/24/outline";

import { useAppState } from "@/ui/states/appState";
import { t } from "i18next";
import config from "../../../../../package.json";
import versionInfo from "../../../../../version.json";

const ICON_SIZE = 6;
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
      onClick: async () => {
        // TODO: confirm dialog
        await logout();
      },
    },
  ];

  return (
    <div className={s.wrapper}>
      <div className={s.settings}>
        {items.map((i) => (
          <div
            key={i.label}
            className="flex justify-between items-center gap-2 pt-4 pb-5 border-b border-b-grey-300 last:border-b-0"
          >
            <div className="flex gap-2 items-center">
              <div>{i.icon}</div>
              <div className="text-primary text-base font-medium leading-6">
                {i.label}
              </div>
            </div>
            <div>
              <svg
                className="w-6 h-6 stroke-[#A69C8C] -rotate-90"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M7 10L12 15L17 10"
                  stroke="#0D0D0D"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
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

export default Security;
