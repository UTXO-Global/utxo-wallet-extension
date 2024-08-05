import { useControllersState } from "@/ui/states/controllerState";
import { useEffect, useState } from "react";

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
      label: t("send.confirm_send.to_addrses"),
      value: shortAddress(psbt.to, 15),
    },
    {
      label: t(`send.confirm_send.amount`),
      value: `
        <span style="font-size: 16px">${psbt.amount}</span>
        <span style="font-size: 16px; color: #A69C8C">${currentNetwork.coinSymbol}</span>
      `,
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
        <h3 className="text-[24px] leading-[28px] font-medium text-primary text-center">
          Send {currentNetwork.coinSymbol}
        </h3>
        <div className="flex flex-col gap-4 w-full mt-4">
          {fields.map((i) => (
            <div key={i.label}>
              <label className="text-base">{i.label}</label>
              <div
                className="bg-grey-300 p-4 rounded-lg border border-grey-200 flex items-center justify-between"
                dangerouslySetInnerHTML={{ __html: i.value?.trim() }}
              />
            </div>
          ))}
        </div>
      </>
    </Layout>
  );
};

export default CreateTx;
