import { TOKEN_FILE_ICON_DEFAULT } from "@/shared/constant";
import { analyzeSmallNumber, formatNumber } from "@/shared/utils";
import { BI } from "@ckb-lumos/lumos";
import { useNavigate } from "react-router-dom";
import { t } from "i18next";
import { CKBTokenInfo } from "@/shared/networks/ckb/types";

export default function Tokens({ tokens }: { tokens: any[] }) {
  const navigate = useNavigate();
  return (
    <div className="rounded-lg border border-grey-300 last:*:border-b-0">
      {tokens.length === 0 && (
        <div className="px-4 py-3 text-sm text-grey-100">
          {t("wallet_page.no_tokens")}
        </div>
      )}
      {tokens.length > 0 &&
        tokens.map((token, index) => {
          const tokenAmount =
            !!token.amount && !!token.decimal
              ? Number(token.amount) / 10 ** Number(token.decimal)
              : 0;
          const amountAnalyze = analyzeSmallNumber(tokenAmount, 2);
          return (
            <div
              className="flex justify-between items-center px-4 py-3 border-b border-b-grey-300 group hover:bg-grey-300 cursor-pointer transition-all"
              key={`token-${token.symbol}=${index}`}
              onClick={() =>
                navigate(`/pages/tokens/${token.udt_type}/${token.type_hash}`)
              }
            >
              <div className="flex gap-[10px]">
                <img
                  src={token.udt_icon_file || TOKEN_FILE_ICON_DEFAULT}
                  className="w-9 h-9 rounded-full"
                />
                <div className="flex flex-col gap-1">
                  <div className="font-medium text-base leading-6">
                    {!!token.symbol ? token.symbol : "Unnamed"}
                  </div>
                  <div className="flex gap-1">
                    <label className="inline-block bg-grey-300 px-2 rounded text-[10px] text-[#787575] group-hover:bg-grey-200">
                      {token.udt_type === "sudt" ? "sUDT" : "xUDT"}
                    </label>
                  </div>
                </div>
              </div>
              <div className="text-sm leading-5 font-medium">
                <span>
                  {Number(amountAnalyze.first) > 1
                    ? `${formatNumber(Number(amountAnalyze.first), 0, 2)}${
                        !!amountAnalyze.last ? "." : ""
                      }`
                    : amountAnalyze.first}
                </span>
                {amountAnalyze.zeroes > 0 && (
                  <span className="align-sub text-[10px]">
                    {amountAnalyze.zeroes}
                  </span>
                )}
                {Number(amountAnalyze.last) > 0 && (
                  <span>{amountAnalyze.last}</span>
                )}
              </div>
            </div>
          );
        })}
    </div>
  );
}
