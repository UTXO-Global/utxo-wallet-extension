import Modal from "../modal";
import { t } from "i18next";
import { useGetCurrentAccount } from "@/ui/states/walletState";
import { FC } from "react";
import { shortAddress } from "@/shared/utils/transactions";
import toast from "react-hot-toast";
import { IcnCopy } from "@/ui/components/icons";

interface Props {
  active: boolean;
  onClose: () => void;
}

const CopyAddress: FC<Props> = ({ active, onClose }) => {
  const currentAccount = useGetCurrentAccount();

  return (
    <Modal
      open={active}
      onClose={onClose}
      title={t("components.layout.address_type")}
    >
      <div className="grid gap-4">
        {currentAccount.accounts.map((z, i) => (
          <div key={i} className="rounded-lg flex justify-between items-center">
            <div>
              <p className="text-base fomt-medium text-primary">
                {z.addressType.name === "Nervos" ? "CKB" : z.addressType.name}
              </p>
              <p className="text-[14px] leading-[18px] text-[#787575]">
                {shortAddress(z.address, 9)}
              </p>
            </div>
            <div
              className="w-[40px] h-[40px] rounded-full cursor-pointer transition-colors bg-[#F5F5F5] hover:bg-[#EBECEC] flex justify-center items-center"
              onClick={async () => {
                await navigator.clipboard.writeText(z.address);
                toast.success(t("transaction_info.copied"));
              }}
            >
              <IcnCopy className="w-4 h-4 stroke-[#ABA8A1]" />
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
};

export default CopyAddress;
