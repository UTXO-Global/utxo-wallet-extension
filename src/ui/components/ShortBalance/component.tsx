import { analyzeSmallNumber, formatNumber } from "@/shared/utils";
import { useMemo } from "react";
import cn from "classnames";

export default function ShortBalance({
  balance,
  zeroDisplay,
  isDot,
  className,
}: {
  balance: number;
  zeroDisplay?: number;
  className?: string;
  isDot?: boolean;
}) {
  const amountAnalyze = useMemo(() => {
    const b = analyzeSmallNumber(balance, zeroDisplay ? zeroDisplay : 2);
    return b;
  }, [balance, zeroDisplay]);

  if (isDot) {
    return (
      <div
        className={cn(
          `text-lg text-ellipsis overflow-hidden max-w-[calc(100%_-_10px)] align-middle ${
            !!className ? className : ""
          }`
        )}
      >
        {formatNumber(balance, 0, 8)}
      </div>
    );
  }

  return (
    <div className={cn(`text-lg ${!!className ? className : ""}`)}>
      <span>
        {Number(amountAnalyze.first) > 0
          ? `${formatNumber(Number(amountAnalyze.first), 0, 2)}`
          : amountAnalyze.first}
        {!!amountAnalyze.last &&
        amountAnalyze.last &&
        !amountAnalyze.first.includes(".")
          ? "."
          : ""}
      </span>
      {amountAnalyze.zeroes > 0 && (
        <span className="align-sub text-xs">{amountAnalyze.zeroes}</span>
      )}
      {Number(amountAnalyze.last) > 0 && <span>{amountAnalyze.last}</span>}
    </div>
  );
}
