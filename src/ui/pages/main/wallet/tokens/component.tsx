import cn from "classnames";
import { useEffect, useState } from "react";
import Tokens from "./tokens";
import Loading from "react-loading";
import { useGetCKBAddressInfo } from "@/ui/hooks/address-info";

export default function TokenTabs({ active }: { active?: string }) {
  const [tokens, setsTokens] = useState<any[]>([]);

  const { isLoading, addressInfo } = useGetCKBAddressInfo();

  useEffect(() => {
    if (
      addressInfo &&
      addressInfo.attributes &&
      addressInfo.attributes.udt_accounts &&
      addressInfo.attributes.udt_accounts.length > 0
    ) {
      const tokens = addressInfo.attributes.udt_accounts;
      setsTokens(
        tokens.filter((token) => ["sudt", "xudt"].includes(token.udt_type))
      );
    }
  }, [addressInfo, isLoading]);

  return (
    <div className="px-4">
      <div className="mt-4 inline-block">
        <div className="bg-grey-400 rounded-full flex gap-0">
          <div
            className={cn(
              "font-medium text-sm leading-5 tracking-[0.2px] rounded-full px-4 py-[6px] text-[#787575] cursor-pointer bg-grey-200"
            )}
          >
            Coins
          </div>
        </div>
      </div>
      <div className="mt-4">
        {isLoading && (
          <div className="flex justify-center">
            <Loading
              type="spin"
              color="#ODODOD"
              width={"2rem"}
              height={"2rem"}
              className="react-loading pr-2"
            />
          </div>
        )}
        {!isLoading && <Tokens tokens={tokens} />}
      </div>
    </div>
  );
}
