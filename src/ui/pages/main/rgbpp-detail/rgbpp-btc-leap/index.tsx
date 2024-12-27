import { shortAddress } from "@/shared/utils/transactions";
import Switch from "@/ui/components/switch";
import { useCreateBtcLeapRgbppTxCallback } from "@/ui/hooks/transactions";
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
import s from "./styles.module.scss";
import { CKBTokenInfo } from "@/shared/networks/ckb/types";
import ShortBalance from "@/ui/components/ShortBalance";
import TextAvatar from "@/ui/components/text-avatar/component";
import { RgbppAsset } from "@/shared/interfaces/rgbpp";
import { useControllersState } from "@/ui/states/controllerState";
import AddressInput from "../../send/create-send/address-input";
import FeeInput from "../../send/create-send/fee-input";
import AddressBookModal from "../../send/create-send/address-book-modal";
import { calculateScriptPack, toHexString } from "@/background/utils";
import { AGGRON4, LINA } from "@/shared/networks";
import { helpers } from "@ckb-lumos/lumos";

export interface FormType {
  address: string;
  amount: string;
  feeAmount: number | string;
  includeFeeInAmount: boolean;
}

const BtcLeapRgbpp = () => {
  const formId = useId();

  const [isOpenModal, setOpenModal] = useState<boolean>(false);
  const [isSaveAddress, setIsSaveAddress] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormType>({
    address: "",
    amount: "",
    includeFeeInAmount: false,
    feeAmount: 10,
  });

  const includeFeeLocked = true;
  const currentAccount = useGetCurrentAccount();
  const currentNetwork = useGetCurrentNetwork();
  const createBtcLeapRgbppTx = useCreateBtcLeapRgbppTxCallback();
  const navigate = useNavigate();
  const location = useLocation();
  const token: CKBTokenInfo = location.state.token;
  const { decimal, symbol } = token.attributes;
  const [loading, setLoading] = useState<boolean>(false);
  const [rgbppAssets, setRgbAssets] = useState<RgbppAsset[]>([]);
  const { apiController } = useControllersState((v) => ({
    apiController: v.apiController,
  }));

  const typeScriptString = useMemo(() => {
    if (token) {
      const { code_hash, hash_type, args } = token.attributes.type_script;
      return toHexString(
        calculateScriptPack({
          codeHash: code_hash,
          hashType: hash_type as any,
          args: args,
        })
      );
    }
  }, [token]);

  useEffect(() => {
    if (typeScriptString) {
      const f = async () => {
        Promise.all(
          currentAccount.accounts.map((account) =>
            apiController.getRgbppAssets(typeScriptString, account.address)
          )
        ).then((assetsArray: RgbppAsset[][]) => {
          setRgbAssets(assetsArray.flat());
        });
      };

      f().catch((e) => {
        console.error(e);
      });
    }
  }, [typeScriptString]);

  const balance = useMemo(() => {
    if (rgbppAssets.length === 0) return 0;
    return (
      rgbppAssets.reduce((acc, asset) => (acc += asset.balance), 0) /
      10 ** Number(decimal)
    );
  }, [rgbppAssets, typeScriptString]);

  const isValidCkbAddress = useCallback(
    (address: string) => {
      // btc -> nervos
      // other btc -> nervos_testnet
      const lumosConfig = currentNetwork.slug === "btc" ? LINA : AGGRON4;
      try {
        helpers.parseAddress(address, {
          config: lumosConfig,
        });
      } catch (error) {
        console.log("invalid address", error);
        return false;
      }
      return true;
    },
    [currentNetwork]
  );

  const isValidForm = useMemo(() => {
    if (!formData.address) return false;
    if (formData.address?.trim().length <= 0) return false;

    // Check CKB address
    if (!isValidCkbAddress(formData.address.trim())) {
      return false;
    }

    if (Number(formData.amount) <= 0) {
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
  }, [formData, balance, token, currentNetwork]);

  const send = async ({
    address,
    amount,
    feeAmount: feeRate,
    includeFeeInAmount,
  }: FormType) => {
    try {
      setLoading(true);
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

      const { fee, rawtx, fromAddresses, isomorphicTx } =
        await createBtcLeapRgbppTx(
          address,
          Number((Number(amount) * 10 ** Number(decimal)).toFixed(0)),
          token.attributes.type_script.args,
          rgbppAssets
        );

      // NOTE: [GA] - Send BTC
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      await Analytics.fireEvent("pf_btc_leap_rgbpp", {
        action: "continue",
        label: fromAddresses.map((z) => shortAddress(z, 3)).join(","),
        amount: Number(amount),
        includeFeeInAmount,
        recipient: shortAddress(address, 3),
        fee: fee,
        include_fee: formData.includeFeeInAmount ? 1 : 0,
        save_address: isSaveAddress ? 1 : 0,
      });

      navigate("/pages/confirm-send-rgbpp", {
        state: {
          toAddress: address,
          amount: Number(amount),
          includeFeeInAmount,
          fromAddresses,
          feeAmount: fee,
          inputedFee: feeRate,
          hex: rawtx,
          save: isSaveAddress,
          token: token,
          isomorphicTx,
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
    }
  }, [location.state, setFormData, balance]);

  const onAmountChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setFormData((prev) => ({
      ...prev,
      amount: normalizeAmount(e.target.value, Number(decimal)),
    }));
    if (balance <= Number(e.target.value)) {
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
      amount: balance?.toLocaleString("fullwide", {
        useGrouping: false,
        maximumFractionDigits: 100,
      }),
      includeFeeInAmount: false,
    }));
  };

  return (
    <div className="flex flex-col justify-between w-full h-full">
      <div className="pt-8 pb-3 flex items-center justify-center">
        {!!token?.attributes?.icon_file ? (
          <img src={token?.attributes?.icon_file} className="w-10 h-10" />
        ) : (
          <TextAvatar text={token?.attributes?.symbol} />
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
              placeHolder="CKB Address/.bit"
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
            </div>
          </div>
        </div>

        <div className={s.feeDiv}>
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

          <Switch
            label={t("send.create_send.include_fee_in_the_amount_label")}
            onChange={(v) =>
              setFormData((prev) => ({ ...prev, includeFeeInAmount: v }))
            }
            value={formData.includeFeeInAmount}
            locked={includeFeeLocked}
            className="flex w-full flex-row-reverse items-center justify-between py-1 capitalize"
          />

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

export default BtcLeapRgbpp;
