import { shortAddress } from "@/shared/utils/transactions";
import { useGetCurrentNetwork } from "@/ui/states/walletState";
import { t } from "i18next";
import { useLocation, useNavigate } from "react-router-dom";
import cn from "classnames";
import { isCkbNetwork } from "@/shared/networks";
import { useUpdateAddressBook } from "@/ui/hooks/app";
import { usePushCkbTxCallback } from "@/ui/hooks/transactions";
import { useState } from "react";
import toast from "react-hot-toast";

export default function ConfirmTransferNFT() {
  const pushCkbTx = usePushCkbTxCallback();
  const [loading, setLoading] = useState(false);
  const updateAddressBook = useUpdateAddressBook();
  const location = useLocation();
  const currentNetwork = useGetCurrentNetwork();
  const navigate = useNavigate();
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

      if (!txId) throw new Error("Failed pushing transaction");

      navigate(`/pages/finalle-send/${txId}`);

      if (location.state.save) {
        await updateAddressBook(location.state.toAddress);
      }
    } catch (e) {
      toast.error(e.message);
      console.error(e);
      navigate(-1);
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-between">
      <div className="p-4">
        <div className="w-full flex flex-col justify-start items-start gap-4 py-4">
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
          <div className="p-4 flex items-center w-full justify-between bg-grey-300 rounded-lg">
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
            <img
              src={location.state.nft.imageUrl}
              alt={location.state.nft.name}
              className="max-w-[120px]"
            />
          </div>
        </div>
      </div>
      <button
        className={cn("btn primary mb-4 mx-4 standard:m-6 standard:mb-3")}
        onClick={onConfirm}
      >
        {t("send.confirm_send.confirm")}
      </button>
    </div>
  );
}
