import cn from "classnames";
import { FC, useEffect, useState } from "react";
import s from "./styles.module.scss";
import { t } from "i18next";
import { useAppState } from "@/ui/states/appState";
import { useTransactionManagerContext } from "@/ui/utils/tx-ctx";

interface Props {
  onChange: (value: number | string) => void;
  value: number | string;
}

const FeeInput: FC<Props> = ({ onChange, value }) => {
  const { feeRates } = useTransactionManagerContext();
  const [selected, setSelected] = useState<number>(feeRates?.slow ?? 10);

  useEffect(() => {
    if (selected !== 3) {
      onChange(selected);
    }
  }, [selected, onChange]);

  const cards = [
    {
      title: t("send.create_send.fee_input.slow"),
      description: `${feeRates?.slow ?? "~"} sat/vB`,
      value: feeRates?.slow ?? 10,
    },
    {
      title: t("send.create_send.fee_input.fast"),
      description: `${feeRates?.fast ?? "~"} sat/vB`,
      value: feeRates?.fast ?? 100,
    },
    {
      title: t("send.create_send.fee_input.custom"),
      value: 3,
    },
  ];

  return (
    <div className={s.container}>
      <div className={s.cardWrapper}>
        {cards.map((f, i) => (
          <FeeCard
            key={i}
            description={f.description}
            title={f.title}
            onSelect={() => setSelected(f.value as typeof selected)}
            selected={f.value === selected}
          />
        ))}
      </div>
      <input
        type="number"
        className={cn("input", { hidden: selected !== 3 })}
        placeholder="sat/vB"
        value={value}
        onChange={(e) => {
          onChange(e.target.value === "" ? "" : Number(e.target.value));
        }}
      />
    </div>
  );
};

interface FeeCardProps {
  selected: boolean;
  onSelect: () => void;
  title: string;
  description: string;
}

const FeeCard: FC<FeeCardProps> = ({
  selected,
  onSelect,
  title,
  description,
}) => {
  const { language } = useAppState((v) => ({
    language: v.language,
  }));

  return (
    <div
      className={cn(s.card, { [s.cardSelected]: selected })}
      onClick={onSelect}
    >
      <div className={cn(s.title, language !== "en" && s.russian)}>{title}</div>
      {description ? <div className={s.description}>{description}</div> : ""}
    </div>
  );
};

export default FeeInput;
