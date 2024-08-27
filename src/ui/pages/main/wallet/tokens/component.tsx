import cn from "classnames";
import { useEffect, useState } from "react";
import Tokens from "./tokens";
import Loading from "react-loading";
import { useGetCKBAddressInfo } from "@/ui/hooks/address-info";

export default function TokenTabs({ active }: { active?: string }) {
  const [tabActive, setTabActive] = useState(active || "xudt");
  const [xudtData, setxUDTData] = useState<any[]>([]);
  const [sudtData, setsUDTData] = useState<any[]>([]);

  const { isLoading, addressInfo } = useGetCKBAddressInfo();

  const TABs = [
    { name: "xudt", title: "xUDT" },
    { name: "sudt", title: "sUDT" },
  ];

  useEffect(() => {
    if (
      addressInfo &&
      addressInfo.attributes &&
      addressInfo.attributes.udt_accounts &&
      addressInfo.attributes.udt_accounts.length > 0
    ) {
      const tokens = addressInfo.attributes.udt_accounts;
      setsUDTData(tokens.filter((token) => token.udt_type === "sudt"));
      setxUDTData(tokens.filter((token) => token.udt_type === "xudt"));
    }
  }, [addressInfo, isLoading]);

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
        {!isLoading && (
          <Tokens tokens={tabActive === "xudt" ? xudtData : sudtData} />
        )}
      </div>
    </div>
  );
}
