import { useUpdateAddressBook } from "@/ui/hooks/app";
import { usePushBitcoinTxCallback } from "@/ui/hooks/transactions";
import { useGetCurrentNetwork } from "@/ui/states/walletState";
import cn from "classnames";
import { t } from "i18next";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import s from "./styles.module.scss";
import Loading from "react-loading";
import { useTransactionManagerContext } from "@/ui/utils/tx-ctx";

const ConfirmSendRgbpp = () => {
  const location = useLocation();
  const pushTx = usePushBitcoinTxCallback();
  const [txId, setTxId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const updateAddressBook = useUpdateAddressBook();
  const currentNetwork = useGetCurrentNetwork();
  const { trottledUpdate } = useTransactionManagerContext();
  const isSent = true;

  const isProgressing = useMemo(() => {
    return loading || (!!txId && !isSent);
  }, [isSent, loading, txId]);

  const symbol = useMemo(() => {
    if (location.state.token) {
      return location.state.token.attributes.symbol;
    }

    return currentNetwork.coinSymbol;
  }, [location.state.token]);

  const confirmSend = async () => {
    setLoading(true);
    try {
      let txId = "";
      txId = (await pushTx(location.state.hex)).txid;

      if (location.state.save) {
        await updateAddressBook(location.state.toAddress);
      }

      if (!txId) {
        throw new Error("Failed pushing transaction");
      }
      setTxId(txId);
      navigate(location.pathname, {
        state: { ...location.state, isSending: true },
        replace: true,
      });
    } catch (e) {
      toast.error(e.message);
      console.error(e);
      navigate(-1);
    }
  };

  useEffect(() => {
    if (!!txId && isSent) {
      trottledUpdate(true);
      navigate(`/pages/finalle-send/${txId}`);
    }
  }, [confirmSend, isSent, txId]);

  const fields = [
    {
      label: t("send.confirm_send.to_addrses"),
      value: location.state.toAddress,
    },
    {
      label: t("send.confirm_send.from_address"),
      value: location.state.fromAddresses.join("\n"),
    },
    {
      label: t("send.confirm_send.amount"),
      value: `
        <span style="font-size: 16px">${location.state.amount.toLocaleString(
          "fullwide",
          {
            useGrouping: false,
            maximumFractionDigits: 100,
          }
        )}</span>
        <span style="font-size: 16px; color: #A69C8C">${symbol}</span>
      `,
    },
    {
      label: t("send.confirm_send.fee"),
      value: `
        <div style="font-size: 16px">${(
          location.state.feeAmount /
          10 ** 8
        ).toLocaleString("fullwide", {
          useGrouping: false,
          maximumFractionDigits: 8,
        })} <span style="color: #787575">(${
        location.state.includeFeeInAmount
          ? t("send.confirm_send.included")
          : t("send.confirm_send.not_included")
      })</span></div>
        <span style="font-size: 16px; color: #A69C8C">${
          currentNetwork.coinSymbol
        }</span>
      `,
    },
  ];

  return (
    <>
      <div className={s.wrapper}>
        <div className={s.container}>
          <div className={s.container}>
            {fields.map((i) => (
              <div key={i.label} className={s.item}>
                <div className={s.label}>{i.label}</div>
                <div
                  className={s.input}
                  style={{ whiteSpace: "pre-line" }}
                  dangerouslySetInnerHTML={{ __html: i.value?.trim() }}
                />
              </div>
            ))}
          </div>
          {isProgressing ? (
            <div className="flex justify-center w-full">
              <Loading color="#ODODOD" type="bubbles" />
            </div>
          ) : (
            <button
              className={cn(
                "btn primary flex items-center justify-center gap-1",
                s.confirmBtn,
                {
                  "hover:bg-none hover:border-transparent": isProgressing,
                }
              )}
              onClick={confirmSend}
              disabled={isProgressing}
            >
              {isProgressing
                ? t("send.confirm_send.confirming")
                : t("send.confirm_send.confirm")}
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default ConfirmSendRgbpp;
