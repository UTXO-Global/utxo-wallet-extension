import { TileProps } from "@/ui/components/tile/component";
import { GlobeAltIcon, PlusIcon } from "@heroicons/react/24/outline";
import { t } from "i18next";
import cn from "classnames";
import { useNavigate } from "react-router-dom";
import { browserTabsCreate } from "@/shared/utils/browser";

const ICON_SIZE = 8;
const ICON_CN = `w-${ICON_SIZE} h-${ICON_SIZE}`;

const NewWallet = () => {
  const navigate = useNavigate();

  const items: TileProps[] = [
    {
      icon: <PlusIcon className={ICON_CN} />,
      label: t("new_wallet.create_wallet"),
      link: "/pages/new-mnemonic",
      gaLabel: "new mnemonic",
      btnType: "primary",
    },
    {
      icon: <GlobeAltIcon className={ICON_CN} />,
      label: t("new_wallet.restore_an_existing_wallet"),
      link: "/pages/restore-type",
      gaLabel: "restore mnemonic",
      btnType: "secondary",
    },
    {
      icon: <GlobeAltIcon className={ICON_CN} />,
      label: t("new_wallet.connect_onekey_hardware"),
      link: "/hware/onekey/connect",
      gaLabel: "connect onekey hardware",
      btnType: "primary",
    },
  ];

  return (
    <div className="w-full p-4">
      <img
        src="/logo.png"
        alt="utxo global"
        className="w-[150px] mx-auto -mt-10"
      />

      <div className="grid gap-4">
        {items.map((i) => (
          <button
            key={i.label}
            onClick={() => navigate(i.link)}
            className={cn(`btn !py-3`, {
              [i.btnType]: true,
            })}
          >
            {i.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default NewWallet;
