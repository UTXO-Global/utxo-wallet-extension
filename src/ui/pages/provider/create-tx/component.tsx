import { useControllersState } from "@/ui/states/controllerState";
import { useEffect, useState } from "react";

import { KeyIcon } from "@heroicons/react/24/solid";
import Layout from "../layout";
import type { CreateTxProps } from "@/shared/interfaces/notification";
import { t } from "i18next";
import { useGetCurrentNetwork } from "@/ui/states/walletState";
import { shortAddress } from "@/shared/utils/transactions";

const CreateTx = () => {
  const [psbt, setPsbt] = useState<CreateTxProps>();
  const currentNetwork = useGetCurrentNetwork();

  const { notificationController } = useControllersState((v) => ({
    notificationController: v.notificationController,
  }));

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    (async () => {
      const approval = await notificationController.getApproval();
      setPsbt(approval.params.data);
    })();
  }, [notificationController]);

  if (!psbt) return <></>;

  const fields = [
    {
      label: "Address",
      value: shortAddress(psbt.to, 6),
    },
    {
      label: "Amount",
      value: `${psbt.amount} ${currentNetwork.coinSymbol}`,
    },
    {
      label: "Fee Rate",
      value: `${psbt.feeRate}`,
    },
  ];

  return (
    <Layout
      documentTitle={t("provider.create_transaction")}
      resolveBtnClassName="text-text bg-primary hover:bg-[#E37800]"
      resolveBtnText={t("components.layout.send")}
    >
      <>
        <KeyIcon className="w-10 h-10 text-primary" />
        <h4 className="text-xl font-medium mb-6">
          Send {currentNetwork.coinSymbol}
        </h4>
        <div className="flex flex-col gap-4 w-full">
          {fields.map((i) => (
            <div key={i.label}>
              <label className="mb-2 block text-gray-300 pl-2">{i.label}</label>
              <div className="bg-input-bg rounded-xl px-5 py-2">{i.value}</div>
            </div>
          ))}
        </div>
      </>
    </Layout>
  );
};

export default CreateTx;
