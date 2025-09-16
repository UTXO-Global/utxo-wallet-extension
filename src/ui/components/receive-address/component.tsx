import Modal from "../modal";
import { t } from "i18next";
import {
  useGetCurrentAccount,
  useGetCurrentNetwork,
} from "@/ui/states/walletState";
import { FC, useMemo } from "react";
import { shortAddress } from "@/shared/utils/transactions";
import toast from "react-hot-toast";
import { isBitcoinNetwork } from "@/shared/networks";
import { useNavigate } from "react-router-dom";
import { IcnCopy, IcnQr } from "../icons";

interface Props {
  active: boolean;
  onClose: () => void;
}

const ReceiveAddress: FC<Props> = ({ active, onClose }) => {
  const currentAccount = useGetCurrentAccount();
  const currentNetwork = useGetCurrentNetwork();
  const navigate = useNavigate();

  const accounts = useMemo(() => {
    if (!currentAccount) return [];

    return isBitcoinNetwork(currentNetwork.network)
      ? currentAccount.accounts.slice(3, 5)
      : currentAccount.accounts;
  }, [currentAccount?.accounts, currentNetwork.network]);

  return (
    <Modal
      open={active}
      onClose={onClose}
      title={t("components.layout.receive")}
    >
      <div className="grid gap-4">
        {accounts.map((z, i) => (
          <div
            key={i}
            className="rounded-[12px] px-4 py-3 flex justify-between items-center border border-grey-300 bg-grey-300 hover:border-primary transition-all"
          >
            <div>
              <p className="text-base fomt-medium text-primary">
                {z.addressType.name}
              </p>
              <p className="text-[14px] leading-[18px] text-[#787575]">
                {shortAddress(z.address, 9)}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <div
                className="w-[40px] h-[40px] rounded-full cursor-pointer transition-colors bg-[#F5F5F5] hover:bg-[#EBECEC] flex justify-center items-center"
                onClick={async () => {
                  await navigator.clipboard.writeText(z.address);
                  toast.success(t("transaction_info.copied"));
                }}
              >
                <IcnCopy className="w-4 h-4 stroke-[#ABA8A1]" />
              </div>
              <div
                className="w-[40px] h-[40px] rounded-full cursor-pointer transition-colors bg-[#F5F5F5] hover:bg-[#EBECEC] flex justify-center items-center"
                onClick={() => {
                  navigate(`/pages/receive/${z.address}`);
                }}
              >
                <IcnQr className="w-4 h-4 fill-[#ABA8A1]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
};

export default ReceiveAddress;
