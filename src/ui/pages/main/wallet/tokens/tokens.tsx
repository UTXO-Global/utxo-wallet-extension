import { TOKEN_FILE_ICON_DEFAULT } from "@/shared/constant";
import { formatNumber } from "@/shared/utils";
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
        tokens.map((token, index) => (
          <div
            className="flex justify-between items-center px-4 py-3 border-b border-b-grey-300 hover:bg-grey-300 cursor-pointer transition-all"
            key={`token-${token.symbol}=${index}`}
            onClick={() =>
              navigate(`/pages/tokens/${token.udt_type}/${token.type_hash}`)
            }
          >
            <div className="flex gap-[10px]">
              <img
                src={token.udt_icon_file || TOKEN_FILE_ICON_DEFAULT}
                className="w-6 h-6 rounded-full"
              />
              <label className="font-medium text-base leading-6">
                {token.symbol}
              </label>
            </div>
            <div className="text-sm leading-5 font-medium">
              {formatNumber(
                BI.from(token.amount)
                  .div(BI.from(10 ** Number(token.decimal)))
                  .toNumber(),
                0,
                3
              )}
            </div>
          </div>
        ))}
    </div>
  );
}
