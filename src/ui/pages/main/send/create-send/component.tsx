import { Inscription } from "@/shared/interfaces/inscriptions";
import {
  NETWORK_ICON,
  getNetworkDataBySlug,
  isCkbNetwork,
} from "@/shared/networks";
import Switch from "@/ui/components/switch";
import { useCreateOrdTx, useCreateTxCallback } from "@/ui/hooks/transactions";
import {
  useGetCurrentAccount,
  useGetCurrentNetwork,
  useGetCurrentWallet,
} from "@/ui/states/walletState";
import { normalizeAmount } from "@/ui/utils";
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
import { CKBTokenInfo } from "@/shared/networks/ckb/types";
import ShortBalance from "@/ui/components/ShortBalance";
import TextAvatar from "@/ui/components/text-avatar/component";
import { helpers } from "@ckb-lumos/lumos";
import { MIN_CAPACITY } from "@/shared/networks/ckb/helpers";
import { useCreateOnekeyTxCallback } from "@/ui/hooks/onekey-tx";

export interface FormType {
  address: string;
  amount: string;
  feeAmount: number | string;
  includeFeeInAmount: boolean;
  isUseDID?: boolean;
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
    isUseDID: false,
  });
  const currentNetwork = useGetCurrentNetwork();
  const [includeFeeLocked, setIncludeFeeLocked] = useState<boolean>(false);
  const currentAccount = useGetCurrentAccount();
  const currentWallet = useGetCurrentWallet();
  const createTx = useCreateTxCallback();
  const createOnekeyTx = useCreateOnekeyTxCallback();
  const createOrdTx = useCreateOrdTx();
  const navigate = useNavigate();
  const location = useLocation();
  const [inscription, setInscription] = useState<Inscription | undefined>(
    undefined
  );
  const [inscriptionTransaction, setInscriptionTransaction] =
    useState<boolean>(false);
  const [isTokenTransaction, setIsTokenTransaction] = useState(false);
  const [token, setToken] = useState<CKBTokenInfo | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);

  const availableCKBBalance = useMemo(() => {
    const bal =
      Number(currentAccount.balance || 0) -
      Number(currentAccount.ordinalBalance || 0);

    return bal > 0 ? bal : 0;
  }, [currentAccount]);

  const balance = useMemo(() => {
    if (!currentAccount) return 0;
    if (!isTokenTransaction) return availableCKBBalance;
    if (token && currentAccount.coinBalances[token.attributes.type_hash]) {
      return currentAccount.coinBalances[token.attributes.type_hash] || 0;
    }
    return 0;
  }, [token, isTokenTransaction, currentAccount, availableCKBBalance]);

  const symbol = useMemo(() => {
    if (token && isTokenTransaction) {
      return token.attributes.symbol;
    }

    return currentNetwork.coinSymbol;
  }, [token, isTokenTransaction, currentNetwork, currentAccount]);

  const decimal = useMemo(() => {
    if (token && isTokenTransaction) {
      return Number(token.attributes.decimal);
    }

    return currentNetwork.decimal || 8;
  }, [token, isTokenTransaction, currentNetwork, currentAccount]);

  const isValidForm = useMemo(() => {
    if (!formData.address) return false;
    if (formData.address?.trim().length <= 0) return false;

    if (Number(formData.amount) <= 0) {
      return false;
    }

    if (
      Number(formData.amount) < 0.00001 &&
      !inscriptionTransaction &&
      !isTokenTransaction
    ) {
      return false;
    }

    if (Number(formData.amount) > (balance ?? 0)) {
      return false;
    }

    if (
      typeof formData.feeAmount !== "number" ||
      !formData.feeAmount ||
      formData.feeAmount < 1
    ) {
      return false;
    }

    if (formData.feeAmount % 1 !== 0) {
      return false;
    }

    return true;
  }, [formData, balance, isTokenTransaction, token]);

  const _createTx = useCallback(
    (
      address: string,
      feeRate: number,
      amount: string,
      includeFeeInAmount: boolean
    ): Promise<{
      rawtx: string;
      fee: number | string;
      fromAddresses: string[];
    }> => {
      if (inscriptionTransaction) {
        if (currentWallet.type === "onekey") {
          throw new Error("Not supported");
        }
        return createOrdTx(address, feeRate, inscription);
      }

      if (currentWallet.type === "onekey") {
        return createOnekeyTx(
          address,
          Number((Number(amount) * 10 ** decimal).toFixed(0)),
          feeRate,
          includeFeeInAmount,
          token
        );
      }

      return createTx(
        address,
        Number((Number(amount) * 10 ** decimal).toFixed(0)),
        feeRate,
        includeFeeInAmount,
        token
      );
    },
    [inscriptionTransaction]
  );

  const send = async ({
    address,
    amount,
    feeAmount: feeRate,
    includeFeeInAmount,
    isUseDID,
  }: FormType) => {
    try {
      setLoading(true);
      if (
        Number(amount) < 0.00001 &&
        !inscriptionTransaction &&
        !isTokenTransaction
      ) {
        return toast.error(t("send.create_send.minimum_amount_error"));
      }
      if (address.trim().length <= 0) {
        return toast.error(t("send.create_send.address_error"));
      }
      if (Number(amount) > (balance ?? 0)) {
        return toast.error(t("send.create_send.not_enough_money_error"));
      }
      if (typeof feeRate !== "number" || !feeRate || feeRate < 1) {
        return toast.error(t("send.create_send.not_enough_fee_error"));
      }
      if (feeRate % 1 !== 0) {
        return toast.error(t("send.create_send.fee_is_text_error"));
      }

      if (isCkbNetwork(currentNetwork.network) && !isTokenTransaction) {
        const toScript = helpers.parseAddress(address, {
          config: currentNetwork.network.lumosConfig,
        });

        const changeOutputCapacity =
          Number(availableCKBBalance ?? 0) - Number(amount);
        const minCap = MIN_CAPACITY(toScript)
          .div(10 ** 8)
          .toNumber();

        if (changeOutputCapacity > 0 && changeOutputCapacity < minCap) {
          return toast.error(
            t("send.create_send.error_not_enough_balance_remaining").replaceAll(
              "{value}",
              minCap.toString()
            )
          );
        }
      }

      const { fee, rawtx, fromAddresses } = await _createTx(
        address,
        feeRate,
        amount,
        includeFeeInAmount
      );

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
          token: token,
          isUseDID: !!isUseDID,
        },
      });
    } catch (e) {
      console.error(e);
      if (e.message.includes(address)) {
        toast.error(t("send.create_send.address_invalid"));
      } else {
        toast.error(e.message);
      }
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
      if (balance <= location.state.amount) setIncludeFeeLocked(true);
    }
    if (location.state && location.state.inscription_id) {
      setInscription(location.state);
      setInscriptionTransaction(true);
    }

    if (location.state && location.state.token) {
      setIsTokenTransaction(true);
      setIncludeFeeLocked(true);
      setToken(location.state.token);
    }
  }, [location.state, setFormData, balance]);

  const onAmountChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setFormData((prev) => ({
      ...prev,
      amount: normalizeAmount(e.target.value, decimal),
    }));
    if (balance > Number(e.target.value)) {
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
    setIncludeFeeLocked(true);
    const isIncludeFee = !isTokenTransaction;
    setFormData((prev) => ({
      ...prev,
      amount: balance?.toLocaleString("fullwide", {
        useGrouping: false,
        maximumFractionDigits: 100,
      }),
      includeFeeInAmount: isIncludeFee,
    }));
  };

  return (
    <div className="flex flex-col justify-between w-full h-full">
      <div className="pt-8 pb-3 flex items-center justify-center">
        {isTokenTransaction ? (
          !!token?.attributes?.icon_file ? (
            <img src={token?.attributes?.icon_file} className="w-10 h-10" />
          ) : (
            <TextAvatar text={token?.attributes?.symbol} />
          )
        ) : (
          <img src={NETWORK_ICON[currentNetwork.slug]} className="w-10 h-10" />
        )}
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
            <span className="font-medium text-base">
              {t("send.create_send.send_to")}
            </span>
            <AddressInput
              address={formData.address}
              onChange={useCallback(
                (v) => {
                  setFormData((p) => ({
                    ...p,
                    address: v.value,
                    isUseDID: v.isUseDID,
                  }));
                },
                [setFormData]
              )}
              onOpenModal={() => setOpenModal(true)}
            />
          </div>
          {inscriptionTransaction ? undefined : (
            <div className="flex flex-col gap-4 w-full">
              <div className="form-field">
                <span className="font-medium text-base">
                  {t("send.create_send.amount")}
                </span>
                <div className="flex gap-2 items-center justify-between bg-grey-200 rounded-lg border border-grey-200 focus-within:bg-grey-300">
                  <div className="flex-grow">
                    <input
                      type="number"
                      placeholder={t("send.create_send.enter_amount")}
                      className="w-full bg-transparent p-4 text-base font-normal"
                      value={formData.amount}
                      onChange={onAmountChange}
                    />
                  </div>
                  <button
                    className={cn(`${s.maxAmount} w-[55px]`)}
                    onClick={onMaxClick}
                  >
                    {t("send.create_send.max_amount")}
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-base font-medium items-center">
                  <div className="capitalize">
                    {t("wallet_page.available_balance")}:
                  </div>
                  <div className="flex items-center">
                    <div className="w-36 text-right">
                      <ShortBalance
                        balance={balance}
                        zeroDisplay={6}
                        isDot={true}
                      />
                    </div>
                    <span>{symbol}</span>
                  </div>
                </div>
                {!isTokenTransaction && (
                  <div className="flex justify-between text-base font-medium text-[#787575] items-center">
                    <div className="capitalize">
                      {t("wallet_page.occupied_balance")}:
                    </div>
                    <div className="flex items-center">
                      <div className="w-36 text-right">
                        <ShortBalance
                          balance={currentAccount.ordinalBalance}
                          zeroDisplay={6}
                          className="!text-base !font-medium !text-[#787575]"
                          isDot={true}
                        />
                      </div>
                      <span>{symbol}</span>
                    </div>
                  </div>
                )}
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
            label={t("send.create_send.save_address")}
            value={isSaveAddress}
            onChange={setIsSaveAddress}
            locked={false}
            className="flex w-full flex-row-reverse items-center justify-between py-1 capitalize"
          />
        </div>
      </form>

      {loading ? (
        <div className="flex justify-center w-full">
          <Loading color="#ODODOD" />
        </div>
      ) : (
        <button
          type="submit"
          className={cn(
            "btn primary mx-4 mb-4 standard:m-6 standard:mb-3 disabled:bg-[#D1D1D1] disabled:text-grey-100",
            {
              "hover:bg-none hover:border-transparent": !isValidForm,
            }
          )}
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
