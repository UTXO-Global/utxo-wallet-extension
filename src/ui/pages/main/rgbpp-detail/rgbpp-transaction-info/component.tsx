import { ITransaction } from "@/shared/interfaces/api";
import { getNetworkDataBySlug, isCkbNetwork } from "@/shared/networks";
import { browserTabsCreate } from "@/shared/utils/browser";
import {
  getTransactionTokenValue,
  getTransactionValue,
  isTxToken,
  shortAddress,
} from "@/shared/utils/transactions";
import Modal from "@/ui/components/modal";
import {
  useGetCurrentAccount,
  useGetCurrentNetwork,
} from "@/ui/states/walletState";
import { LinkIcon } from "@heroicons/react/24/outline";
import { t } from "i18next";
import { FC, useId, useMemo, useState } from "react";
import toast from "react-hot-toast";
import ReactLoading from "react-loading";
import { useLocation } from "react-router-dom";
import s from "./styles.module.scss";
import { formatNumber } from "@/shared/utils";
import { NetworkData } from "@/shared/networks/types";

const RgbppTransactionInfo = () => {
  const [openModal, setOpenModal] = useState<boolean>(false);
  const currentNetwork = useGetCurrentNetwork();
  const currentAccount = useGetCurrentAccount();

  const ckbNetwork: NetworkData = useMemo(() => {
    const ckbNetworkSlug =
      currentNetwork.slug === "btc" ? "nervos" : "nervos_testnet";
    return getNetworkDataBySlug(ckbNetworkSlug);
  }, [currentNetwork]);

  const {
    state: { transaction },
  } = useLocation();

  const tx = useMemo(() => {
    return transaction as ITransaction;
  }, [transaction]);

  const isTokenTransaction = useMemo(() => {
    return isTxToken(tx);
  }, [tx]);

  const txValue = useMemo(() => {
    if (isTokenTransaction) {
      const v = getTransactionTokenValue(tx, tx.address);
      return { amount: v.amount.toString(), symbol: v.symbol };
    } else {
      return {
        amount: getTransactionValue(tx, tx.address, 5),
        symbol: ckbNetwork.coinSymbol,
      };
    }
  }, [isTokenTransaction]);

  const onOpenExplorer = async () => {
    await browserTabsCreate({
      url: `${ckbNetwork.explorerUrl}/${
        isCkbNetwork(ckbNetwork.network) ? "transaction" : "tx"
      }/${tx.txid}`,
      active: true,
    });
  };

  const filteredInput = useMemo(() => {
    const txValues: { address: string; symbol: string; value: number }[] = [];

    tx.vin.forEach((i) => {
      const item = {
        address: i.prevout?.scriptpubkey_address,
        symbol: ckbNetwork.coinSymbol,
        value: 0,
      };

      if (i.extra_info) {
        item.symbol = i.extra_info.symbol;
        item.value =
          Number(i.extra_info.amount || 0) / 10 ** Number(i.extra_info.decimal);
      } else {
        item.value = i.prevout?.value / 10 ** 8;
      }
      txValues.push(item);
    });

    return txValues;
  }, [tx]);

  const filteredOutput = useMemo(() => {
    const txValues: { address: string; symbol: string; value: number }[] = [];

    tx.vout.forEach((i) => {
      const item = {
        address: i.scriptpubkey_address,
        symbol: ckbNetwork.coinSymbol,
        value: 0,
      };

      if (i.extra_info) {
        item.symbol = i.extra_info.symbol;
        item.value =
          Number(i.extra_info.amount || 0) / 10 ** Number(i.extra_info.decimal);
      } else {
        item.value = i.value / 10 ** 8;
      }
      txValues.push(item);
    });

    return txValues;
  }, [tx]);

  return (
    <div className={s.transactionInfoDiv}>
      {transaction ? (
        <>
          <div className={s.transaction}>
            <div className={s.group}>
              <p className={s.transactionP}>{t("transaction_info.txid")}</p>

              <span className="!text-sm">{tx.txid}</span>
            </div>
            <div className={s.group}>
              <p className={s.transactionP}>
                {t("transaction_info.fee_label")}
              </p>
              <span>
                {tx.fee / 10 ** 8} {ckbNetwork.coinSymbol}
              </span>
            </div>
            <div className={s.group}>
              <p className={s.transactionP}>
                {t("transaction_info.value_label")}
              </p>
              <span>
                {txValue.amount} {txValue.symbol}
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
                  items={filteredOutput}
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
    address: string;
    symbol: string;
    value: number;
  }[];
  currentAddress?: string;
  label: string;
}

const TableItem: FC<ITableItem> = ({ items, currentAddress, label }) => {
  const currentId = useId();
  return (
    <div className={s.table}>
      <h3 className="text-base font-medium text-primary sticky top-0 bg-white pb-2">
        {label}:
      </h3>
      <div className={s.tableList}>
        {items.map((i, idx) => (
          <div
            key={`${currentId}${idx}`}
            className="bg-grey-300 p-4 border border-grey-200 rounded-lg"
          >
            <div
              className="text-[#787575] text-base font-medium cursor-pointer"
              onClick={async () => {
                await navigator.clipboard.writeText(i.address);
                toast.success(t("transaction_info.copied"));
              }}
              title={i.address}
            >
              {shortAddress(i.address, 12)}
            </div>
            <div className="text-primary text-sm">
              {formatNumber(i.value, 3, 8)} {i.symbol}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RgbppTransactionInfo;
