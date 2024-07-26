import { useCallback, useEffect, useState } from "react";

import { IField } from "@/shared/interfaces/provider";
import Modal from "@/ui/components/modal";
import { useDecodePsbtInputs as useGetPsbtFields } from "@/ui/hooks/provider";
import { useGetCurrentNetwork } from "@/ui/states/walletState";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { KeyIcon } from "@heroicons/react/24/solid";
import cn from "classnames";
import { t } from "i18next";
import Loading from "react-loading";
import Layout from "../layout";
import { useControllersState } from "@/ui/states/controllerState";
import { Psbt } from "bitcoinjs-lib";

const SignTransaction = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [fields, setFields] = useState<IField[]>([]);
  const [modalInputIndex, setModalInputIndex] = useState<number | undefined>(undefined);
  const [rawtx, setRawTx] = useState<any>({});
  const { notificationController } = useControllersState(
    (v) => ({
      apiController: v.apiController,
      notificationController: v.notificationController,
    })
  );

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
      if (!!approval.params.data.psbtBase64) {
        if (fields.length === 0) {
          await updateFields()
        }
        setRawTx(fields)
      } else if (approval.params.data.tx) {
        setRawTx(approval.params.data.tx)
      }
    })();
  }, [notificationController, updateFields, fields]);

  if (loading) return <Loading type="balls" color="#ODODOD" />;

  return (
    <Layout
      documentTitle={t("provider.sign_tx")}
      resolveBtnClassName="text-text bg-primary hover:bg-[#E37800]"
      resolveBtnText={t("provider.sign")}
    >
      <div className="-mt-6">
        <h3 className="text-[24px] leading-[28px] font-medium text-primary text-center">
          {t("provider.sign_tx")}
        </h3>
        <div className="flex flex-col gap-4 w-full bg-grey-300 text-xs p-2 overflow-auto max-h-[340px] mt-6">
          <pre>{JSON.stringify(rawtx, null, 2)}</pre>
        </div>
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
