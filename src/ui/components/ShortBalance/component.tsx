import { analyzeSmallNumber, formatNumber } from "@/shared/utils";
import { useMemo } from "react";
import cn from "classnames";

export default function ShortBalance({
  balance,
  zeroDisplay,
  className,
}: {
  balance: number;
  zeroDisplay?: number;
  className?: string;
}) {
  const amountAnalyze = useMemo(() => {
    const b = analyzeSmallNumber(balance, zeroDisplay ? zeroDisplay : 2);
    return b;
  }, [balance, zeroDisplay]);

  return (
    <div className={cn(`text-lg ${!!className ? className : ""}`)}>
      <span>
        {Number(amountAnalyze.first) > 1
          ? `${formatNumber(Number(amountAnalyze.first), 0, 2)}`
          : amountAnalyze.first}
        {!!amountAnalyze.last && !amountAnalyze.first.includes(".") ? "." : ""}
      </span>
      {amountAnalyze.zeroes > 0 && (
        <span className="align-sub text-xs">{amountAnalyze.zeroes}</span>
      )}
      {Number(amountAnalyze.last) > 0 && <span>{amountAnalyze.last}</span>}
    </div>
  );
}
