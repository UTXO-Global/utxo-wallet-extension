import { ITransaction } from "@/shared/interfaces/api";
import { isCkbNetwork } from "@/shared/networks";
import { browserTabsCreate } from "@/shared/utils/browser";
import { shortAddress } from "@/shared/utils/transactions";
import Modal from "@/ui/components/modal";
import {
  useGetCurrentAccount,
  useGetCurrentNetwork,
} from "@/ui/states/walletState";
import { LinkIcon } from "@heroicons/react/24/outline";
import cn from "classnames";
import { t } from "i18next";
import { FC, useId, useMemo, useState } from "react";
import toast from "react-hot-toast";
import ReactLoading from "react-loading";
import { useLocation } from "react-router-dom";
import s from "./styles.module.scss";

const TransactionInfo = () => {
  const [openModal, setOpenModal] = useState<boolean>(false);
  const currentNetwork = useGetCurrentNetwork();
  const currentAccount = useGetCurrentAccount();

  const {
    state: { transaction, lastBlock },
  } = useLocation();
  const tx = transaction as ITransaction;

  const onOpenExplorer = async () => {
    await browserTabsCreate({
      url: `${currentNetwork.explorerUrl}/${
        isCkbNetwork(currentNetwork.network) ? "transaction" : "tx"
      }/${transaction.txid}`,
      active: true,
    });
  };

  const filteredInput = useMemo(() => {
    const txValues: Record<string, number> = {};

    tx.vin.forEach((i) => {
      if (txValues[i.prevout?.scriptpubkey_address]) {
        txValues[i.prevout?.scriptpubkey_address] += i.prevout?.value;
      } else {
        txValues[i.prevout?.scriptpubkey_address] = i.prevout?.value;
      }
    });

    return Object.entries(txValues).map((i) => ({
      scriptpubkey_address: i[0],
      value: i[1],
    }));
  }, [tx]);

  return (
    <div className={s.transactionInfoDiv}>
      {transaction ? (
        <>
          <div className={s.transaction}>
            <div className={s.group}>
              <p className={s.transactionP}>{t("transaction_info.txid")}</p>

              <span>{tx.txid}</span>
            </div>
            <div className={s.group}>
              <p className={s.transactionP}>
                {t("transaction_info.confirmations_label")}
              </p>
              <span>
                {tx.status.confirmed ? lastBlock - tx.status.block_height : 0}
              </span>
            </div>
            <div className={s.group}>
              <p className={s.transactionP}>
                {t("transaction_info.fee_label")}
              </p>
              <span>
                {tx.fee / 10 ** 8} {currentNetwork.coinSymbol}
              </span>
            </div>
            <div className={s.group}>
              <p className={s.transactionP}>
                {t("transaction_info.value_label")}
              </p>
              <span>
                {tx.vout.reduce((acc, cur) => cur.value + acc, 0) / 10 ** 8}{" "}
                {currentNetwork.coinSymbol}
              </span>
            </div>

            <div className={s.summary} onClick={() => setOpenModal(true)}>
              <LinkIcon className="w-4 h-4" /> {t("transaction_info.details")}
            </div>

            <Modal
              onClose={() => setOpenModal(false)}
              open={openModal}
              title={t("transaction_info.details")}
            >
              <div className={s.tableContainer}>
                <TableItem
                  label={t("transaction_info.inputs")}
                  currentAddress={currentAccount.accounts[0].address}
                  items={filteredInput}
                />
                <TableItem
                  label={t("transaction_info.outputs")}
                  currentAddress={currentAccount.accounts[0].address}
                  items={tx.vout}
                />
              </div>
            </Modal>
          </div>
          <button className={s.explorerBtn} onClick={onOpenExplorer}>
            {t("transaction_info.open_in_explorer")}
          </button>
        </>
      ) : (
        <ReactLoading type="spin" color="#ODODOD" />
      )}
    </div>
  );
};

interface ITableItem {
  items: {
    scriptpubkey_address: string;
    value: number;
  }[];
  currentAddress?: string;
  label: string;
}

const TableItem: FC<ITableItem> = ({ items, currentAddress, label }) => {
  const currentId = useId();

  const addressLength = (value: number) => {
    const newValue = (value / 10 ** 8).toFixed(2);
    if (newValue.length > 7) {
      return 9;
    }
    return 12;
  };

  return (
    <div className={s.table}>
      <h3>{label}:</h3>
      <div className={s.tableList}>
        {items.map((i, idx) => (
          <div key={`${currentId}${idx}`} className={s.tableGroup}>
            <div
              className={cn(
                {
                  [s.active]: i.scriptpubkey_address === currentAddress,
                },
                s.tableFirst
              )}
              onClick={async () => {
                await navigator.clipboard.writeText(i.scriptpubkey_address);
                toast.success(t("transaction_info.copied"));
              }}
              title={i.scriptpubkey_address}
            >
              {shortAddress(i.scriptpubkey_address, addressLength(i.value))}
            </div>
            <div className={s.tableSecond}>
              {(i.value / 10 ** 8).toFixed(2)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransactionInfo;
