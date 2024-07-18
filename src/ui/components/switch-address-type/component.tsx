import { useGetCurrentNetwork } from "@/ui/states/walletState";
import cn from "classnames";
import { FC } from "react";
import s from "./styles.module.scss";

interface Props {
  handler: (type: string) => void;
  selectedType: string;
}

const SwitchAddressType: FC<Props> = ({ handler, selectedType }) => {
  const currentNetwork = useGetCurrentNetwork();
  return (
    <div className={s.allTypes}>
      {currentNetwork.addressTypes.map((i) => (
        <div
          key={i.name}
          className={cn(s.addressType, {
            [s.selected]: selectedType === i.name,
          })}
          onClick={() => handler(i.name)}
        >
          <div className={s.wrapper}>
            <p className={s.title}>{i.name.replace(/ \(.*\)$/, "")}</p>
            <p className={s.value}>{i.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SwitchAddressType;
