import { useControllersState } from "@/ui/states/controllerState";
import { useEffect, useState } from "react";

import {
  InvoiceContent,
  transferInvoiceContent,
} from "@/shared/utils/lightning";
import { useGetCurrentNetwork } from "@/ui/states/walletState";
import { KeyIcon } from "@heroicons/react/24/solid";
import { t } from "i18next";
import Loading from "react-loading";
import Layout from "../layout";

const SignLNInvoice = () => {
  const [invoiceContent, setInvoiceContent] = useState<InvoiceContent | null>(
    null
  );

  const { notificationController } = useControllersState((v) => ({
    notificationController: v.notificationController,
  }));
  const currentNetwork = useGetCurrentNetwork();

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    (async () => {
      const approval = await notificationController.getApproval();
      const _invoiceContent = transferInvoiceContent(
        approval.params.data.invoice
      );
      setInvoiceContent(_invoiceContent);
    })();
  }, [notificationController]);

  if (invoiceContent === null) return <Loading type="balls" color="#ODODOD" />;

  return (
    <Layout
      documentTitle={`Lightning on Bitcoin ${currentNetwork.name}`}
      resolveBtnClassName="text-text bg-primary hover:bg-[#E37800]"
      resolveBtnText={t("provider.sign")}
    >
      <>
        <KeyIcon className="w-10 h-10 text-primary" />
        <h4 className="text-xl font-medium">
          Lightning on Bitcoin ${currentNetwork.name}
        </h4>
        <div className="text-sm text-gray-400">
          {t("provider.you_are_signing")}
        </div>
        <div className="p-2 bg-input-bg rounded-xl max-h-full w-full">
          <div className="break-words whitespace-pre-wrap max-h-60 overflow-y-auto px-1 text-base">
            {invoiceContent.description}
          </div>
        </div>

        <div className="flex flex-col gap-4 w-full">
          <div className="flex justify-between">
            <label className="mb-2 flex text-gray-300 pl-2 justify-between">
              <span>Amount</span>
            </label>

            <p>{invoiceContent.amount}</p>
          </div>

          <div className="flex justify-between">
            <label className="mb-2 flex text-gray-300 pl-2 justify-between">
              <span>Expired In</span>
            </label>

            <p>{invoiceContent.expiredIn}</p>
          </div>

          <div className="flex justify-between">
            <label className="mb-2 flex text-gray-300 pl-2 justify-between">
              <span>Description</span>
            </label>

            <p>{invoiceContent.description}</p>
          </div>
        </div>
      </>
    </Layout>
  );
};

export default SignLNInvoice;
