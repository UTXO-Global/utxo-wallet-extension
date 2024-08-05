import { useControllersState } from "@/ui/states/controllerState";
import { useEffect, useState } from "react";

import Layout from "../layout";
import { t } from "i18next";

const SignMessage = () => {
  const [message, setMessage] = useState<string>();

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
      <>
        <img
          src="/sign-message.png"
          alt="sign message"
          className="w-[116px] mx-auto"
        />
        <h3 className="text-[24px] leading-[28px] font-medium text-primary text-center capitalize mt-6">
          {t("provider.sign_request")}
        </h3>
        <div className="px-4 py-[20px] rounded-lg bg-[#F5F5F5] mt-10">
          <div className="break-words whitespace-pre-wrap max-h-60 overflow-y-auto text-primary text-base">
            {message}
          </div>
        </div>
      </>
    </Layout>
  );
};

export default SignMessage;
