import { useCallback, useEffect, useState } from "react";

import { IField } from "@/shared/interfaces/provider";
import Modal from "@/ui/components/modal";
import { useDecodePsbtInputs as useGetPsbtFields } from "@/ui/hooks/provider";
import { t } from "i18next";
import Loading from "react-loading";
import Layout from "../layout";
import { useControllersState } from "@/ui/states/controllerState";
import {
  useGetCurrentAccount,
} from "@/ui/states/walletState";
import { shortAddress } from "@/shared/utils/transactions";
import { IcnCopy } from "@/ui/components/icons";
import toast from "react-hot-toast";

const SignTransaction = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [fields, setFields] = useState<IField[]>([]);
  const [modalInputIndex, setModalInputIndex] = useState<number | undefined>(
    undefined
  );
  const currentAccount = useGetCurrentAccount();
  const [rawtx, setRawTx] = useState<any>({});
  const { notificationController } = useControllersState((v) => ({
    apiController: v.apiController,
    notificationController: v.notificationController,
  }));

  const getPsbtFields = useGetPsbtFields();

  const updateFields = useCallback(async () => {
    if (fields.length <= 0) setLoading(true);
    try {
      const resultFields = await getPsbtFields();
      setLoading(false);
      if (resultFields === undefined) {
        return;
      }
      setFields(resultFields);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  }, [getPsbtFields, fields]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    (async () => {
      const approval = await notificationController.getApproval();
      if (approval.params.data.psbtBase64) {
        if (fields.length === 0) {
          await updateFields();
        }
        setRawTx(fields);
      } else if (approval.params.data.tx) {
        setRawTx(approval.params.data.tx);
      }
    })();
  }, [notificationController, updateFields, fields]);

  return (
    <Layout
      documentTitle={t("provider.sign_tx")}
      resolveBtnClassName="text-text bg-primary hover:bg-[#E37800]"
      resolveBtnText={t("provider.sign")}
    >
      <div className="-mt-4">
        <h3 className="text-[24px] leading-[28px] font-medium text-primary text-center">
          {t("provider.sign_tx")}
        </h3>
        {loading ? (
          <Loading
            type="balls"
            color="#ODODOD"
            className="mx-auto rounded-full overflow-hidden"
          />
        ) : (
          <div>
            <div className="text-[#787575] text-sm leading-[18px] font-normal mt-2 text-center">
              Only sign this message if you fully understand
              <br /> the content and trust the requesting site.
            </div>
            <div className="px-4 py-[10px] rounded-lg bg-[#F5F5F5] mt-6 flex items-center gap-3">
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
            <div className="w-full bg-grey-300 overflow-hidden max-h-[205px] mt-4 relative">
              <IcnCopy
                className="w-4 h-4 absolute top-2 right-2 transition-colors stroke-primary hover:stroke-[#787575]  cursor-pointer"
                onClick={() => {
                  navigator.clipboard
                    .writeText(JSON.stringify(rawtx, null, 2))
                    .then(() => {
                      toast.success("Transaction copied");
                    })
                    .catch((err) => {
                      toast.error("Failed to copy");
                    });
                }}
              />
              <div className="w-full p-2 text-xs overflow-auto max-h-[205px]">
                <pre>{JSON.stringify(rawtx, null, 2)}</pre>
              </div>
            </div>
          </div>
        )}
      </div>
      <Modal
        open={modalInputIndex !== undefined}
        onClose={() => {
          setModalInputIndex(undefined);
        }}
        title={t("provider.warning")}
      >
        <div className="text-lg font-medium p-6">
          {t("provider.anyone_can_pay_warning")}
        </div>
      </Modal>
    </Layout>
  );
};

export default SignTransaction;
