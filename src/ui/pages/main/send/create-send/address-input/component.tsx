/* eslint-disable @typescript-eslint/no-floating-promises */
import { shortAddress } from "@/shared/utils/transactions";
import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Transition,
} from "@headlessui/react";
import s from "./styles.module.scss";
import { FC, Fragment, useEffect, useState } from "react";
import { useAppState } from "@/ui/states/appState";
import { t } from "i18next";
import { IcnBook } from "@/ui/components/icons/IcnBook";
import cn from "classnames";
import { createInstance } from "dotbit";
import { useGetCurrentNetwork } from "@/ui/states/walletState";
import {
  isBitcoinNetwork,
  isCkbNetwork,
  isDogecoinNetwork,
} from "@/shared/networks";

const dotbit = createInstance();

interface Props {
  address: string;
  onChange: ({ value, isUseDID }: { value: string; isUseDID: boolean }) => void;
  onOpenModal: () => void;
  className?: string;
  placeHolder?: string;
}

const AddressInput: FC<Props> = ({
  address,
  onChange,
  onOpenModal,
  className,
  placeHolder,
}) => {
  const [filtered, setFiltered] = useState<string[]>([]);
  const [didAddresses, setDidAddresses] = useState<string[]>([]);
  const currentNetwork = useGetCurrentNetwork();
  const [inputValue, setInputValue] = useState(address);
  const [requesting, setRequesting] = useState(false);

  const { addressBook } = useAppState();

  const getFiltered = (query: string) => {
    return addressBook.filter((i) => i.startsWith(query));
  };

  useEffect(() => {
    if (inputValue.endsWith(".bit")) {
      if (!requesting) {
        dotbit.records(inputValue).then((records) => {
          setDidAddresses(
            records
              .filter(
                (z) =>
                  (z.key === "address.ckb" &&
                    isCkbNetwork(currentNetwork.network)) ||
                  (z.key === "address.btc" &&
                    isBitcoinNetwork(currentNetwork.network)) ||
                  (z.key === "address.doge" &&
                    isDogecoinNetwork(currentNetwork.network))
              )
              .map((j) => j.value)
          );
          setTimeout(() => {
            setRequesting(false);
          }, 3000);
        });
      }
      setRequesting(true);
    } else {
      onChange({
        value: inputValue,
        isUseDID: didAddresses.includes(inputValue),
      });
      setFiltered(getFiltered(inputValue));
    }
  }, [inputValue, requesting]);

  useEffect(() => {
    setInputValue(address);
  }, [address]);

  return (
    <div
      className={cn(
        `flex gap-2 relative items-center bg-grey-200 rounded-lg border border-grey-200 focus-within:bg-grey-300 ${
          className ? className : ""
        }`
      )}
    >
      <Combobox
        value={inputValue}
        onChange={(add) => {
          if (add) {
            setInputValue(add);
          }
        }}
      >
        <div className="w-full">
          <ComboboxInput
            displayValue={(value: string) => value}
            autoComplete="off"
            className="w-full bg-transparent p-4 text-base font-normal"
            value={inputValue}
            placeholder={
              placeHolder ??
              t("send.create_send.address_input.address_placeholder")
            }
            onChange={(v) => {
              setInputValue(v.target.value.trim());
            }}
          />

          {/* {hasBit && (
            <div className="rounded-[16px] border border-[#F5F5F5] p-4 break-all text-center text-[14px] leading-[18px] text-primary">
              <b>D.id Address: </b>
              {address}
            </div>
          )} */}

          {[...filtered, ...didAddresses].length > 0 ? (
            <div className="w-[calc(100%+32px)] px-4 absolute -left-4 z-10">
              <Transition
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <ComboboxOptions className={s.addressbookoptions}>
                  {[...filtered, ...didAddresses].map((add) => (
                    <ComboboxOption
                      className={s.addressbookoption}
                      key={add}
                      value={add}
                    >
                      {shortAddress(add, 14)}
                    </ComboboxOption>
                  ))}
                </ComboboxOptions>
              </Transition>
            </div>
          ) : (
            ""
          )}
        </div>
      </Combobox>
      <div className="px-2">
        <IcnBook
          className="w-8 h-8 cursor-pointer"
          onClick={() => {
            onOpenModal();
          }}
        />
      </div>
    </div>
  );
};

export default AddressInput;
