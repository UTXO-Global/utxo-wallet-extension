import { Inscription } from "@/shared/interfaces/inscriptions";
import { NETWORK_ICON, getNetworkDataBySlug, isCkbNetwork } from "@/shared/networks";
import { shortAddress } from "@/shared/utils/transactions";
import Switch from "@/ui/components/switch";
import { useCreateOrdTx, useCreateTxCallback } from "@/ui/hooks/transactions";
import {
  useGetCurrentAccount,
  useGetCurrentNetwork,
} from "@/ui/states/walletState";
import { normalizeAmount } from "@/ui/utils";
import Analytics from "@/ui/utils/gtm";
import cn from "classnames";
import { t } from "i18next";
import {
  ChangeEventHandler,
  MouseEventHandler,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
} from "react";
import toast from "react-hot-toast";
import Loading from "react-loading";
import { useLocation, useNavigate } from "react-router-dom";
import AddressBookModal from "./address-book-modal";
import AddressInput from "./address-input";
import FeeInput from "./fee-input";
import s from "./styles.module.scss";
import { formatNumber } from "@/shared/utils";

export interface FormType {
  address: string;
  amount: string;
  feeAmount: number | string;
  includeFeeInAmount: boolean;
}

const CreateSend = () => {
  const formId = useId();

  const [isOpenModal, setOpenModal] = useState<boolean>(false);
  const [isSaveAddress, setIsSaveAddress] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormType>({
    address: "",
    amount: "",
    includeFeeInAmount: false,
    feeAmount: 10,
  });
  const currentNetwork = useGetCurrentNetwork();
  const [includeFeeLocked, setIncludeFeeLocked] = useState<boolean>(false);
  const currentAccount = useGetCurrentAccount();
  const createTx = useCreateTxCallback();
  const createOrdTx = useCreateOrdTx();
  const navigate = useNavigate();
  const location = useLocation();
  const [inscription, setInscription] = useState<Inscription | undefined>(
    undefined
  );
  const [inscriptionTransaction, setInscriptionTransaction] =
    useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const isValidForm = useMemo(() => {
    if (!formData.address) return false;
    if (formData.address?.trim().length <= 0) return false

    if (Number(formData.amount) < 0.00001 && !inscriptionTransaction) {
      return false
    }

    if (Number(formData.amount) > (currentAccount?.balance ?? 0)) {
      return false
    }

    if (typeof formData.feeAmount !== "number" || !formData.feeAmount || formData.feeAmount < 1) {
      return false
    }

    if (formData.feeAmount % 1 !== 0) {
      return false
    }

    return true
  }, [formData]);

  const send = async ({
    address,
    amount,
    feeAmount: feeRate,
    includeFeeInAmount,
  }: FormType) => {
    try {
      setLoading(true);
      if (Number(amount) < 0.00001 && !inscriptionTransaction) {
        return toast.error(t("send.create_send.minimum_amount_error"));
      }
      if (address.trim().length <= 0) {
        return toast.error(t("send.create_send.address_error"));
      }
      if (Number(amount) > (currentAccount?.balance ?? 0)) {
        return toast.error(t("send.create_send.not_enough_money_error"));
      }
      if (typeof feeRate !== "number" || !feeRate || feeRate < 1) {
        return toast.error(t("send.create_send.not_enough_fee_error"));
      }
      if (feeRate % 1 !== 0) {
        return toast.error(t("send.create_send.fee_is_text_error"));
      }

      const { fee, rawtx, fromAddresses } = !inscriptionTransaction
        ? await createTx(
          address,
          Number((Number(amount) * 10 ** 8).toFixed(0)),
          feeRate,
          includeFeeInAmount
        )
        : await createOrdTx(address, feeRate, inscription);

      // NOTE: [GA] - Send BTC
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      await Analytics.fireEvent("pf_send_btc", {
        action: "continue",
        label: fromAddresses.map((z) => shortAddress(z, 3)).join(","),
        amount: Number(amount),
        includeFeeInAmount,
        recipient: shortAddress(address, 3),
        fee: fee,
        include_fee: formData.includeFeeInAmount ? 1 : 0,
        save_address: isSaveAddress ? 1 : 0,
      });

      navigate("/pages/confirm-send", {
        state: {
          toAddress: address,
          amount: Number(amount),
          includeFeeInAmount,
          fromAddresses,
          feeAmount: fee,
          inputedFee: feeRate,
          hex: rawtx,
          save: isSaveAddress,
          inscriptionTransaction,
        },
      });
    } catch (e) {
      console.error(e);
      toast.error(t("send.create_send.default_error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (location.state && location.state.toAddress) {
      setFormData({
        address: location.state.toAddress,
        amount: location.state.amount,
        feeAmount: location.state.inputedFee,
        includeFeeInAmount: location.state.includeFeeInAmount,
      });
      if (location.state.save) {
        setIsSaveAddress(true);
      }
      if (currentAccount?.balance <= location.state.amount)
        setIncludeFeeLocked(true);
    }
    if (location.state && location.state.inscription_id) {
      setInscription(location.state);
      setInscriptionTransaction(true);
    }
  }, [location.state, setFormData, currentAccount?.balance]);

  const onAmountChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setFormData((prev) => ({
      ...prev,
      amount: normalizeAmount(e.target.value),
    }));
    if (currentAccount?.balance > Number(e.target.value)) {
      setIncludeFeeLocked(false);
    } else {
      setIncludeFeeLocked(true);
      setFormData((prev) => ({
        ...prev,
        includeFeeInAmount: true,
      }));
    }
  };

  const onMaxClick: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault();
    setFormData((prev) => ({
      ...prev,
      amount: currentAccount?.balance.toString(),
      includeFeeInAmount: true,
    }));
    setIncludeFeeLocked(true);
  };

  return (
    <div className="flex flex-col justify-between w-full h-full">
      <div className="pt-8 pb-3 flex items-center justify-center">
        <img src={NETWORK_ICON[currentNetwork.slug]} className="w-10 h-10" />
      </div>
      <form
        id={formId}
        className={cn("form", s.send)}
        onSubmit={async (e) => {
          e.preventDefault();
          await send(formData);
        }}
      >
        <div className={s.inputs}>
          <div className="form-field">
            <span className="font-medium text-base">{t("send.create_send.send_to")}</span>
            <AddressInput
              address={formData.address}
              onChange={(v) => setFormData((p) => ({ ...p, address: v }))}
              onOpenModal={() => setOpenModal(true)}
            />
          </div>
          {inscriptionTransaction ? undefined : (
            <div className="flex flex-col gap-4 w-full">
              <div className="form-field">
                <span className="font-medium text-base">
                  {t("send.create_send.amount")}
                </span>
                <div className="flex gap-2 items-center bg-grey-200 rounded-lg border border-grey-200 focus-within:bg-grey-300">
                  <input
                    type="number"
                    placeholder={t("send.create_send.enter_amount")}
                    className="w-full bg-transparent p-4 text-base font-normal"
                    value={formData.amount}
                    onChange={onAmountChange}
                  />
                  <button className={s.maxAmount} onClick={onMaxClick}>
                    {t("send.create_send.max_amount")}
                  </button>
                </div>
              </div>
              <div className="flex justify-between text-base font-medium">
                <div>{`${t("wallet_page.your_balance")}: `}</div>
                <div className="flex gap-2 items-center">
                  <span>{formatNumber(currentAccount.balance, 2, 8)}</span>
                  <span className="text-[#787575]">{currentNetwork.coinSymbol}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={s.feeDiv}>
          {isCkbNetwork(
            getNetworkDataBySlug(currentNetwork.slug).network
          ) ? null : (
            <div className="form-field">
              <span className="input-span">
                {t("send.create_send.fee_label")}
              </span>
              <FeeInput
                onChange={useCallback(
                  (v) => setFormData((prev) => ({ ...prev, feeAmount: v })),
                  [setFormData]
                )}
                value={formData.feeAmount}
              />
            </div>
          )}

          {inscriptionTransaction ? undefined : (
            <Switch
              label={t("send.create_send.include_fee_in_the_amount_label")}
              onChange={(v) =>
                setFormData((prev) => ({ ...prev, includeFeeInAmount: v }))
              }
              value={formData.includeFeeInAmount}
              locked={includeFeeLocked}
              className="flex w-full flex-row-reverse items-center justify-between py-1 capitalize"
            />
          )}

          <Switch
            label={t(
              "send.create_send.save_address"
            )}
            value={isSaveAddress}
            onChange={setIsSaveAddress}
            locked={false}
            className="flex w-full flex-row-reverse items-center justify-between py-1 capitalize"
          />
        </div>
      </form>

      {loading ? (
        <div className="flex justify-center w-full">
          <Loading />
        </div>
      ) : (
        <button
          type="submit"
          className={"btn primary mx-4 mb-4 standard:m-6 standard:mb-3 disabled:bg-[#D1D1D1] disabled:text-grey-100"}
          form={formId}
          disabled={!isValidForm}
        >
          {t("send.create_send.continue")}
        </button>
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
};

export default CreateSend;
