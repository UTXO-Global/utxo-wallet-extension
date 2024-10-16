import cn from "classnames";
import { useEffect, useState } from "react";
import Tokens from "./tokens";
import Loading from "react-loading";
import { useGetCKBAddressInfo } from "@/ui/hooks/address-info";
import { useGetCurrentNetwork } from "@/ui/states/walletState";
import { BI } from "@ckb-lumos/lumos";

export default function TokenTabs() {
  const [tokens, setTokens] = useState<any[]>([]);
  const { isLoading, addressInfo } = useGetCKBAddressInfo();
  const currentNetwork = useGetCurrentNetwork();

  const getTokenDefaults = async () => {
    const _network = currentNetwork.slug === "nervos" ? "mainnet" : "testnet";
    const jsonURL = `https://config.utxo.global/${_network}.tokens.json`;
    try {
      const res = await fetch(`${jsonURL}?t=${Date.now()}`);
      const data = await res.json();
      setTokens([...data]);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const f = async () => {
      await getTokenDefaults();
      const udtAccounts = addressInfo?.attributes?.udt_accounts || [];
      if (udtAccounts.length > 0) {
        const udtAccounts = addressInfo.attributes.udt_accounts;
        const tokens = udtAccounts.filter(
          (token) =>
            ["sudt", "xudt", "xudt_compatible"].includes(token.udt_type) &&
            BI.from(token.amount).gt(BI.from(0))
        );

        setTokens((prev) => {
          return tokens.reduce(
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
      }
    };
    f().catch((e) => console.log(e));
  }, [addressInfo, isLoading]);

  return (
    <div className="px-4">
      <div className="mt-4 inline-block">
        <div className="bg-grey-400 rounded-full flex gap-0">
          <div
            className={cn(
              "font-medium text-sm leading-5 tracking-[0.2px] rounded-full px-4 py-[6px] text-[#787575] cursor-pointer bg-grey-300"
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
