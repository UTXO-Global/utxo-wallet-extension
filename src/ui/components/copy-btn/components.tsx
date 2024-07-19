import { FC, HTMLAttributes } from "react";
import s from "./styles.module.scss";
import toast from "react-hot-toast";
import cn from "classnames";
import { t } from "i18next";
import { IcnCopy } from "@/ui/components/icons";

interface Props extends HTMLAttributes<HTMLDivElement> {
  label?: string;
  value?: string;
  className?: string;
  iconClassName?: string;
  title?: string;
}

const CopyBtn: FC<Props> = ({
  label,
  value,
  className,
  iconClassName,
  title,
  ...props
}) => {
  return (
    <button
      title={title}
      className={className ? className : s.btn}
      onClick={async () => {
        if (!value) return;
        await navigator.clipboard.writeText(value);
        toast.success(t("transaction_info.copied"));
      }}
    >
      {label ? (
        <div {...props} className="text-xs">
          {label}
        </div>
      ) : undefined}

      <IcnCopy className={cn("w-4 h-4", iconClassName)} />
    </button>
  );
};

export default CopyBtn;
