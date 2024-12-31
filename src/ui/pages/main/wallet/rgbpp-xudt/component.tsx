import cn from "classnames";
import { useEffect, useState } from "react";
import Tokens from "./tokens";
import Loading from "react-loading";
import {
  useGetCurrentAccount,
  useGetCurrentNetwork,
} from "@/ui/states/walletState";
import { apiController } from "@/background/controllers";
import { RgbppXudtBalance } from "@/shared/interfaces/rgbpp";

export default function RgbppXudtTabs() {
  const [tokens, setTokens] = useState<any[]>([]);
  const currentAccount = useGetCurrentAccount();
  const [isLoading, setIsLoading] = useState(false);
  const network = useGetCurrentNetwork();

  useEffect(() => {
    const f = async () => {
      setIsLoading(true);
      const xudtBalances: RgbppXudtBalance[] = [];
      for (const account of currentAccount.accounts) {
        xudtBalances.push(
          ...(await apiController.getRgbppXudtBalances(
            account.address,
            network
          ))
        );
      }

      setTokens((prev) => {
        return xudtBalances.reduce(
          (newTokens, t) => {
            const idx = newTokens.findIndex(
              (item) => item.type_hash === t.type_hash
            );
            if (idx > -1) {
              newTokens[idx] = { ...t };
            } else {
              newTokens.push(t);
            }
            return newTokens;
          },
          [...prev]
        );
      });
      setIsLoading(false);
    };
    f().catch((e) => {
      setIsLoading(false);
      console.log(e);
    });
  }, [JSON.stringify(currentAccount.accounts)]);

  return (
    <div className="px-4">
      <div className="mt-4 inline-block">
        <div className="bg-grey-400 rounded-full flex gap-0">
          <div
            className={cn(
              "font-medium text-sm leading-5 tracking-[0.2px] rounded-full px-4 py-[6px] text-[#787575] cursor-pointer bg-grey-300"
            )}
          >
            RGB++ Assets
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
