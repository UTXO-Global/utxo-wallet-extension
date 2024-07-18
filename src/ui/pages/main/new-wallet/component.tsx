import Tile from "@/ui/components/tile";
import { TileProps } from "@/ui/components/tile/component";
import { GlobeAltIcon, KeyIcon, PlusIcon } from "@heroicons/react/24/outline";
import { t } from "i18next";
import Analytics from "@/ui/utils/gtm";
import s from "./styles.module.scss";
import cn from "classnames";
import { useNavigate } from "react-router-dom";

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
    // {
    //   icon: <KeyIcon className={ICON_CN} />,
    //   label: t("new_wallet.restore_from_private_key_label"),
    //   link: "/pages/restore-priv-key",
    //   gaLabel: "restore from pk",
    // },
    // {
    //   icon: <GlobeAltIcon className={ICON_CN} />,
    //   label: t("new_wallet.restore_ordinals_label"),
    //   link: "/pages/restore-ordinals",
    //   gaLabel: "restore ordinals mnemonic",
    // },
  ];

  const analytics = async (label: string, path: string) => {
    // NOTE: [GA] - Create new wallet
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    await Analytics.fireEvent("ob_create_new_wallet", {
      action: "click",
      label,
    });
    navigate(path);
  };

  return (
    <div className="w-full p-4">
      <img src="/logo.png" alt="utxo global" className="w-[150px] mx-auto -mt-10" />

      <div className="grid gap-4">
        {items.map((i) => (
          <button
            key={i.label}
            onClick={() => analytics(i.gaLabel, i.link)}
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
