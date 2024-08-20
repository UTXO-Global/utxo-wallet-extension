import { useControllersState } from "@/ui/states/controllerState";
import { useEffect, useState } from "react";

import Layout from "../layout";
import { t } from "i18next";
import { useGetCurrentAccount } from "@/ui/states/walletState";
import { shortAddress } from "@/shared/utils/transactions";

const SignMessage = () => {
  const [message, setMessage] = useState<string>();
  const currentAccount = useGetCurrentAccount();
  const { notificationController } = useControllersState((v) => ({
    notificationController: v.notificationController,
  }));

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    (async () => {
      const approval = await notificationController.getApproval();
      setMessage(approval.params.data.text);
    })();
  }, [notificationController]);

  return (
    <Layout
      documentTitle={t("provider.sign_request")}
      resolveBtnClassName="text-text bg-primary hover:bg-[#E37800]"
      resolveBtnText={t("provider.sign")}
    >
      <div className="-mt-5">
        <img
          src="/sign-message.png"
          className="w-[116px] mx-auto"
          alt="sign message"
        />
        <h3 className="text-[24px] leading-[28px] font-medium text-primary text-center capitalize mt-4">
          {t("provider.sign_request")}
        </h3>
        <div className="px-4 py-[10px] rounded-lg bg-[#F5F5F5] mt-8 flex items-center gap-3">
          <img src="account.png" className="w-8 h-8" />
          <div className="break-words whitespace-pre-wrap overflow-y-auto text-sm flex flex-col gap-[2px]">
            <strong className="text-lg font-medium text-primary leading-6">
              {currentAccount.name}
            </strong>
            <span className="text-[#787575]">
              {shortAddress(currentAccount.accounts[0].address, 12)}
            </span>
          </div>
        </div>
        <div className="px-4 py-[20px] rounded-lg bg-[#F5F5F5] mt-4">
          <div className="break-words whitespace-pre-wrap max-h-60 overflow-y-auto text-primary text-base">
            {message}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SignMessage;
