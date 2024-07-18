import { shortAddress } from "@/shared/utils/transactions";
import Modal from "@/ui/components/modal";
import { useAppState } from "@/ui/states/appState";
import { MinusCircleIcon } from "@heroicons/react/24/outline";
import { FC } from "react";

import { t } from "i18next";
import s from "./styles.module.scss";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  // setFormData: React.Dispatch<React.SetStateAction<FormType>>;
  setAddress: (address: string) => void;
}

const AddressBookModal: FC<Props> = ({ isOpen, onClose, setAddress }) => {
  const { addressBook, updateAppState } = useAppState((v) => ({
    addressBook: v.addressBook,
    updateAppState: v.updateAppState,
  }));

  const onRemove = async (address: string) => {
    await updateAppState({
      addressBook: addressBook.filter((i) => i !== address),
    });
  };

  const onSelect = (address: string) => {
    setAddress(address);
    onClose();
  };

  return (
    <Modal
      onClose={onClose}
      open={isOpen}
      title={t("send.create_send.address_book.address_book")}
      className="!px-0"
    >
      {!addressBook.length ? (
        <div className={s.empty}>
          {t("send.create_send.address_book.no_addresses")}
        </div>
      ) : undefined}
      <div className={`${s.items} -mx-4`}>
        {addressBook.map((i, idx) => (
          <div key={`ab-${idx}`} className={s.item}>
            <div onClick={() => onSelect(i)} className={s.address}>
              {shortAddress(i, 17)}
            </div>
            <div className={s.remove} onClick={() => onRemove(i)}>
              <MinusCircleIcon className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
};

export default AddressBookModal;
