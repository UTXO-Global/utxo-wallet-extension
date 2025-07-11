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
import {
  useGetCurrentAccount,
  useGetCurrentNetwork,
} from "@/ui/states/walletState";
import cn from "classnames";
import { useInView } from "react-intersection-observer";
import { useEffect, useMemo, useState } from "react";
import { useControllersState } from "@/ui/states/controllerState";
import { ITransaction } from "@/shared/interfaces/api";
import {
  DOB_PROTOCOL_VERSIONS,
  isBitcoinNetwork,
  isCkbNetwork,
  isDogecoinNetwork,
} from "@/shared/networks";
import ShortBalance from "../ShortBalance";
import Loading from "react-loading";
import { getDob0Imgs, getURLFromHex } from "@/ui/utils/dob";
import { IcnNoTransaction } from "./icons";

const TransactionList = ({
  className,
  type,
  typeHash,
}: {
  className?: string;
  type?: string;
  typeHash?: string;
}) => {
  const [loading, setLoading] = useState(true);
  const [lastBlock, setLastBlock] = useState(0);
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const { ref, inView } = useInView();
  const currentNetwork = useGetCurrentNetwork();
  const currentAccount = useGetCurrentAccount();
  const { apiController } = useControllersState((v) => ({
    apiController: v.apiController,
  }));

  const isCKB = useMemo(() => {
    return type === typeHash && type === undefined;
  }, [type, typeHash]);

  useEffect(() => {
    const f = async () => {
      const block = await apiController.getLastBlock();
      setLastBlock(block);
    };

    f().catch((e) => {
      console.log(e);
    });
  }, [apiController]);

  useEffect(() => {
    const f = async () => {
      try {
        setLoading(true);
        if (
          isBitcoinNetwork(currentNetwork.network) ||
          isDogecoinNetwork(currentNetwork.network)
        ) {
          setTransactions(await apiController.getTransactions());
        } else if (isCkbNetwork(currentNetwork.network)) {
          const txes = await apiController.getCKBTransactions({
            address: currentAccount.accounts[0].address,
            network: currentNetwork.slug,
            type,
            typeHash,
          });

          setTransactions(txes);
        }
        setLoading(false);
      } catch (e) {
        setLoading(false);
        setTransactions([]);
      }
    };

    f().catch((e) => {
      console.log(e);
    });
  }, [currentNetwork, type, typeHash, currentAccount]);

  if (!Array.isArray(transactions)) {
    return (
      <p className={s.noTransactions}>{t("wallet_page.no_transactions")}</p>
    );
  }

  const txes: { key: string; title: string; data: any[] }[] = useMemo(() => {
    const txesMap = transactions.reduce((acc, item) => {
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
          title: date === "unconfirmation" ? "Waiting for Confirmation" : date,
          data: [],
        };
      }

      acc[date].data.push(item);
      return acc;
    }, {} as any);

    const unconfirmation = txesMap["unconfirmation"];
    delete txesMap["unconfirmation"];

    const results = Object.keys(txesMap)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .reduce((acc, key) => {
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
        <IcnNoTransaction />
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

  return (
    <div
      className={cn(
        `flex flex-col gap-2 px-4 bg-white ${className ? className : ""}`
      )}
    >
      <div className="text-base font-medium sticky top-[65px] standard:top-0 z-10 bg-light-100">
        {t("components.layout.activities")}
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
                    {item.data.map((tx, index) => {
                      const isReceived = isIncomeTx(tx, tx.address);
                      const isDobTransaction = isDobTx(tx);
                      let amount = "",
                        symbol = currentNetwork.coinSymbol;
                      let dobImg = undefined;
                      if (isTxToken(tx)) {
                        const v = getTransactionTokenValue(tx, tx.address);
                        amount = v.amount.toString();
                        symbol = v.symbol;
                      } else if (isDobTransaction) {
                        const dobValue = getTransactionDobValue(tx, tx.address);
                        dobImg = getDobImage(dobValue.tokenId, dobValue.data);
                        dobImg.name = dobValue.name;
                      } else {
                        amount = getTransactionValue(tx, tx.address, 5);
                      }

                      return (
                        <Link
                          className={s.transaction}
                          key={index}
                          to={`/pages/transaction-info/${tx.txid}`}
                          state={{
                            transaction: tx,
                            lastBlock,
                          }}
                        >
                          <div className="flex gap-2 items-center justify-between">
                            <ICon isReceived={isReceived} />
                            <div>
                              <div className="text-base">
                                {isReceived
                                  ? t("components.layout.received")
                                  : t("components.layout.sent")}
                              </div>
                              <div className="text-[#787575] text-sm font-normal">
                                {isReceived
                                  ? t("components.layout.from")
                                  : t("components.layout.to")}{" "}
                                {isReceived
                                  ? shortAddress(
                                      tx.vin[0].prevout.scriptpubkey_address,
                                      3
                                    )
                                  : shortAddress(
                                      tx.vout[0].scriptpubkey_address,
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
                            {!isDobTransaction && (
                              <>
                                <span className="w-[120px] truncate block text-right">
                                  {isReceived ? "+" : "-"}
                                  <ShortBalance
                                    balance={Math.abs(
                                      Number(
                                        amount.toString().replace(/,/g, "")
                                      )
                                    )}
                                    zeroDisplay={6}
                                    isDot={true}
                                    className="!text-sm !inline-block"
                                  />
                                </span>
                                <span className="text-primary flex-1">
                                  {`${symbol || currentNetwork.coinSymbol}`}
                                </span>
                              </>
                            )}

                            {isDobTransaction && (
                              <img
                                src={dobImg?.imageUrl || "/nft-default.png"}
                                alt={dobImg?.name}
                                className={cn(
                                  "max-w mix-blend-multiply rounded-t-lg w-8"
                                )}
                              />
                            )}
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

export default TransactionList;

const IcnTxReceive = ({ className }: { className?: string }) => {
  return (
    <svg
      className={`${className}`}
      width="30"
      height="30"
      viewBox="0 0 30 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="29.5"
        y="29.5"
        width="29"
        height="29"
        rx="14.5"
        transform="rotate(180 29.5 29.5)"
        fill="#0D0D0D"
      />
      <rect
        x="29.5"
        y="29.5"
        width="29"
        height="29"
        rx="14.5"
        transform="rotate(180 29.5 29.5)"
        stroke="white"
      />
      <path
        d="M15 20L15 10M15 20L10 15M15 20L20 15"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
