import { ITransaction } from "@/shared/interfaces/api";
import { DOB_PROTOCOL_VERSIONS, isCkbNetwork } from "@/shared/networks";
import { browserTabsCreate } from "@/shared/utils/browser";
import {
  getTransactionDobValue,
  getTransactionTokenValue,
  getTransactionValue,
  isDobTx,
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
import { getDob0Imgs, getURLFromHex } from "@/ui/utils/dob";

const TransactionInfo = () => {
  const [openModal, setOpenModal] = useState<boolean>(false);
  const currentNetwork = useGetCurrentNetwork();
  const currentAccount = useGetCurrentAccount();

  const {
    state: { transaction, lastBlock },
  } = useLocation();

  const getDobImage = (nftId: string, data: string): any => {
    try {
      const { url: imageUrl, contentType } = getURLFromHex(
        data,
        currentNetwork
      );
      if (DOB_PROTOCOL_VERSIONS.includes(contentType)) {
        getDob0Imgs([nftId], currentNetwork).then((res) => {
          Object.keys(res).forEach((id) => {
            return {
              imageUrl: res[id].url,
              contentType: res[id].contentType,
              name: "",
            };
          });
        });
      }

      return { imageUrl, contentType, name: "" };
    } catch (e) {
      console.log(e);
    }
  };

  const tx = useMemo(() => {
    return transaction as ITransaction;
  }, [transaction]);

  const isTokenTransaction = useMemo(() => {
    return isTxToken(tx);
  }, [tx]);

  const isDobTransaction = useMemo(() => {
    return isDobTx(tx);
  }, [tx]);

  const txValue = useMemo(() => {
    if (isTokenTransaction) {
      const v = getTransactionTokenValue(tx, tx.address);
      return { amount: v.amount.toString(), symbol: v.symbol };
    } else if (isDobTransaction) {
      const v = getTransactionDobValue(tx, tx.address);
      return { amount: "1", symbol: v.name, data: v.data, tokenId: v.tokenId };
    } else {
      return {
        amount: getTransactionValue(tx, tx.address, 5),
        symbol: currentNetwork.coinSymbol,
      };
    }
  }, [isTokenTransaction, isDobTransaction, tx, currentNetwork.coinSymbol]);

  const dobImage = useMemo(() => {
    if (isDobTransaction && txValue) {
      const dobImg = getDobImage(txValue.tokenId, txValue.data);
      dobImg.name = txValue.symbol;
      return dobImg;
    }

    return {};
  }, [txValue, isDobTransaction]);

  const onOpenExplorer = async () => {
    await browserTabsCreate({
      url: `${currentNetwork.explorerUrl}/${
        isCkbNetwork(currentNetwork.network) ? "transaction" : "tx"
      }/${tx.txid}`,
      active: true,
    });
  };

  const filteredInput = useMemo(() => {
    const txValues: {
      address: string;
      symbol: string;
      value: number;
      data?: string;
      tokenId?: string;
      isDob: boolean;
    }[] = [];

    tx.vin.forEach((i) => {
      const item = {
        address: i.prevout?.scriptpubkey_address,
        symbol: currentNetwork.coinSymbol,
        value: 0,
        data: "",
        tokenId: "",
        isDob: false,
      };

      if (i.extra_info) {
        item.symbol = i.extra_info.symbol;
        item.value =
          Number(i.extra_info.amount || 0) / 10 ** Number(i.extra_info.decimal);
        item.data = i.extra_info.data;
        item.tokenId = i.extra_info.token_id;
        item.isDob = !!item.data && !!item.tokenId;
      } else {
        item.value = i.prevout?.value / 10 ** 8;
      }
      txValues.push(item);
    });

    return txValues;
  }, [tx]);

  const filteredOutput = useMemo(() => {
    const txValues: {
      address: string;
      symbol: string;
      value: number;
      data: string;
      tokenId: string;
      isDob: boolean;
    }[] = [];

    tx.vout.forEach((i) => {
      const item = {
        address: i.scriptpubkey_address,
        symbol: currentNetwork.coinSymbol,
        value: 0,
        data: "",
        tokenId: "",
        isDob: false,
      };

      if (i.extra_info) {
        item.symbol = i.extra_info.symbol;
        item.value =
          Number(i.extra_info.amount || 0) / 10 ** Number(i.extra_info.decimal);
        item.data = i.extra_info.data;
        item.tokenId = i.extra_info.token_id;
        item.isDob = !!item.data && !!item.tokenId;
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
                  dobImage={dobImage}
                />
                <TableItem
                  label={t("transaction_info.outputs")}
                  currentAddress={currentAccount.accounts[0].address}
                  items={filteredOutput}
                  dobImage={dobImage}
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
    data?: string;
    tokenId?: string;
    isDob?: boolean;
  }[];
  currentAddress?: string;
  label: string;
  dobImage?: any;
}

const TableItem: FC<ITableItem> = ({
  items,
  currentAddress,
  label,
  dobImage,
}) => {
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
              {i.isDob && dobImage ? (
                <img
                  src={dobImage?.imageUrl || "/nft-default.png"}
                  alt={dobImage?.name}
                  className="max-w mix-blend-multiply rounded-t-lg w-8"
                />
              ) : (
                formatNumber(i.value, 3, 8)
              )}{" "}
              {i.symbol}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransactionInfo;
