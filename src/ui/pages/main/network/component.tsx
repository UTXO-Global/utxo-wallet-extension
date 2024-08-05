import cn from "classnames";
import { supportedNetworks } from "@/shared/networks";
import { useSwitchNetwork } from "@/ui/hooks/wallet";
import { useGetCurrentNetwork } from "@/ui/states/walletState";
import Analytics from "@/ui/utils/gtm";
import { NETWORK_ICON } from "@/shared/networks";
import { useState } from "react";
import { IcnCheck } from "@/ui/components/icons";
import { IcnCircleSolid } from "@/ui/components/icons/IcnCircleSolid";

const Network = () => {
  const currentNetwork = useGetCurrentNetwork();
  const switchNetwork = useSwitchNetwork();
  const [parentNetworkSelect, setParentNetworkSelect] = useState("");

  const analytics = (label: string) => {
    // NOTE: [GA] - Switch network
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    Analytics.fireEvent("st_switch_network", {
      action: "click",
      label,
    });
  };

  return (
    <div className="w-full h-full grid gap-3 px-6 content-start outline-none select-none py-6">
      {supportedNetworks.map((z, i) => (
        <div
          key={i}
          className="grid gap-2"
          onClick={() => {
            if (z.slug === parentNetworkSelect) {
              setParentNetworkSelect("");
            } else {
              setParentNetworkSelect(z.slug);
            }
          }}
        >
          <div
            className={cn(
              "w-full border border-grey-300 hover:bg-grey-300 rounded-lg p-3 transition-colors flex items-center justify-between cursor-pointer",
              {
                "bg-grey-300":
                  parentNetworkSelect === z.slug ||
                  currentNetwork.parentSlug === z.slug,
              }
            )}
          >
            <div className="flex items-center gap-4">
              <img
                src={NETWORK_ICON[z.slug]}
                alt={z.name}
                className="w-8 h-8 rounded-full"
              />
              <span className="font-medium">{z.name}</span>
            </div>
            <div className="flex gap-2 items-center">
              {currentNetwork.parentSlug === z.slug && (
                <IcnCircleSolid className="w-4 h-4 text-primary" />
              )}
              <svg
                className={cn("w-6 h-6 stroke-primary", {
                  "-rotate-180": parentNetworkSelect === z.slug,
                })}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M7 10L12 15L17 10"
                  stroke="#0D0D0D"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          <div
            className="gap-2 border border-grey-300 p-2 rounded-lg"
            style={{
              display: parentNetworkSelect === z.slug ? "grid" : "none",
            }}
          >
            {z.networks.map((network, j) => (
              <div
                key={j}
                onClick={() => {
                  analytics(network.slug);
                  switchNetwork(network.slug).catch((e) => console.error(e));
                }}
                style={{ height: "56px" }}
                className={cn(
                  "w-full hover:bg-grey-300 hover:text-primary rounded-lg p-3 text-[#787575] transition-colors flex items-center justify-between cursor-pointer group",
                  {
                    "!bg-grey-300 !text-primary":
                      currentNetwork.slug === network.slug,
                  }
                )}
              >
                <div className="flex items-center gap-4 group">
                  <img
                    className={cn("w-8 h-8 hidden", {
                      block: currentNetwork.slug === network.slug,
                    })}
                    src={NETWORK_ICON[network.slug]}
                    alt={network.name}
                  />
                  <span className="font-medium">{network.name}</span>
                </div>
                <div className="flex gap-2 items-center">
                  {currentNetwork.slug === network.slug && (
                    <IcnCheck className="w-6 h-6" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Network;
