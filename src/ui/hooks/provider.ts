import {
  IField,
  IFieldValue,
  LocationValue,
  SignPsbtOptions,
} from "@/shared/interfaces/provider";
import { toFixed } from "@/shared/utils/transactions";
import { Psbt } from "bitcoinjs-lib";
import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useControllersState } from "../states/controllerState";
import {
  useGetCurrentAccount,
  useGetCurrentNetwork,
} from "../states/walletState";
import { isNotification } from "../utils";
import { commons, helpers } from "@ckb-lumos/lumos";
import { TransactionSkeletonType } from "@ckb-lumos/lumos/helpers";

export const useApproval = () => {
  const navigate = useNavigate();
  const { notificationController } = useControllersState((v) => ({
    notificationController: v.notificationController,
  }));

  const resolveApproval = async (
    data?: any,
    stay = false,
    forceReject = false
  ) => {
    const approval = await notificationController.getApproval();

    if (approval) {
      await notificationController.resolveApproval(data, forceReject);
    }
    if (stay) {
      return;
    }
    setTimeout(() => {
      navigate("/");
    });
  };

  const rejectApproval = useCallback(
    async (
      err?: string,
      stay: boolean = false,
      isInternal: boolean = false
    ) => {
      const approval = await notificationController.getApproval();
      if (approval) {
        await notificationController.rejectApproval(err, stay, isInternal);
      }
      if (!stay) {
        navigate("/");
      }
    },
    [notificationController, navigate]
  );

  useEffect(() => {
    if (!isNotification()) {
      return;
    }
    window.addEventListener("beforeunload", rejectApproval as any);

    return () =>
      window.removeEventListener("beforeunload", rejectApproval as any);
  }, [rejectApproval]);

  return [notificationController, resolveApproval, rejectApproval] as const;
};

export const useDecodePsbtInputs = () => {
  const currentAccount = useGetCurrentAccount();
  const { apiController, notificationController } = useControllersState(
    (v) => ({
      apiController: v.apiController,
      notificationController: v.notificationController,
    })
  );
  const currentNetwork = useGetCurrentNetwork();

  return useCallback(async (): Promise<IField[] | undefined> => {
    const approval = await notificationController.getApproval();
    const psbt = Psbt.fromBase64(approval.params.data.psbtBase64);
    const inputFields: IField[] = [];
    const outputFields: IField[] = [];
    const inputLocations = psbt.txInputs.map(
      (f) => f.hash.reverse().toString("hex") + ":" + f.index
    );
    const inputValues = await apiController.getUtxoValues(inputLocations);
    const locationValue: LocationValue = Object.fromEntries(
      inputLocations.map((f, i) => [f, inputValues[i]])
    );

    psbt.txOutputs.forEach((f, i) => {
      outputFields.push({
        important:
          currentAccount.accounts.findIndex(
            (account) => account.address === f.address
          ) !== -1,
        input: false,
        label: `Output #${i}`,
        value: {
          text: `${f.address}`,
          value: `${toFixed(f.value / 10 ** 8)} ${currentNetwork.coinSymbol}`,
        },
      });
    });

    for (const [i, txInput] of psbt.txInputs.entries()) {
      const outpoint =
        txInput.hash.reverse().toString("hex") + ":" + txInput.index;
      const isImportant = (
        approval.params.data as { options?: SignPsbtOptions }
      ).options?.toSignInputs
        ?.map((f) => f.index)
        .includes(i);

      let value: IFieldValue;
      if (psbt.data.inputs[i].sighashType === 131) {
        const foundInscriptions = await apiController.getInscription({
          address: "",
          // TODO address: currentAccount.address,
          inscriptionId: outpoint.slice(0, -2) + "i" + txInput.index,
        });

        if (foundInscriptions.length) {
          value = {
            anyonecanpay: true,
            inscriptions: foundInscriptions,
            value: `${toFixed(locationValue[outpoint] / 10 ** 8)} ${
              currentNetwork.coinSymbol
            }`,
          };
        } else {
          value = {
            anyonecanpay: true,
            text: `${outpoint.slice(0, -2)}`,
            value: `${toFixed(locationValue[outpoint] / 10 ** 8)} ${
              currentNetwork.coinSymbol
            }`,
          };
        }
      } else {
        value = {
          text: `${outpoint.slice(0, -2)}`,
          value: `${toFixed(locationValue[outpoint] / 10 ** 8)} ${
            currentNetwork.coinSymbol
          }`,
        };
      }

      inputFields.push({
        important: isImportant,
        input: true,
        label: `Input #${i}`,
        value,
      });
    }

    return inputFields.concat(outputFields);
  }, [notificationController, apiController, currentAccount]);
};
