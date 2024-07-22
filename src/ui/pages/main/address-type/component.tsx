import { shortAddress } from "@/shared/utils/transactions";
import { useGetCurrentWallet } from "@/ui/states/walletState";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { t } from "i18next";
import { IcnCopy } from "@/ui/components/icons";

const AddressType = () => {
  const { accId } = useParams();
  const currentWallet = useGetCurrentWallet();
  const account = currentWallet.accounts[Number(accId)];
  return (
    <div className="grid gap-2 w-full h-full p-4 content-start">
      {account.accounts.map((z, i) => (
        <div
          key={i}
          className="rounded-lg border border-grey-300 px-4 py-3 flex justify-between items-center"
        >
          <div>
            <p className="text-base text-primary font-medium">
              {z.addressType.name}
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
  );
};

export default AddressType;
