import s from "../styles.module.scss";
import { Link, useNavigate } from "react-router-dom";
import {
  useGetCurrentAccount,
  useGetCurrentNetwork,
  useGetCurrentWallet,
} from "@/ui/states/walletState";
import Analytics from "@/ui/utils/gtm";
import { useState } from "react";
import CopyAddress from "@/ui/components/copy-address";
import { IcnChevronDown, IcnSetting, IcnCopy } from "@/ui/components/icons";
import { NETWORK_ICON } from "@/shared/networks";

const WalletPanel = () => {
  const [isShowCopyAddress, setIsShowCopyAddress] = useState<boolean>(false);
  const currentWallet = useGetCurrentWallet();
  const currentAccount = useGetCurrentAccount();
  const currentNetwork = useGetCurrentNetwork();
  const navigate = useNavigate();

  const _navigate = (path: string, name: string, label: string) => {
    // NOTE: [GA]
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    Analytics.fireEvent(name, {
      action: "click",
      label,
    });
    navigate(path);
  };

  return (
    <div className="flex justify-between items-center sticky left-0 py-3 px-4 w-full top-0 z-50 standard:!relative border-b border-grey-300 bg-light-100">
      <div
        className="flex gap-3 items-center select-none cursor-pointer"
        onClick={() => {
          if (currentAccount) {
            navigate("/pages/switch-account");
          }
        }}
      >
        <img
          src="/utxo-global-account.png"
          className="w-10 h-10 rounded-full"
        />
        <div className="grid">
          <div className="flex gap-2 items-center">
            <div className={`${s.change} font-normal !leading-[22.4px]`}>
              {currentWallet?.name ?? "wallet"}{" "}
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <div className={`${s.change} font-medium !leading-4`}>
              {currentAccount?.name}{" "}
            </div>
            {currentAccount && <IcnChevronDown className="w-3 h-3" />}
          </div>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        {currentAccount && (
          <IcnCopy
            className="w-6 transition-colors stroke-primary hover:stroke-[#787575]  cursor-pointer"
            onClick={() => setIsShowCopyAddress(true)}
          />
        )}
        <IcnSetting
          className="w-6 h-6 stroke-primary hover:stroke-[#787575] hover:rotate-90 cursor-pointer transition-transform"
          onClick={() =>
            _navigate("/pages/settings", "pf_settings", "settings")
          }
        />
        <div
          className="px-2 py-1 rounded-full flex gap-[6px] items-center bg-[#EBECEC] cursor-pointer"
          onClick={() => _navigate("/pages/network", "st_options", "network")}
        >
          <img
            src={NETWORK_ICON[currentNetwork.slug]}
            className="rounded-full"
            style={{
              width: "24px",
            }}
            alt="icon"
          />
          <IcnChevronDown className="w-[14px] h-[14px]" />
        </div>
      </div>

      {currentAccount && (
        <CopyAddress
          active={isShowCopyAddress}
          onClose={() => setIsShowCopyAddress(false)}
        />
      )}
    </div>
  );
};

export default WalletPanel;
