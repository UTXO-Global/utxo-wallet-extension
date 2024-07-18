import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { FC, useState } from "react";
import s from "./styles.module.scss";

import { shortAddress } from "@/shared/utils/transactions";
import Menu from "@/ui/components/menu";
import cn from "classnames";
import { t } from "i18next";
import { MenuItem } from "../menu/components";

interface Props {
  menuItems: MenuItem[];
  id: number;
  selected: boolean;
  name: string;
  onClick: () => void;
  addresses?: string[];
  isRoot?: boolean;
}

const Card: FC<Props> = ({
  menuItems,
  selected,
  onClick,
  name,
  addresses,
  id,
}) => {
  const [active, setActive] = useState(false);

  const onMenuClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation();
    setActive(true);
  };

  return (
    <div
      id={String(id)}
      className={cn(s.card, { [s.selected]: selected })}
      onClick={onClick}
    >
      <div className={s.wrapper}>
        <div className={cn(s.name)}>{name}</div>
        <div className={s.right}>
          <p>{}</p>
          {addresses && (
            <div className="flex flex-col">
              {addresses.map((address, id) => (
                <div key={id} className={s.address}>
                  {shortAddress(address, 7)}
                </div>
              ))}
            </div>
          )}
          <button className={s.action} onClick={onMenuClick}>
            <Bars3Icon
              className={cn("w-8 h-8", {
                "text-primary": selected,
                "text-text": !selected,
              })}
            />
          </button>
        </div>
      </div>
      <Menu
        active={active}
        items={[
          ...menuItems,
          {
            action: () => {
              setActive(false);
            },
            icon: (
              <XMarkIcon
                title={t("components.card.close")}
                className="w-8 h-8 cursor-pointer text-bg"
              />
            ),
          },
        ]}
      />
    </div>
  );
};

export default Card;
