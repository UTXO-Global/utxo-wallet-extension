import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { FC, Fragment } from "react";
import cn from "classnames";

interface Props {
  setSelected: ({ name, value }) => void;
  values: { name: string; value?: string }[];
  selected: any;
  disabled?: boolean;
  label?: string;
  displayCheckIcon?: boolean;
  className?: string;
}

const Select: FC<Props> = ({
  selected,
  setSelected,
  disabled,
  values,
  label,
  displayCheckIcon = true,
  className,
}) => {
  return (
    <div className={className ?? ""}>
      <Listbox value={selected} onChange={setSelected} disabled={disabled}>
        <div className={`relative mt-1 w-full`}>
          <Listbox.Button
            className={cn(
              `relative text-primary font-medium cursor-pointer w-full rounded-lg bg-[#EBECEC] p-4 focus:outline-none text-base flex justify-between items-center`,
              {
                "!cursor-not-allowed": disabled,
              }
            )}
          >
            <span className="block truncate">{label}</span>
            <div className="flex gap-1 items-center">
              <span>{selected.name}</span>
              <ChevronDownIcon className={cn(`h-4 w-4 text-[#787575]`, {})} />
            </div>
          </Listbox.Button>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-lg bg-[#EBECEC] p-2 z-[10]">
              {values.map((value, valueIdx) => (
                <Listbox.Option
                  key={valueIdx}
                  className={({ active }) =>
                    `relative hover:bg-[#F5F5F5] cursor-pointer font-medium select-none rounded-lg px-4 py-3 flex justify-between ${
                      active ? "bg-[#F5F5F5] text-primary" : "text-primary"
                    }`
                  }
                  value={value}
                >
                  {({ selected }) => (
                    <>
                      <span className={`block truncate `}>{value.name}</span>
                      {selected && displayCheckIcon ? (
                        <CheckIcon className="h-6 w-6" aria-hidden="true" />
                      ) : null}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
};

export default Select;
