import { shortAddress } from "@/shared/utils/transactions";
import { useGetCurrentNetwork } from "@/ui/states/walletState";
import { t } from "i18next";
import { useLocation, useNavigate } from "react-router-dom";
import cn from "classnames";
import { isCkbNetwork } from "@/shared/networks";
import { useUpdateAddressBook } from "@/ui/hooks/app";
import { usePushCkbTxCallback } from "@/ui/hooks/transactions";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Loading from "react-loading";
import { useTransactionManagerContext } from "@/ui/utils/tx-ctx";
import Analytics from "@/ui/utils/gtm";

export default function ConfirmTransferNFT() {
  const { pushCkbTx, isSent: isCkbSent } = usePushCkbTxCallback();
  const [loading, setLoading] = useState(false);
  const [txId, setTxId] = useState<string | undefined>(undefined);
  const updateAddressBook = useUpdateAddressBook();
  const location = useLocation();
  const currentNetwork = useGetCurrentNetwork();
  const navigate = useNavigate();
  const { trottledUpdate } = useTransactionManagerContext();

  const isProgressing = useMemo(() => {
    return loading || (!!txId && !isCkbSent);
  }, [isCkbSent, loading, txId]);

  const fields = [
    {
      label: t("send.confirm_send.to_addrses"),
      value: location.state.toAddress,
    },
    {
      label: t("send.confirm_send.from_address"),
      value: location.state.fromAddress,
    },
    {
      label: t("send.confirm_send.transaction_fee"),
      value: `
        <div style="font-size: 16px">${(
          location.state.feeAmount /
          10 ** 8
        ).toLocaleString("fullwide", {
          useGrouping: false,
          maximumFractionDigits: 8,
        })}</div>
        <span style="font-size: 16px; color: #A69C8C">${
          currentNetwork.coinSymbol
        }</span>
      `,
    },
  ];

  const onConfirm = async () => {
    setLoading(true);
    try {
      let txId = "";
      if (isCkbNetwork(currentNetwork.network)) {
        txId = (await pushCkbTx(location.state.hex)).txid;
      }

      if (location.state.save) {
        await updateAddressBook(location.state.toAddress);
      }

      if (!txId) {
        throw new Error("Failed pushing transaction");
      }

      try {
        // NOTE: [GA] - track send nfts
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        await Analytics.fireEvent("tnx_send_nfts", {
          from_address: location.state.fromAddress,
          to_address: location.state.toAddress,
          network: currentNetwork.slug,
          nft_collection_name: location.state.nft.collection.name,
          nft_name: location.state.nft.name,
          nft_token_id: location.state.nft.token_id,
          did: location.state.isUseDID
        });
      } catch (e) {
        console.error(e);
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
    if (!!txId && isCkbSent) {
      trottledUpdate(true);
      navigate(`/pages/finalle-send/${txId}`);
    }
  }, [onConfirm, isCkbSent, txId]);

  return (
    <div className="w-full h-full flex flex-col justify-between">
      <div className="p-4 pb-16">
        <div className="w-full flex flex-col justify-start items-start gap-4 py-4 pt-0">
          {fields.map((i) => (
            <div key={i.label} className="w-full">
              <div className="mb-1 ml-1 text-base font-medium">{i.label}</div>
              <div
                className="break-all bg-grey-300 border border-grey-200 rounded-lg font-normal p-4 text-sm flex justify-between"
                style={{ whiteSpace: "pre-line" }}
                dangerouslySetInnerHTML={{ __html: i.value?.trim() }}
              />
            </div>
          ))}
          <div className="px-4 py-2 flex items-center w-full justify-between bg-grey-300 rounded-lg h-[120px]">
            <div className="flex flex-col gap-[2px]">
              {!!location.state.nft.collection.name && (
                <div className="text-primary text-base font-medium">
                  {location.state.nft.collection.name}
                </div>
              )}
              <div
                className={cn("text-primary text-xs leading-3 font-normal", {
                  "!text-base !font-medium":
                    !location.state.nft.collection.name,
                })}
              >
                {shortAddress(location.state.nft.type_script.args, 5)}
              </div>
            </div>
            {location.state.nft.loading ? (
              <Loading type="bubbles" color="#ODODOD" width={50} />
            ) : (
              <img
                src={location.state.nft.imageUrl || "/nft-default.png"}
                alt={location.state.nft.name}
                className={cn("rounded h-[60px] mix-blend-multiply p-2")}
              />
            )}
          </div>
        </div>
      </div>

      <div className="absolute left-0 bottom-0 w-full px-4 pb-4 pt-2 z-10">
        {isProgressing ? (
          <div className="flex justify-center w-full">
            <Loading color="#ODODOD" type="bubbles" />
          </div>
        ) : (
          <button
            className={cn(
              "btn primary disabled:bg-[#D1D1D1] disabled:text-grey-100 w-full",
              {
                "hover:bg-none hover:border-transparent": isProgressing,
              }
            )}
            onClick={onConfirm}
            disabled={isProgressing}
          >
            {isProgressing
              ? t("send.confirm_send.confirming")
              : t("send.confirm_send.confirm")}
          </button>
        )}
      </div>
    </div>
  );
}
