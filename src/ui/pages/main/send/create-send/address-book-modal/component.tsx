import { shortAddress } from "@/shared/utils/transactions";
import Modal from "@/ui/components/modal";
import { useAppState } from "@/ui/states/appState";
import { FC } from "react";

import { t } from "i18next";
import s from "./styles.module.scss";
import { IcnDelete } from "@/ui/components/icons/IcnDelete";

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
      className="!px-0 capitalize"
    >
      {!addressBook.length ? (
        <div className={s.empty}>
          {t("send.create_send.address_book.no_addresses")}
        </div>
      ) : undefined}
      <div className={`${s.items} -mx-0 !mt-0`}>
        {addressBook.map((i, idx) => (
          <div
            key={`ab-${idx}`}
            className={`${s.item} justify-between items-center`}
          >
            <div onClick={() => onSelect(i)} className={s.address}>
              {shortAddress(i, 15)}
            </div>
            <div
              className="w-8 h-8 flex items-center justify-center"
              onClick={() => onRemove(i)}
            >
              <IcnDelete className="w-4 h-4" />
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
};

export default AddressBookModal;
