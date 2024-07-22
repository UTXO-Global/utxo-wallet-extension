import Layout from "../layout";
import { t } from "i18next";
import { useGetCurrentAccount } from "@/ui/states/walletState";
import { shortAddress } from "@/shared/utils/transactions";

const Connect = () => {
  const currentAccount = useGetCurrentAccount();

  return (
    <Layout
      documentTitle={t("provider.connecting")}
      resolveBtnText={t("provider.connect")}
      resolveBtnClassName="text-text bg-primary hover:bg-[#F5F5F5]"
    >
      <h3 className="text-[24px] leading-[28px] font-medium text-primary text-center">
        {t("provider.connect_with_utxo")}
      </h3>

      <div className="rounded-lg bg-[#F5F5F5] p-4 flex items-center gap-2 mt-6">
        <img src="/account.png" alt="account" className="w-[32px]" />
        <div className="flex-1">
          <p className="text-[18px] leading-[140%] text-primary font-medium">{currentAccount.name}</p>
          <p className="mt-[2px] text-[14px] leading-[18px] text-[#787575]">{shortAddress(currentAccount.accounts[0].address)}</p>
        </div>
      </div>

    
    </Layout>
  );
};

export default Connect;
