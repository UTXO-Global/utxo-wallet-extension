import { useGetDetailNFT } from "@/ui/hooks/nft";
import {
  useGetCurrentAccount,
  useGetCurrentNetwork,
} from "@/ui/states/walletState";
import { t } from "i18next";
import Loading from "react-loading";
import { shortAddress } from "@/shared/utils/transactions";
import AddressInput from "../send/create-send/address-input";
import { useEffect, useMemo, useState } from "react";
import AddressBookModal from "../send/create-send/address-book-modal";
import Switch from "@/ui/components/switch";
import ShortBalance from "@/ui/components/ShortBalance";
import { useNavigate } from "react-router-dom";
import cn from "classnames";
import { Script, helpers } from "@ckb-lumos/lumos";
import { AGGRON4, LINA } from "@/shared/networks";
import toast from "react-hot-toast";
import { useCreateNFTTxCallback } from "@/ui/hooks/transactions";

export interface FormTransferNFTType {
  address: string;
  feeRate: number;
}

const feeRates = [
  {
    title: t("send.create_send.fee_input.slow"),
    description: `1,000 shannons /kB`,
    value: 1000,
  },
  {
    title: t("send.create_send.fee_input.standard"),
    description: `2,000 shannons /kB`,
    value: 2000,
  },
  {
    title: t("send.create_send.fee_input.fast"),
    description: `3,000 shannons /kB`,
    value: 3000,
  },
];

export default function TransferNFT() {
  const [isOpenModal, setOpenModal] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);
  const { isLoading, detailNFT } = useGetDetailNFT(mounted);

  const [isSaveAddress, setIsSaveAddress] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormTransferNFTType>({
    address: "",
    feeRate: 1000,
  });

  const navigate = useNavigate();
  const currentNetwork = useGetCurrentNetwork();
  const currentAccount = useGetCurrentAccount();
  const createTransferNFT = useCreateNFTTxCallback();

  const isTestnet = useMemo(() => {
    return currentNetwork.slug !== "nervos";
  }, []);

  const isNext = useMemo(() => {
    try {
      const addressScript = helpers.parseAddress(formData.address, {
        config: isTestnet ? AGGRON4 : LINA,
      });
      if (!addressScript) return false;
    } catch (e) {
      return false;
    }

    if (!formData.address) return false;
    if (formData.feeRate <= 0) return false;
    return true;
  }, [formData]);

  const createTransaction = async () => {
    try {
      if (!formData.address) {
        return toast.error(t("send.create_send.address_error"));
      }

      if (formData.feeRate <= 0) {
        return toast.error(t("send.create_send.fee_is_text_error"));
      }

      try {
        helpers.parseAddress(formData.address, {
          config: isTestnet ? AGGRON4 : LINA,
        });
      } catch (e) {
        return toast.error(t("send.create_send.address_error"));
      }

      const { rawtx, fee } = await createTransferNFT({
        toAddress: formData.address,
        feeRate: formData.feeRate,
        nft: detailNFT,
      });

      if (!rawtx) {
        return toast.error("Failed to create transaction");
      }

      navigate("/pages/confirm-transfer-nft", {
        state: {
          toAddress: formData.address,
          fromAddress: currentAccount.accounts[0].address,
          feeAmount: fee,
          hex: rawtx,
          save: isSaveAddress,
          nft: detailNFT,
        },
      });
    } catch (e) {
      console.log(e);
      toast.error(e.message);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="w-full h-full flex flex-col justify-between">
      {isLoading ? (
        <div className="flex justify-center mt-10 py-6">
          <Loading type="spin" width={50} color="#ODODOD" />
        </div>
      ) : (
        detailNFT && (
          <>
            <div className="p-4">
              <div className="px-4 py-2 flex items-center w-full justify-between bg-grey-300 rounded-lg h-[120px]">
                <div className="flex flex-col gap-[2px]">
                  {!!detailNFT.collection.name && (
                    <div className="text-primary text-base font-medium">
                      {detailNFT.collection.name}
                    </div>
                  )}
                  <div
                    className={cn(
                      "text-primary text-xs leading-3 font-normal",
                      {
                        "!text-base !font-medium": !detailNFT.collection.name,
                      }
                    )}
                  >
                    {shortAddress(detailNFT.type_script.args, 5)}
                  </div>
                </div>
                {detailNFT.loading ? (
                  <Loading type="bubbles" color="#ODODOD" width={50} />
                ) : (
                  <img
                    src={detailNFT.imageUrl || "/nft-default.png"}
                    alt={detailNFT.name}
                    className={cn("rounded h-[60px] mix-blend-multiply p-2")}
                  />
                )}
              </div>
              <div className="w-full flex flex-col justify-start items-start gap-4 py-4">
                <div className="form-field">
                  <span className="font-medium text-base">
                    {t("send.create_send.send_to")}
                  </span>
                  <AddressInput
                    address={formData.address}
                    onChange={(v) => setFormData((p) => ({ ...p, address: v }))}
                    onOpenModal={() => setOpenModal(true)}
                    className="!bg-grey-300"
                  />
                </div>
                <div className="form-field">
                  <span className="input-span">
                    {t("send.create_send.fee_label")}
                  </span>
                  <div className="flex gap-2 w-full">
                    {feeRates.map((f, i) => (
                      <div
                        key={`fee-rate-option-${i}`}
                        className={cn(
                          "border border-grey-300 flex flex-col gap-1 px-2 py-[6px] rounded-md w-full select-none cursor-pointer hover:bg-grey-300 text-center items-center justify-center",
                          { "bg-grey-300": f.value === formData.feeRate }
                        )}
                        onClick={() =>
                          setFormData((p) => ({ ...p, feeRate: f.value }))
                        }
                      >
                        <div className="font-medium text-sm border-b border-b-grey-200 w-full pb-[2px]">
                          {f.title}
                        </div>
                        {f.description && (
                          <div className="text-[#787575] text-[10px] leading-[14px]">
                            {f.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between text-base font-medium w-full">
                  <div>{t("wallet_page.available_balance")}:</div>
                  <div className="flex gap-2 items-center">
                    <ShortBalance
                      balance={currentAccount.balance}
                      zeroDisplay={6}
                    />

                    <span className="text-[#787575]">
                      {currentNetwork.coinSymbol}
                    </span>
                  </div>
                </div>
                <Switch
                  label={t("send.create_send.save_address")}
                  value={isSaveAddress}
                  onChange={setIsSaveAddress}
                  locked={false}
                  className="flex w-full flex-row-reverse items-center justify-between py-1 capitalize"
                />
              </div>
            </div>
            <button
              className={cn(
                "btn primary mb-4 mx-4 standard:m-6 standard:mb-3 disabled:bg-[#D1D1D1] disabled:text-grey-100",
                {
                  "hover:bg-none hover:border-transparent": !isNext,
                }
              )}
              disabled={!isNext}
              onClick={createTransaction}
            >
              {t("send.create_send.continue")}
            </button>
          </>
        )
      )}
      <AddressBookModal
        isOpen={isOpenModal}
        onClose={() => setOpenModal(false)}
        setAddress={(address) => {
          setFormData((p) => ({ ...p, address: address }));
        }}
      />
    </div>
  );
}
