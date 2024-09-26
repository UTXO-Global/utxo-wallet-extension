import { useNavigate } from "react-router-dom";
import { t } from "i18next";
import ShortBalance from "@/ui/components/ShortBalance";
import TextAvatar from "@/ui/components/text-avatar";

export default function Tokens({ tokens }: { tokens: any[] }) {
  const navigate = useNavigate();
  const NoTokens = () => {
    return (
      <div className="w-full items-center flex flex-col justify-start gap-6 text-base text-grey-100 capitalize mt-6">
        {t("wallet_page.no_tokens")}
        <div>
          <img src="/no-tokens.png" className="h-[30px]" />
        </div>
      </div>
    );
  };

  if (tokens.length === 0) {
    return (
      <div className="px-4 py-3 text-sm text-grey-100">
        <NoTokens />
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-grey-300 last:*:border-b-0">
      {tokens.length > 0 &&
        tokens.map((token, index) => {
          const tokenAmount =
            !!token.amount && !!token.decimal
              ? Number(token.amount) / 10 ** Number(token.decimal)
              : 0;
          return (
            <div
              className="flex justify-between items-center px-4 py-3 border-b border-b-grey-300 group hover:bg-grey-300 cursor-pointer transition-all"
              key={`token-${token.symbol}=${index}`}
              onClick={() =>
                navigate(`/pages/tokens/${token.udt_type}/${token.type_hash}`)
              }
            >
              <div className="flex gap-[10px] justify-center items-center">
                {!!token.udt_icon_file ? (
                  <img src={token.udt_icon_file} className="h-9 rounded-full" />
                ) : (
                  <TextAvatar
                    text={token.symbol || "Unnamed"}
                    className="!h-9 !w-9"
                  />
                )}
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
                <ShortBalance balance={tokenAmount} zeroDisplay={6} />
              </div>
            </div>
          );
        })}
    </div>
  );
}
