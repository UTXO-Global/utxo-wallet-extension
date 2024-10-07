import { shortAddress } from "@/shared/utils/transactions";
import { Combobox, Transition } from "@headlessui/react";
import s from "./styles.module.scss";
import { FC, Fragment, useState } from "react";
import { useAppState } from "@/ui/states/appState";
import { t } from "i18next";
import { IcnBook } from "@/ui/components/icons/IcnBook";
import cn from "classnames";

interface Props {
  address: string;
  onChange: (value: string) => void;
  onOpenModal: () => void;
  className?: string;
}

const AddressInput: FC<Props> = ({
  address,
  onChange,
  onOpenModal,
  className,
}) => {
  const [filtered, setFiltered] = useState([]);

  const { addressBook } = useAppState((v) => ({
    addressBook: v.addressBook,
  }));

  const getFiltered = (query: string) => {
    return addressBook.filter((i) => i.startsWith(query));
  };

  return (
    <div
      className={cn(
        `flex gap-2 items-center bg-grey-200 rounded-lg border border-grey-200 focus-within:bg-grey-300 ${
          className ? className : ""
        }`
      )}
    >
      <Combobox value={address} onChange={onChange}>
        <div className="relative w-full">
          <Combobox.Input
            displayValue={(address: string) => address}
            autoComplete="off"
            className="w-full bg-transparent p-4 text-base font-normal"
            value={address}
            placeholder={t(
              "send.create_send.address_input.address_placeholder"
            )}
            onChange={(v) => {
              onChange(v.target.value.trim());
              setFiltered(getFiltered(v.target.value.trim()));
            }}
          />

          {filtered.length > 0 ? (
            <div className="w-[100vw] px-4 absolute -left-4 z-10">
              <Transition
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Combobox.Options className={s.addressbookoptions}>
                  {filtered.map((address) => (
                    <Combobox.Option
                      className={s.addressbookoption}
                      key={address}
                      value={address}
                    >
                      {shortAddress(address, 14)}
                    </Combobox.Option>
                  ))}
                </Combobox.Options>
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
