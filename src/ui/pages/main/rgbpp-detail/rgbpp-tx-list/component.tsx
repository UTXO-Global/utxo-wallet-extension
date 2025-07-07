import s from "./styles.module.scss";
import {
  shortAddress,
  isIncomeTx,
  getTransactionValue,
  getTransactionTokenValue,
  isTxToken,
  isDobTx,
  getTransactionDobValue,
} from "@/shared/utils/transactions";
import { t } from "i18next";
import { Link } from "react-router-dom";
import cn from "classnames";
import { useInView } from "react-intersection-observer";
import { useEffect, useMemo, useState } from "react";
import { useControllersState } from "@/ui/states/controllerState";
import Loading from "react-loading";
import ShortBalance from "@/ui/components/ShortBalance";
import NoTxIcon from "./NoTxIcon";
import IcnTxReceive from "./IcnTxReceive";
import { ITransaction } from "@/shared/interfaces/api";

type TxType = { key: string; title: string; data: ITransaction[] };
const RgbppTxList = ({
  className,
  typeHash,
}: {
  className?: string;
  typeHash: string;
}) => {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const { ref } = useInView();
  const { apiController } = useControllersState((v) => ({
    apiController: v.apiController,
  }));

  useEffect(() => {
    const f = async () => {
      const block = await apiController.getLastBlock();
    };

    f().catch((e) => {
      console.log(e);
    });
  }, [apiController]);

  useEffect(() => {
    setLoading(true);
    apiController
      .getRgbppTxsFromExplorer({
        typeHash,
      })
      .then((txs) => {
        setTransactions(txs);
        setLoading(false);
      })
      .catch((e) => {
        setLoading(false);
        console.error(e);
      });
  }, [typeHash]);

  if (!Array.isArray(transactions)) {
    return (
      <p className={s.noTransactions}>{t("wallet_page.no_transactions")}</p>
    );
  }

  const txes = useMemo(() => {
    const txesMap: { [key: string]: TxType } = transactions.reduce(
      (acc, item) => {
        let date = "unconfirmation";
        if (item.status.confirmed) {
          let blockTime = item.status.block_time;
          if (blockTime.toString().length <= 10) {
            blockTime = blockTime * 1000;
          }
          const d = new Date(blockTime);
          date = d.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          });
        }

        if (!acc[date]) {
          acc[date] = {
            key: date,
            title:
              date === "unconfirmation" ? "Waiting for Confirmation" : date,
            data: [],
          };
        }

        acc[date].data.push(item);
        return acc;
      },
      {}
    );

    const unconfirmation = txesMap["unconfirmation"];
    delete txesMap["unconfirmation"];

    const results = Object.keys(txesMap)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .reduce((acc: TxType[], key) => {
        acc.push({ ...txesMap[key] });
        return acc;
      }, []);

    if (unconfirmation) {
      results.unshift({ ...unconfirmation });
    }
    return results;
  }, [transactions]);

  const NoTransaction = () => {
    return (
      <div className={s.noTransactions}>
        {t("wallet_page.no_transactions")}
        <NoTxIcon />
      </div>
    );
  };

  const ICon = ({ isReceived = false }: { isReceived?: boolean }) => {
    return (
      <IcnTxReceive
        className={cn(`w-6 h-6 rounded-full`, {
          "rotate-180": !isReceived,
        })}
      />
    );
  };

  return (
    <div
      className={cn(
        `flex flex-col gap-2 px-4 bg-white ${className ? className : ""}`
      )}
    >
      <div className="text-base font-medium sticky top-[65px] standard:top-0 z-10 bg-light-100">
        Activities
      </div>

      {loading ? (
        <div className="flex justify-center">
          <Loading
            type="spin"
            color="#ODODOD"
            width={"2rem"}
            height={"2rem"}
            className="react-loading pr-2"
          />
        </div>
      ) : !txes.length ? (
        <NoTransaction />
      ) : (
        <div className="border border-grey-300 rounded-lg px-3 standard:pb-[50px] mt-2">
          <div className={s.transactionsDiv}>
            {txes.map((item) => {
              const currentDate = new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              });
              return (
                <div
                  className="flex flex-col gap-2 w-full pt-3 pb-2"
                  key={`tx-date-${item.key}`}
                >
                  <div
                    className={cn("text-sm font-normal w-full text-left", {
                      "text-[#FF4545]": item.key === "unconfirmation",
                    })}
                  >
                    {item.key === currentDate ? "Today" : item.title}
                  </div>
                  <div className="">
                    {item.data.map((t, index) => {
                      const isReceived = isIncomeTx(t, t.address);
                      let amount = "",
                        symbol = "";

                      if (isTxToken(t)) {
                        const v = getTransactionTokenValue(t, t.address);
                        amount = v.amount.toString();
                        symbol = v.symbol;
                      } else if (isDobTx(t)) {
                        const v = getTransactionDobValue(t, t.address);
                        amount = v.amount.toString();
                        symbol = v.symbol;
                      } else {
                        amount = getTransactionValue(t, t.address, 5);
                        symbol = "CKB"; // Default symbol for CKB transactions
                      }

                      return (
                        <Link
                          className={s.transaction}
                          key={index}
                          to={`/pages/rgbpp/transaction-info/${t.txid}`}
                          state={{
                            transaction: t,
                          }}
                        >
                          <div className="flex gap-2 items-center justify-between">
                            <ICon isReceived={isReceived} />
                            <div>
                              <div className="text-base">
                                {isReceived ? "Received" : "Sent"}
                              </div>
                              <div className="text-[#787575] text-sm font-normal">
                                {isReceived ? "From" : "To"}{" "}
                                {isReceived
                                  ? shortAddress(
                                      t.vin[0].prevout.scriptpubkey_address,
                                      3
                                    )
                                  : shortAddress(
                                      t.vout[0].scriptpubkey_address,
                                      3
                                    )}
                              </div>
                            </div>
                          </div>
                          <div
                            className="font-normal text-sm flex items-center gap-1"
                            style={{
                              color: isReceived ? "#09C148" : "#FF4545",
                            }}
                          >
                            <span className="w-[120px] truncate block text-right">
                              {isReceived ? "+" : "-"}
                              <ShortBalance
                                balance={Math.abs(
                                  Number(amount.toString().replace(/,/g, ""))
                                )}
                                zeroDisplay={6}
                                isDot={true}
                                className="!text-sm !inline-block"
                              />
                            </span>
                            <span className="text-primary flex-1">
                              {symbol}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            <div ref={ref}></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RgbppTxList;
