import cn from "classnames";
import { useCallback, useEffect, useMemo, useState } from "react";
import Tokens from "./tokens";
import {
  useGetCurrentAccount,
  useGetCurrentNetwork,
} from "@/ui/states/walletState";
import { ckbExplorerApi } from "@/ui/utils/helpers";
import Loading from "react-loading";

export default function TokenTabs({ active }: { active?: string }) {
  const [tabActive, setTabActive] = useState(active || "xudt");
  const [isLoading, setIsLoading] = useState(false);
  const currentNetwork = useGetCurrentNetwork();
  const currentAccount = useGetCurrentAccount();
  const [xudtData, setxUDTData] = useState<any[]>([]);
  const [sudtData, setsUDTData] = useState<any[]>([]);

  const TABs = [
    { name: "xudt", title: "xUDT" },
    { name: "sudt", title: "sUDT" },
  ];

  const getAddressInfo = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const res = await fetch(
        `
        ${ckbExplorerApi(currentNetwork.slug)}/v1/addresses/${
          currentAccount.accounts[0].address
        }`,
        {
          method: "GET",
          headers: {
            Accept: "application/vnd.api+json",
          },
        }
      );
      const { data } = await res.json();
      if (
        data[0] &&
        data[0].attributes &&
        data[0].attributes.udt_accounts &&
        data[0].attributes.udt_accounts.length > 0
      ) {
        setsUDTData(
          data[0].attributes.udt_accounts.filter(
            (token) => token.udt_type === "sudt"
          )
        );

        setxUDTData(
          data[0].attributes.udt_accounts.filter(
            (token) => token.udt_type === "xudt"
          )
        );
      }
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  }, [isLoading]);

  useEffect(() => {
    if (currentAccount.accounts.length > 0 && currentNetwork) {
      getAddressInfo();
    }
  }, [currentNetwork, currentAccount]);

  return (
    <div className="px-4">
      {TABs && (
        <div className="mt-4 inline-block">
          <div className="bg-grey-400 rounded-full flex gap-0">
            {TABs.map((t, index) => (
              <div
                key={`wallet-${t.name}-${index}`}
                className={cn(
                  "font-medium text-sm leading-5 tracking-[0.2px] rounded-full px-4 py-[6px] text-[#787575] cursor-pointer",
                  {
                    "bg-grey-200": t.name === tabActive,
                  }
                )}
                onClick={() => {
                  if (tabActive !== t.name) {
                    setTabActive(t.name);
                  }
                }}
              >
                {t.title}
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="mt-6">
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
        {!isLoading && (
          <Tokens tokens={tabActive === "xudt" ? xudtData : sudtData} />
        )}
      </div>
    </div>
  );
}
